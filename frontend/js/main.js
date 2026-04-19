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
let currentModel = APP_CONFIG.app.defaultModel;
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
    await loadModels();
    
    // Load saved chats
    loadChatHistory();
    
    // Apply theme
    applyTheme(APP_CONFIG.ui.theme);
    
    // Setup auto-resize for textarea
    setupAutoResize();
    
    console.log('Application initialized successfully');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Send message on Enter (Shift+Enter for new line)
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    // New chat button
    document.getElementById('newChatBtn').addEventListener('click', startNewChat);
    
    // Clear chat button
    document.getElementById('clearChatBtn').addEventListener('click', clearCurrentChat);
    
    // Export chat button
    document.getElementById('exportChatBtn').addEventListener('click', exportChat);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    
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
        const temperature = parseFloat(localStorage.getItem('temperature') || APP_CONFIG.ui.temperature);
        const maxTokens = parseInt(localStorage.getItem('maxTokens') || APP_CONFIG.ui.maxTokens);
        const systemPrompt = localStorage.getItem('systemPrompt') || null;
        
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
                updateTokenInfo(response.estimated_tokens);
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
 * Add message to UI
 */
function addMessageToUI(role, content, metadata = {}) {
    const messagesList = document.getElementById('messagesList');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    // Hide welcome screen if visible
    if (welcomeScreen && welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    
    // Parse markdown/code blocks (basic)
    let formattedContent = content
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    
    textDiv.innerHTML = formattedContent;
    contentDiv.appendChild(textDiv);
    
    // Add metadata if available
    if (Object.keys(metadata).length > 0 && !metadata.isError) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        let metaHtml = '';
        
        if (metadata.model) {
            metaHtml += `<span><i class="fas fa-microchip"></i> ${metadata.model}</span>`;
        }
        if (metadata.processingTime) {
            metaHtml += `<span><i class="fas fa-clock"></i> ${metadata.processingTime.toFixed(1)}s</span>`;
        }
        if (metadata.tokens) {
            metaHtml += `<span><i class="fas fa-database"></i> ${metadata.tokens.total} tokens</span>`;
        }
        
        metaDiv.innerHTML = metaHtml;
        contentDiv.appendChild(metaDiv);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messagesList.appendChild(messageDiv);
    
    // Scroll to bottom
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

/**
 * Load available models from GitHub
 */
async function loadModels() {
    const modelSelector = document.getElementById('modelSelector');
    if (!modelSelector) return;
    
    try {
        const models = await api.getAvailableModels();
        
        modelSelector.innerHTML = '';
        
        models.forEach(model => {
            const modelOption = document.createElement('div');
            modelOption.className = `model-option ${model.id === currentModel ? 'active' : ''}`;
            modelOption.setAttribute('data-model-id', model.id);
            
            modelOption.innerHTML = `
                <span>${model.name}</span>
                <span class="model-badge-tag" style="font-size: 0.7rem; color: var(--gray-500);">${model.publisher}</span>
            `;
            
            modelOption.addEventListener('click', () => {
                switchModel(model.id);
            });
            
            modelSelector.appendChild(modelOption);
        });
        
        // Update model info display
        updateModelInfo(currentModel);
        
    } catch (error) {
        console.error('Failed to load models:', error);
        showNotification('خطا در دریافت لیست مدل‌ها', 'error');
    }
}

/**
 * Switch between AI models
 */
function switchModel(modelId) {
    currentModel = modelId;
    
    // Update UI
    document.querySelectorAll('.model-option').forEach(option => {
        if (option.getAttribute('data-model-id') === modelId) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Update model badge
    const modelName = document.querySelector(`.model-option[data-model-id="${modelId}"] span:first-child`)?.textContent || modelId;
    document.getElementById('currentModelName').textContent = modelName;
    
    // Update model info
    updateModelInfo(modelId);
    
    // Save preference
    localStorage.setItem('preferredModel', modelId);
    
    showNotification(`مدل به ${modelName} تغییر یافت`, 'success');
}

/**
 * Update model information display
 */
async function updateModelInfo(modelId) {
    const modelInfo = document.getElementById('modelInfo');
    if (!modelInfo) return;
    
    try {
        const models = await api.getAvailableModels();
        const model = models.find(m => m.id === modelId);
        
        if (model) {
            modelInfo.innerHTML = `
                <div><strong>ناشر:</strong> ${model.publisher}</div>
                <div><strong>نرخ محدودیت:</strong> ${model.rateLimitTier === 'high' ? 'بالا' : model.rateLimitTier === 'medium' ? 'متوسط' : 'پایین'}</div>
                ${model.maxInputTokens ? `<div><strong>حداکثر ورودی:</strong> ${(model.maxInputTokens / 1000).toFixed(0)}K توکن</div>` : ''}
                ${model.maxOutputTokens ? `<div><strong>حداکثر خروجی:</strong> ${(model.maxOutputTokens / 1000).toFixed(0)}K توکن</div>` : ''}
            `;
        }
    } catch (error) {
        console.error('Failed to update model info:', error);
    }
}

/**
 * Save current chat to localStorage
 */
function saveCurrentChat() {
    if (!currentChatId) {
        currentChatId = generateId();
    }
    
    const chats = getSavedChats();
    chats[currentChatId] = {
        id: currentChatId,
        title: currentMessages[0]?.content?.substring(0, 50) || 'گفتگوی جدید',
        messages: currentMessages,
        model: currentModel,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('chat_history', JSON.stringify(chats));
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
            new Date(chats[b].timestamp) - new Date(chats[a].timestamp)
        )[0];
        loadChat(mostRecent);
    } else {
        startNewChat();
    }
}

/**
 * Update history list in sidebar
 */
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const chats = getSavedChats();
    const sortedChats = Object.values(chats).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    historyList.innerHTML = sortedChats.map(chat => `
        <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
            <i class="fas fa-comment"></i>
            <span>${escapeHtml(chat.title)}</span>
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
 * Start a new chat conversation
 */
function startNewChat() {
    currentChatId = generateId();
    currentMessages = [];
    
    // Clear UI messages
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';
    
    // Show welcome screen
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
    }
    
    // Clear input
    document.getElementById('messageInput').value = '';
    
    // Save empty chat
    saveCurrentChat();
    
    showNotification('گفتگوی جدید شروع شد', 'info');
}

/**
 * Utility functions
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getSavedChats() {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : {};
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification using alert for now
    // In production, use a toast notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function setupAutoResize() {
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}
