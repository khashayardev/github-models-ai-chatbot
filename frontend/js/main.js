/**
 * Main Application Entry Point
 * Initializes and orchestrates all modules
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    initApplication();
});

let currentChatId = null;
let currentMessages = [];
let currentModel = APP_CONFIG?.app?.defaultModel || 'gpt-4o';
let isProcessing = false;

/**
 * Initialize the application
 */
async function initApplication() {
    console.log('Initializing AI ChatBot...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved settings
    loadSettings();
    
    // Load available models
    await renderModelSelector();
    
    // Load saved chats
    loadChatHistory();
    
    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Setup auto-resize for textarea
    setupAutoResize();
    
    // Setup connection status
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));
    updateConnectionStatus(navigator.onLine);
    
    console.log('Application initialized successfully');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Send message on Enter (Shift+Enter for new line)
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Send button click
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
    
    // Clear chat button
    const clearChatBtn = document.getElementById('clearChatBtn');
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearCurrentChat);
    
    // Export chat button
    const exportChatBtn = document.getElementById('exportChatBtn');
    if (exportChatBtn) exportChatBtn.addEventListener('click', exportChat);
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Settings modal
    setupSettingsModal();
}

/**
 * Send user message to AI
 */
async function sendMessage() {
    if (isProcessing) {
        showNotification('لطفاً صبر کنید، در حال پردازش درخواست قبلی...', 'warning');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Add user message to UI
    addMessageToUI('user', message);
    
    // Save to current chat
    currentMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });
    
    // Show typing indicator
    showTypingIndicator(true);
    isProcessing = true;
    
    try {
        // Get model parameters
        const temperature = parseFloat(localStorage.getItem('temperature') || '0.7');
        const maxTokens = parseInt(localStorage.getItem('maxTokens') || '1000');
        
        // Prepare conversation history (last 10 messages for context)
        const history = currentMessages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Send to GitHub API
        const workflowRun = await api.sendChatMessage(message, currentModel, history);
        
        if (workflowRun) {
            // Poll for response
            const response = await api.pollForResponse(workflowRun.id);
            
            if (response && response.success) {
                // Add AI response to UI
                addMessageToUI('assistant', response.response, {
                    model: response.model,
                    processingTime: response.processing_time,
                    tokens: response.estimated_tokens
                });
                
                // Save to current chat
                currentMessages.push({
                    role: 'assistant',
                    content: response.response,
                    model: response.model,
                    timestamp: new Date().toISOString()
                });
                
                // Update token info display
                if (response.estimated_tokens) {
                    updateTokenInfo(response.estimated_tokens);
                }
            } else {
                throw new Error(response?.error || 'Failed to get response');
            }
        } else {
            throw new Error('Failed to trigger workflow');
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToUI('assistant', `❌ خطا: ${error.message}\n\nلطفاً دوباره تلاش کنید.`, {
            isError: true
        });
        showNotification('خطا در ارتباط با سرور', 'error');
    } finally {
        showTypingIndicator(false);
        isProcessing = false;
        saveCurrentChat();
    }
}

/**
 * Load a saved chat by ID
 * @param {string} chatId - Chat ID to load
 */
function loadChat(chatId) {
    const chats = getSavedChats();
    const chat = chats[chatId];
    
    if (!chat) return;
    
    currentChatId = chatId;
    currentMessages = [...chat.messages];
    currentModel = chat.model || APP_CONFIG.app.defaultModel;
    
    // Clear UI messages
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
        messagesList.innerHTML = '';
    }
    
    // Hide welcome screen
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    // Display all messages
    currentMessages.forEach(msg => {
        const metadata = {};
        if (msg.model) metadata.model = msg.model;
        addMessageToUI(msg.role, msg.content, metadata);
    });
    
    // Update active state in history list
    document.querySelectorAll('.history-item').forEach(item => {
        if (item.getAttribute('data-chat-id') === chatId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update model selector
    const modelOption = document.querySelector(`.model-option[data-model-id="${currentModel}"]`);
    if (modelOption) {
        document.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
        modelOption.classList.add('active');
    }
    
    // Update model badge
    const selectedModel = availableModels?.find(m => m.id === currentModel);
    const modelBadge = document.getElementById('currentModelName');
    if (modelBadge && selectedModel) {
        modelBadge.textContent = selectedModel.name;
    }
    
    showNotification('گفتگو بارگذاری شد', 'success');
}

/**
 * Clear current chat messages
 */
function clearCurrentChat() {
    if (currentMessages.length === 0) {
        showNotification('چت در حال حاضر خالی است', 'info');
        return;
    }
    
    if (confirm('آیا از پاک کردن تمام پیام‌های این گفتگو مطمئن هستید؟')) {
        currentMessages = [];
        clearChatUI();
        saveCurrentChat();
        showNotification('گفتگو پاک شد', 'success');
    }
}

/**
 * Export current chat as text file
 */
function exportChat() {
    if (currentMessages.length === 0) {
        showNotification('هیچ پیامی برای خروجی گرفتن وجود ندارد', 'warning');
        return;
    }
    
    let exportText = `گفتگوی چت‌بات - ${new Date().toLocaleString('fa-IR')}\n`;
    exportText += `${'='.repeat(50)}\n\n`;
    
    currentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '👤 شما' : '🤖 ربات';
        exportText += `[${role}]\n${msg.content}\n\n${'-'.repeat(30)}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('خروجی با موفقیت ذخیره شد', 'success');
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    showNotification(`تم ${newTheme === 'dark' ? 'تاریک' : 'روشن'} فعال شد`, 'info');
}

/**
 * Save current chat to localStorage
 */
function saveCurrentChat() {
    if (!currentChatId) {
        currentChatId = generateUniqueId();
    }
    
    const chats = getSavedChats();
    
    let chatTitle = 'گفتگوی جدید';
    const firstUserMessage = currentMessages.find(m => m.role === 'user');
    if (firstUserMessage) {
        chatTitle = truncateText(firstUserMessage.content, 40);
    }
    
    chats[currentChatId] = {
        id: currentChatId,
        title: chatTitle,
        messages: currentMessages,
        model: currentModel,
        timestamp: currentMessages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Limit number of saved chats
    const chatIds = Object.keys(chats);
    const maxHistory = APP_CONFIG?.app?.maxHistoryItems || 50;
    if (chatIds.length > maxHistory) {
        const sorted = chatIds.sort((a, b) => 
            new Date(chats[b].updatedAt) - new Date(chats[a].updatedAt)
        );
        const toDelete = sorted.slice(maxHistory);
        toDelete.forEach(id => delete chats[id]);
    }
    
    saveToLocalStorage('chat_history', chats);
    updateHistoryList();
}

/**
 * Load saved chats from localStorage
 */
function loadChatHistory() {
    const chats = getSavedChats();
    updateHistoryList();
    
    // Load most recent chat if exists
    const chatIds = Object.keys(chats);
    if (chatIds.length > 0) {
        const mostRecent = chatIds.sort((a, b) => 
            new Date(chats[b].updatedAt) - new Date(chats[a].updatedAt)
        )[0];
        loadChat(mostRecent);
    } else {
        startNewChat();
    }
}

/**
 * Start a new chat conversation
 */
function startNewChat() {
    currentChatId = generateUniqueId();
    currentMessages = [];
    
    // Clear UI messages
    clearChatUI();
    
    // Clear input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.value = '';
    
    // Save empty chat
    saveCurrentChat();
    
    showNotification('گفتگوی جدید شروع شد', 'info');
}

/**
 * Update history list in sidebar
 */
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const chats = getSavedChats();
    const sortedChats = Object.values(chats).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    historyList.innerHTML = sortedChats.map(chat => `
        <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
            <i class="fas fa-comment"></i>
            <span>${escapeHtml(chat.title)}</span>
            <span class="history-time">${formatTime(chat.updatedAt)}</span>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            loadChat(item.getAttribute('data-chat-id'));
        });
    });
}

/**
 * Get saved chats from localStorage
 * @returns {Object} Saved chats object
 */
function getSavedChats() {
    return getFromLocalStorage('chat_history', {});
}

/**
 * Get current model ID
 * @returns {string} Current model ID
 */
function getCurrentModel() {
    return currentModel;
}
