/**
 * Utility Functions Module
 * توابع کمکی عمومی برای استفاده در سراسر برنامه
 */

/**
 * ایجاد شناسه یکتا
 * @returns {string} شناسه یکتا
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * ذخیره داده در localStorage
 * @param {string} key - کلید ذخیره‌سازی
 * @param {any} value - مقدار برای ذخیره
 */
function saveToLocalStorage(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * دریافت داده از localStorage
 * @param {string} key - کلید ذخیره‌سازی
 * @param {any} defaultValue - مقدار پیش‌فرض در صورت نبودن
 * @returns {any} مقدار ذخیره شده
 */
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const serialized = localStorage.getItem(key);
        if (serialized === null) return defaultValue;
        return JSON.parse(serialized);
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * حذف داده از localStorage
 * @param {string} key - کلید برای حذف
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

/**
 * نمایش نوتیفیکیشن
 * @param {string} message - متن پیام
 * @param {string} type - نوع پیام (success, error, warning, info)
 * @param {number} duration - مدت نمایش (میلی‌ثانیه)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // حذف نوتیفیکیشن قبلی اگر وجود داشت
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
        <span class="notification-message">${escapeHtml(message)}</span>
    `;
    
    // استایل نوتیفیکیشن
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '10000',
        backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontFamily: 'inherit',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s ease',
        direction: 'rtl'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * فرار از کاراکترهای HTML
 * @param {string} text - متن ورودی
 * @returns {string} متن ایمن شده
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * فرمت کردن زمان
 * @param {string} isoString - زمان به فرمت ISO
 * @returns {string} زمان فرمت شده
 */
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'لحظاتی پیش';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    
    return date.toLocaleDateString('fa-IR');
}

/**
 * دیباک لاگ (فقط در حالت دیباگ)
 * @param {...any} args - مقادیر برای لاگ
 */
function debugLog(...args) {
    if (APP_CONFIG && APP_CONFIG.app && APP_CONFIG.app.debugMode) {
        console.log('[DEBUG]', ...args);
    }
}

/**
 * تاخیر (Sleep)
 * @param {number} ms - میلی‌ثانیه
 * @returns {Promise} پرامیس تاخیر
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * کپی متن در کلیپ‌بورد
 * @param {string} text - متن برای کپی
 * @returns {Promise<boolean>} موفقیت یا عدم موفقیت
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('متن کپی شد!', 'success');
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        showNotification('خطا در کپی متن', 'error');
        return false;
    }
}

/**
 * محدود کردن متن
 * @param {string} text - متن ورودی
 * @param {number} maxLength - حداکثر طول
 * @returns {string} متن محدود شده
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * بررسی وجود اینترنت
 * @returns {boolean} وضعیت اتصال
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * دریافت پارامتر از URL
 * @param {string} param - نام پارامتر
 * @returns {string|null} مقدار پارامتر
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// اضافه کردن استایل‌های انیمیشن به صفحه
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(animationStyles);
