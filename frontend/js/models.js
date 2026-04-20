/**
 * Models Management Module
 * مدیریت مدل‌های هوش مصنوعی و ارتباط با GitHub Models
 */

let availableModels = [];
let currentModelId = APP_CONFIG?.app?.defaultModel || 'gpt-4o';

/**
 * دریافت لیست مدل‌های موجود از GitHub
 * @returns {Promise<Array>} لیست مدل‌ها
 */
async function fetchAvailableModels() {
    try {
        const endpoint = 'https://models.inference.ai.azure.com/models';
        
        const response = await fetch(endpoint, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            availableModels = data.map(model => ({
                id: model.id,
                name: model.name,
                publisher: model.publisher || 'Unknown',
                capabilities: model.capabilities || [],
                rateLimitTier: model.rate_limit_tier || 'medium',
                maxInputTokens: model.limits?.max_input_tokens || 128000,
                maxOutputTokens: model.limits?.max_output_tokens || 4096
            }));
        } else {
            throw new Error('Failed to fetch models');
        }
    } catch (error) {
        console.warn('Failed to fetch from catalog, using fallback models:', error);
        // مدل‌های پیش‌فرض در صورت عدم دسترسی به API
        availableModels = [
            { id: 'gpt-4o', name: 'GPT-4o', publisher: 'OpenAI', rateLimitTier: 'high', maxInputTokens: 128000, maxOutputTokens: 16384 },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', publisher: 'OpenAI', rateLimitTier: 'high', maxInputTokens: 128000, maxOutputTokens: 16384 },
            { id: 'DeepSeek-R1', name: 'DeepSeek-R1', publisher: 'DeepSeek', rateLimitTier: 'medium', maxInputTokens: 65536, maxOutputTokens: 8192 },
            { id: 'Llama-3.3-70b-Instruct', name: 'Llama 3.3 70B', publisher: 'Meta', rateLimitTier: 'medium', maxInputTokens: 131072, maxOutputTokens: 8192 },
            { id: 'Phi-3.5-mini-instruct', name: 'Phi-3.5 Mini', publisher: 'Microsoft', rateLimitTier: 'low', maxInputTokens: 131072, maxOutputTokens: 4096 },
            { id: 'Mistral-large-2407', name: 'Mistral Large', publisher: 'Mistral AI', rateLimitTier: 'medium', maxInputTokens: 131072, maxOutputTokens: 8192 },
            { id: 'Cohere-command-r-plus', name: 'Cohere Command R+', publisher: 'Cohere', rateLimitTier: 'medium', maxInputTokens: 128000, maxOutputTokens: 4096 },
            { id: 'AI21-Jamba-1.5-Large', name: 'AI21 Jamba 1.5', publisher: 'AI21', rateLimitTier: 'medium', maxInputTokens: 262144, maxOutputTokens: 4096 }
        ];
    }
    
    return availableModels;
}

/**
 * نمایش مدل‌ها در منوی انتخاب
 */
async function renderModelSelector() {
    const modelSelector = document.getElementById('modelSelector');
    if (!modelSelector) return;
    
    const models = await fetchAvailableModels();
    
    modelSelector.innerHTML = '';
    
    models.forEach(model => {
        const modelOption = document.createElement('div');
        modelOption.className = `model-option ${model.id === currentModelId ? 'active' : ''}`;
        modelOption.setAttribute('data-model-id', model.id);
        
        // نمایش نشانگر محدودیت
        let rateIcon = '';
        if (model.rateLimitTier === 'high') rateIcon = '🚀';
        else if (model.rateLimitTier === 'medium') rateIcon = '⚡';
        else rateIcon = '🐢';
        
        modelOption.innerHTML = `
            <div class="model-info">
                <span class="model-name">${model.name}</span>
                <span class="model-publisher">${model.publisher}</span>
            </div>
            <span class="model-rate-icon">${rateIcon}</span>
        `;
        
        modelOption.addEventListener('click', () => {
            switchModel(model.id);
        });
        
        modelSelector.appendChild(modelOption);
    });
    
    // به‌روزرسانی اطلاعات مدل جاری
    updateCurrentModelInfo();
}

/**
 * تغییر مدل فعال
 * @param {string} modelId - شناسه مدل جدید
 */
function switchModel(modelId) {
    currentModelId = modelId;
    
    // به‌روزرسانی کلاس active در UI
    document.querySelectorAll('.model-option').forEach(option => {
        if (option.getAttribute('data-model-id') === modelId) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // به‌روزرسانی نشانگر مدل در هدر
    const modelBadge = document.getElementById('currentModelName');
    const selectedModel = availableModels.find(m => m.id === modelId);
    if (modelBadge && selectedModel) {
        modelBadge.textContent = selectedModel.name;
    }
    
    // به‌روزرسانی اطلاعات مدل
    updateCurrentModelInfo();
    
    // ذخیره در localStorage
    localStorage.setItem('preferredModel', modelId);
    
    showNotification(`مدل به ${selectedModel?.name || modelId} تغییر یافت`, 'success');
}

/**
 * به‌روزرسانی اطلاعات نمایشی مدل جاری
 */
function updateCurrentModelInfo() {
    const modelInfo = document.getElementById('modelInfo');
    if (!modelInfo) return;
    
    const model = availableModels.find(m => m.id === currentModelId);
    if (!model) return;
    
    const rateLimitText = {
        'high': 'بالا (۶۰ درخواست در دقیقه)',
        'medium': 'متوسط (۳۰ درخواست در دقیقه)',
        'low': 'پایین (۱۰ درخواست در دقیقه)'
    };
    
    modelInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">🏢 ناشر:</span>
            <span class="info-value">${model.publisher}</span>
        </div>
        <div class="info-row">
            <span class="info-label">⚡ نرخ محدودیت:</span>
            <span class="info-value">${rateLimitText[model.rateLimitTier] || 'متوسط'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">📥 حداکثر ورودی:</span>
            <span class="info-value">${(model.maxInputTokens / 1000).toFixed(0)}K توکن</span>
        </div>
        <div class="info-row">
            <span class="info-label">📤 حداکثر خروجی:</span>
            <span class="info-value">${(model.maxOutputTokens / 1000).toFixed(0)}K توکن</span>
        </div>
    `;
}

/**
 * دریافت مدل فعال جاری
 * @returns {string} شناسه مدل فعال
 */
function getCurrentModel() {
    return currentModelId;
}

/**
 * دریافت اطلاعات یک مدل خاص
 * @param {string} modelId - شناسه مدل
 * @returns {Object|null} اطلاعات مدل
 */
function getModelInfo(modelId) {
    return availableModels.find(m => m.id === modelId) || null;
}

/**
 * بررسی محدودیت نرخ مدل
 * @param {string} modelId - شناسه مدل
 * @returns {string} سطح محدودیت
 */
function getModelRateLimit(modelId) {
    const model = availableModels.find(m => m.id === modelId);
    return model?.rateLimitTier || 'medium';
}
