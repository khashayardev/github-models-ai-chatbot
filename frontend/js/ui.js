/**
 * UI Management Module
 * مدیریت تمام المان‌های رابط کاربری
 */

/**
 * نمایش یا پنهان کردن تایپینگ ایندیکیتور
 * @param {boolean} show - نمایش یا عدم نمایش
 */
function showTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
        if (show) {
            const container = document.getElementById('messagesContainer');
            container.scrollTop = container.scrollHeight;
        }
    }
}

/**
 * اضافه کردن پیام به رابط کاربری
 * @param {string} role - نقش (user/assistant)
 * @param {string} content - محتوای پیام
 * @param {Object} metadata - متادیتای اضافی
 */
function addMessageToUI(role, content, metadata = {}) {
    const messagesList = document.getElementById('messagesList');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    // مخفی کردن صفحه خوش‌آمدگویی
    if (welcomeScreen && welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    // آواتار
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    // محتوای پیام
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = formatMessageContent(content);
    contentDiv.appendChild(textDiv);
    
    // متادیتا
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
            metaHtml += `<span><i class="fas fa-database"></i> ${metadata.tokens.total} توکن</span>`;
        }
        
        metaDiv.innerHTML = metaHtml;
        contentDiv.appendChild(metaDiv);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    messagesList.appendChild(messageDiv);
    
    // اسکرول به پایین
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

/**
 * فرمت کردن محتوای پیام (پشتیبانی از کد و مارکداون ساده)
 * @param {string} content - محتوای خام
 * @returns {string} محتوای فرمت شده
 */
function formatMessageContent(content) {
    if (!content) return '';
    
    let formatted = content
        // کد بلاک سه بکتیک
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
        })
        // کد اینلاین
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // خط جدید به br
        .replace(/\n/g, '<br>')
        // لینک‌ها
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return formatted;
}

/**
 * به‌روزرسانی اطلاعات توکن در فوتر
 * @param {Object} tokenInfo - اطلاعات توکن
 */
function updateTokenInfo(tokenInfo) {
    const tokenInfoSpan = document.querySelector('#tokenInfo span');
    if (tokenInfoSpan && tokenInfo) {
        tokenInfoSpan.textContent = `${tokenInfo.total || 0} توکن مصرف شد`;
    }
}

/**
 * به‌روزرسانی وضعیت اتصال
 * @param {boolean} isConnected - وضعیت اتصال
 */
function updateConnectionStatus(isConnected) {
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
        const icon = statusIndicator.querySelector('i');
        const text = statusIndicator.querySelector('span');
        
        if (isConnected) {
            icon.style.color = '#10b981';
            text.textContent = 'متصل';
        } else {
            icon.style.color = '#ef4444';
            text.textContent = 'قطع';
        }
    }
}

/**
 * تغییر تم (روشن/تاریک)
 * @param {string} theme - نام تم (light/dark)
 */
function applyTheme(theme) {
    const lightTheme = document.getElementById('theme-light');
    const darkTheme = document.getElementById('theme-dark');
    
    if (theme === 'dark') {
        if (lightTheme) lightTheme.disabled = true;
        if (darkTheme) darkTheme.disabled = false;
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        if (lightTheme) lightTheme.disabled = false;
        if (darkTheme) darkTheme.disabled = true;
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
    
    localStorage.setItem('theme', theme);
}

/**
 * باز و بسته کردن سایدبار (موبایل)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

/**
 * باز کردن مودال تنظیمات
 */
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        // بارگذاری تنظیمات جاری
        const tempSlider = document.getElementById('tempSlider');
        const tempValue = document.getElementById('tempValue');
        const maxTokensInput = document.getElementById('maxTokensInput');
        const systemPromptInput = document.getElementById('systemPromptInput');
        
        if (tempSlider && tempValue) {
            const savedTemp = localStorage.getItem('temperature') || '0.7';
            tempSlider.value = savedTemp;
            tempValue.textContent = savedTemp;
        }
        
        if (maxTokensInput) {
            const savedTokens = localStorage.getItem('maxTokens') || '1000';
            maxTokensInput.value = savedTokens;
        }
        
        if (systemPromptInput) {
            const savedPrompt = localStorage.getItem('systemPrompt') || '';
            systemPromptInput.value = savedPrompt;
        }
        
        modal.classList.add('active');
    }
}

/**
 * بستن مودال تنظیمات
 */
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * راه‌اندازی مودال تنظیمات
 */
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.querySelector('.modal-close');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const resetBtn = document.getElementById('resetSettingsBtn');
    const tempSlider = document.getElementById('tempSlider');
    const tempValue = document.getElementById('tempValue');
    
    // بستن با کلیک روی دکمه بستن
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettings);
    }
    
    // بستن با کلیک بیرون مودال
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSettings();
            }
        });
    }
    
    // نمایش مقدار دما
    if (tempSlider && tempValue) {
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });
    }
    
    // ذخیره تنظیمات
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const temperature = tempSlider ? parseFloat(tempSlider.value) : 0.7;
            const maxTokens = document.getElementById('maxTokensInput') ? parseInt(document.getElementById('maxTokensInput').value) : 1000;
            const systemPrompt = document.getElementById('systemPromptInput') ? document.getElementById('systemPromptInput').value : '';
            
            localStorage.setItem('temperature', temperature);
            localStorage.setItem('maxTokens', maxTokens);
            localStorage.setItem('systemPrompt', systemPrompt);
            
            showNotification('تنظیمات ذخیره شد!', 'success');
            closeSettings();
        });
    }
    
    // بازنشانی تنظیمات
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (tempSlider) {
                tempSlider.value = '0.7';
                if (tempValue) tempValue.textContent = '0.7';
            }
            if (maxTokensInput) maxTokensInput.value = '1000';
            if (systemPromptInput) systemPromptInput.value = '';
            
            showNotification('تنظیمات بازنشانی شد', 'info');
        });
    }
}

/**
 * بارگذاری تنظیمات ذخیره شده
 */
function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedTemp = localStorage.getItem('temperature');
    const savedTokens = localStorage.getItem('maxTokens');
    const savedPrompt = localStorage.getItem('systemPrompt');
    
    applyTheme(savedTheme);
    
    if (savedTemp) APP_CONFIG.ui.temperature = parseFloat(savedTemp);
    if (savedTokens) APP_CONFIG.ui.maxTokens = parseInt(savedTokens);
}

/**
 * خالی کردن صفحه چت
 */
function clearChatUI() {
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
        messagesList.innerHTML = '';
    }
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
    }
}

/**
 * اسکرول خودکار به پایین چت
 */
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

/**
 * تنظیم auto-resize برای textarea
 */
function setupAutoResize() {
    const textarea = document.getElementById('messageInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
}
