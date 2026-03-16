# ⚡ Быстрая настройка бэкенда — пошагово

Время настройки: **5-7 минут**

---

## 🎯 Шаг 1: Supabase (3 минуты)

### 1.1 Создайте проект
```
1. Перейдите на https://supabase.com
2. Нажмите "Start your project" или "New Project"
3. Заполните:
   - Name: blade-style-barber
   - Database Password: [запомните или сохраните!]
   - Region: Europe (Frankfurt) или ближайшая
4. Нажмите "Create new project"
5. ⏳ Ждите 1-2 минуты пока создастся
```

### 1.2 Примените SQL схему
```
1. В проекте нажмите "SQL Editor" (левое меню)
2. Нажмите "New Query"
3. Откройте файл supabase-schema.sql из проекта
4. Скопируйте ВСЁ содержимое
5. Вставьте в SQL Editor на Supabase
6. Нажмите "Run" (или Ctrl+Enter)
7. ✅ Должно появиться "Success. No rows returned"
```

### 1.3 Скопируйте ключи
```
1. Нажмите "Settings" (шестерёнка внизу слева)
2. Выберите "API"
3. Скопируйте:
   ┌─────────────────────────────────────────┐
   │ Project URL:                            │
   │ https://xxxxxxxxx.supabase.co           │ ← SUPABASE_URL
   ├─────────────────────────────────────────┤
   │ anon/public key:                        │
   │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ ← SUPABASE_ANON_KEY
   └─────────────────────────────────────────┘

4. Прокрутите вниз до "Project service keys"
5. Скопируйте service_role key:
   ┌─────────────────────────────────────────┐
   │ service_role key:                       │
   │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ ← SUPABASE_SERVICE_KEY
   └─────────────────────────────────────────┘
```

---

## 🎯 Шаг 2: Локальная проверка (1 минута)

### 2.1 Создайте .env файл
```bash
cd /Users/mac/Downloads/telegram-bot
cp .env.example .env
```

### 2.2 Заполните .env
Откройте `.env` и вставьте значения:
```bash
BOT_TOKEN=ваш_токен_от_BotFather
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Запустите проверку
```bash
node setup-check.js
```
✅ Все проверки должны пройти

---

## 🎯 Шаг 3: Vercel (2 минуты)

### 3.1 Создайте проект на Vercel
```
1. Перейдите на https://vercel.com
2. Нажмите "Add New..." → "Project"
3. Найдите ваш GitHub репозиторий с telegram-bot
4. Нажмите "Import"
```

### 3.2 Добавьте переменные окружения
```
1. На странице импорта нажмите "Environment Variables"
2. Добавьте по одной:

   Name: BOT_TOKEN
   Value: [ваш токен из .env]
   ✅ Development, ✅ Preview, ✅ Production
   → Save

   Name: SUPABASE_URL
   Value: [URL из Supabase]
   ✅ Development, ✅ Preview, ✅ Production
   → Save

   Name: SUPABASE_ANON_KEY
   Value: [anon key из Supabase]
   ✅ Development, ✅ Preview, ✅ Production
   → Save

   Name: SUPABASE_SERVICE_KEY
   Value: [service key из Supabase]
   ✅ Development, ✅ Preview, ✅ Production
   → Save
```

### 3.3 Задеплойте
```
1. Нажмите "Deploy"
2. ⏳ Ждите 1-2 минуты
3. ✅ Должно появиться "Congratulations!"
4. Скопируйте URL (например: https://blade-style.vercel.app)
```

---

## 🎯 Шаг 4: GitHub Secrets (1 минута)

### 4.1 Откройте настройки репозитория
```
1. Откройте ваш репозиторий на GitHub
2. Нажмите "Settings" (верхнее меню)
3. В левом меню: "Secrets and variables" → "Actions"
```

### 4.2 Добавьте секреты
```
Нажмите "New repository secret" три раза:

1. Name: BOT_TOKEN
   Value: [ваш токен]
   → Add secret

2. Name: SUPABASE_URL
   Value: [URL Supabase]
   → Add secret

3. Name: SUPABASE_SERVICE_KEY
   Value: [service key]
   → Add secret
```

---

## 🎯 Шаг 5: Настройка Telegram Bot (1 минута)

### 5.1 Откройте BotFather
```
1. В Telegram найдите @BotFather
2. Отправьте /mybots
3. Выберите вашего бота
```

### 5.2 Настройте Menu Button
```
1. Bot Settings → Menu Button → Configure Menu Button
2. Отправьте текст кнопки: 📅 Записаться
3. Отправьте URL: https://ваш-app.vercel.app
   (без / в конце!)
```

---

## ✅ Проверка работы

### Тест 1: Запись клиента
```
1. Откройте бота в Telegram
2. Нажмите /start или кнопку меню
3. Пройдите весь процесс записи
4. В Supabase: Table Editor → bookings
5. ✅ Должна появиться новая запись
```

### Тест 2: GitHub Actions
```
1. GitHub репозиторий → Actions
2. "Send Booking Reminders"
3. Нажмите "Run workflow"
4. Выберите ветку (main/master)
5. Нажмите "Run workflow"
6. ✅ Должен запуститься и завершиться успешно
```

---

## 🐛 Если что-то пошло не так

### Ошибка: "Failed to save booking"
```
✅ Проверьте .env на Vercel (Settings → Environment Variables)
✅ Проверьте что SQL схема применена в Supabase
✅ Откройте Vercel Deploy Logs и посмотрите ошибки
```

### Ошибка: "relation bookings does not exist"
```
✅ Примените supabase-schema.sql в Supabase SQL Editor
✅ Проверьте что таблицы созданы: Table Editor → должны быть bookings, masters, services
```

### Напоминания не работают
```
✅ Проверьте GitHub Actions логи
✅ Убедитесь что BOT_TOKEN добавлен в GitHub Secrets
✅ В bookings должна быть запись с want_notification=true
```

---

## 📞 Готово!

Ваш бэкенд работает! 🎉

- ✅ Записи сохраняются в Supabase
- ✅ Клиенты получают подтверждения
- ✅ Напоминания отправляются каждые 30 минут
- ✅ Админ-панель доступна по /admin
