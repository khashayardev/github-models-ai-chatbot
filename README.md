# 🤖 AI ChatBot with GitHub Models

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-AI%20ChatBot-blue)](https://github.com/features/actions)
[![GitHub Models](https://img.shields.io/badge/GitHub%20Models-Powered-purple)](https://github.com/marketplace/models)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

<div dir="rtl">

## 🌟 معرفی پروژه

یک چت‌بات هوش مصنوعی کاملاً رایگان و حرفه‌ای که با استفاده از **GitHub Models** و **GitHub Actions** ساخته شده است. این پروژه به شما امکان می‌دهد بدون نیاز به پرداخت هیچ هزینه‌ای، از قدرتمندترین مدل‌های هوش مصنوعی مانند GPT-4o، DeepSeek-R1، Llama 3 و دیگر مدل‌ها استفاده کنید.

### ✨ ویژگی‌های کلیدی

- **۱۰۰٪ رایگان** - بدون نیاز به API Key پولی
- **چندین مدل AI** - دسترسی به ۸+ مدل قدرتمند
- **رابط کاربری حرفه‌ای** - مشابه ChatGPT و Claude
- **پشتیبانی از زبان فارسی** - پاسخ‌های روان به فارسی
- **ذخیره‌سازی تاریخچه** - نگهداری خودکار مکالمات
- **تغییر لحظه‌ای مدل** - سوئیچ بین مدل‌ها در حین مکالمه
- **قابل استقرار روی هاست شخصی** - اجرا روی cPanel یا هر هاست دیگر

### 🚀 مدل‌های پشتیبانی شده

| مدل | ناشر | ویژگی‌ها |
|------|-------|-----------|
| GPT-4o | OpenAI | قدرتمندترین مدل، پشتیبانی از متن و تصویر |
| GPT-4o Mini | OpenAI | سریع و اقتصادی |
| DeepSeek-R1 | DeepSeek | تخصص در ریاضیات و منطق |
| Llama 3.3 70B | Meta | متن‌باز، قدرتمند |
| Phi-3.5 Mini | Microsoft | سبک و سریع |
| Mistral Large | Mistral AI | عملکرد عالی روی کدنویسی |
| Cohere Command R+ | Cohere | تخصص در جستجو و RAG |
| AI21 Jamba 1.5 | AI21 | پنجره زمینه بسیار بزرگ |

## 📋 پیش‌نیازها

1. یک حساب **GitHub** (رایگان)
2. یک **Personal Access Token** با دسترسی `repo`
3. یک هاست cPanel (یا هر هاست دیگر) برای فایل‌های فرانت‌اند

## 🔧 راه‌اندازی پروژه

### مرحله ۱: کپی کردن Repository

```bash
git clone https://github.com/khashayardev/github-models-ai-chatbot.git
cd github-models-ai-chatbot
```
## مرحله ۲: تنظیم GitHub Token

1. به آدرس [GitHub Settings > Tokens](https://github.com/settings/tokens) بروید

2. روی دکمه **Generate new token (classic)** کلیک کنید

3. در بخش **Note** یک نام دلخواه برای توکن خود وارد کنید (مثلاً `AI ChatBot Token`)

4. در بخش **Select scopes**، تیک گزینه **`repo`** را بزنید (با زدن این تیک، تمام زیرمجموعه‌های آن نیز خودکار انتخاب می‌شوند)

5. به انتهای صفحه بروید و روی دکمه سبز رنگ **Generate token** کلیک کنید

6. توکن ساخته شده را **بلافاصله کپی کنید** (این تنها باری است که توکن را می‌بینید)

> ⚠️ توکن خود را در جای امنی ذخیره کنید و هرگز آن را در مکان‌های عمومی به اشتراک نگذارید.


## مرحله ۳: تنظیم فایل `frontend/js/config.js`

فایل `config.js` را باز کنید و اطلاعات خود را وارد کنید:

```javascript
const APP_CONFIG = {
    github: {
        owner: 'YOUR_GITHUB_USERNAME',  // نام کاربری گیت‌هاب شما
        repo: 'github-models-ai-chatbot', // نام رپازیتوری
        token: 'ghp_xxxxxxxxxxxx'         // توکنی که ساخته‌اید
    },
    // ... سایر تنظیمات
};
```
## مرحله ۴: استقرار روی هاست cPanel

تمام محتویات پوشه `frontend/` را در هاست خود آپلود کنید:

- در **public_html** (برای دامنه اصلی)
- یا در **subdomain** (مثلاً `app.khashayar.one`)

اطمینان حاصل کنید که فایل‌ها در مسیر درست قرار گرفته‌اند:

public_html/
- index.html
- css/
- js/
- assets/

  ## مرحله ۵: تست و اجرا

- آدرس سایت خود را باز کنید (مثلاً `https://app.khashayar.one`)

- یک پیام تست ارسال کنید

- به GitHub Actions بروید و ببینید workflow اجرا می‌شود

---

## 📊 محدودیت‌ها و سقف استفاده (رایگان)

| سرویس | محدودیت رایگان |
|-------|----------------|
| GitHub Actions | ۲۰۰۰ دقیقه در ماه |
| GitHub Models | بسته به مدل (پایین/متوسط/بالا) |
| فضای ذخیره‌سازی | ۵۰۰ مگابایت کش |

⚠️ با این محدودیت‌ها می‌توانید روزانه حدود **۲۰۰-۴۰۰ پیام** ارسال کنید که برای استفاده شخصی کاملاً کافی است.

## 🛠️ عیب‌یابی مشکلات رایج

### ۱. خطای 403 هنگام ارسال پیام

- توکن GitHub خود را بررسی کنید
- مطمئن شوید توکن دسترسی `repo` دارد

### ۲. پیام ارسال می‌شود اما پاسخی نمی‌آید

- به GitHub Actions بروید
- ببینید workflow با موفقیت اجرا شده یا خیر
- اگر خطا دارد، لاگ‌ها را بررسی کنید

### ۳. مدل‌ها در لیست نمایش داده نمی‌شوند

- اتصال اینترنت خود را بررسی کنید
- ممکن است GitHub Models API به صورت موقت در دسترس نباشد

---

## 🤝 مشارکت در توسعه

اگر ایده یا پیشنهادی برای بهبود پروژه دارید، خوشحال می‌شویم:

1. **Fork** کنید
2. **Branch جدید** بسازید (`git checkout -b feature/AmazingFeature`)
3. **Commit** کنید (`git commit -m 'Add some AmazingFeature'`)
4. **Push** کنید (`git push origin feature/AmazingFeature`)
5. **Pull Request** باز کنید

---

## 📝 مجوز

این پروژه تحت مجوز **MIT** منتشر شده است.

---

## ⭐ حمایت

اگر از این پروژه استفاده می‌کنید و برایتان مفید بوده، لطفاً یک ⭐ به آن بدهید!

---

**ساخته شده با ❤️ و GitHub Models** توسط خشایار
