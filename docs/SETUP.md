# راهنمای نصب و راه‌اندازی پروژه AI ChatBot

## پیش‌نیازها

1. یک حساب کاربری GitHub (رایگان)
2. یک هاست cPanel با پشتیبانی از PHP (برای فایل‌های فرانت‌اند)
3. مرورگر مدرن (Chrome, Firefox, Safari, Edge)

## مراحل نصب

### مرحله 1: ساخت Repository در GitHub

1. وارد حساب GitHub خود شوید
2. روی دکمه سبز رنگ **New** کلیک کنید
3. نام repository را `github-models-ai-chatbot` بگذارید
4. روی **Create repository** کلیک کنید

### مرحله 2: آپلود فایل‌ها به GitHub

```bash
git clone https://github.com/YOUR_USERNAME/github-models-ai-chatbot.git
cd github-models-ai-chatbot
# کپی کردن تمام فایل‌های پروژه در این پوشه
git add .
git commit -m "Initial commit"
git push origin main
