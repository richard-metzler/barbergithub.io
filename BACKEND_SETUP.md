# 🤖 Полная настройка Telegram Mini App + Бэкенд

## 📋 Обзор архитектуры

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Telegram      │────▶│   Vercel         │────▶│   Supabase      │
│   Mini App      │     │   (Frontend +    │     │   (Database)    │
│   (Frontend)    │     │    API Routes)   │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │   GitHub Actions │
                        │   (Напоминания)  │
                        └──────────────────┘
```

---

## Шаг 1: Создание бота в Telegram

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Введите название: `Барбершоп BLADE & STYLE`
4. Введите username: `blade_style_bot` (должен заканчиваться на `bot`)
5. **Сохраните токен** (выглядит как: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

---

## Шаг 2: Настройка Supabase (База данных)

### 2.1 Создание проекта
1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Нажмите **New Project**
3. Заполните:
   - Name: `blade-style-barber`
   - Database Password: (сохраните в надёжном месте!)
   - Region: выберите ближайшую к вам
4. Нажмите **Create new project** (ждите ~2 минуты)

### 2.2 Создание таблиц
1. В проекте перейдите в **SQL Editor** (левое меню)
2. Нажмите **New Query**
3. Скопируйте содержимое файла `supabase-schema.sql`
4. Нажмите **Run** (или Ctrl+Enter)
5. ✅ Должны создаться таблицы: `services`, `masters`, `bookings`

### 2.3 Получение ключей
1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
3. Перейдите в **Settings** → **Database**
4. Включите **Production** режим (если видите)
5. Скопируйте **service_role key** → `SUPABASE_SERVICE_KEY` ⚠️ (секретный!)

---

## Шаг 3: Настройка переменных окружения

### 3.1 Локально (для разработки)
Создайте файл `.env` в корне проекта:
```bash
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 На Vercel (для продакшена)
1. Откройте ваш проект на [vercel.com](https://vercel.com)
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте переменные:
   - `BOT_TOKEN` — токен бота
   - `SUPABASE_URL` — URL проекта Supabase
   - `SUPABASE_ANON_KEY` — публичный ключ
   - `SUPABASE_SERVICE_KEY` — сервисный ключ
4. Нажмите **Save**

### 3.3 На GitHub (для напоминаний)
1. Откройте репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте те же переменные:
   - `BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

---

## Шаг 4: Размещение на Vercel

### 4.1 Первый деплой
1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Нажмите **Add New** → **Project**
3. Импортируйте ваш GitHub репозиторий
4. В **Framework Preset** выберите **Vite**
5. Нажмите **Deploy**

### 4.2 Настройка Mini App в Telegram
1. После деплоя скопируйте URL (например: `https://blade-style.vercel.app`)
2. В @BotFather отправьте `/mybots` → выберите бота
3. **Bot Settings** → **Menu Button** → **Configure Menu Button**
4. Введите текст: `📅 Записаться`
5. Введите URL: `https://blade-style.vercel.app`

---

## Шаг 5: Проверка работы

### 5.1 Тестирование записи
1. Откройте бота в Telegram
2. Нажмите **START** или кнопку **📅 Записаться**
3. Пройдите весь процесс записи
4. Проверьте базу данных Supabase:
   - Перейдите в **Table Editor** → **bookings**
   - Должна появиться новая запись ✅

### 5.2 Тестирование напоминаний
1. Откройте GitHub репозиторий
2. Перейдите в **Actions** → **Send Booking Reminders**
3. Нажмите **Run workflow** (тестовый запуск)
4. Проверьте логи выполнения

---

## 📁 Структура API endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/booking` | POST | Сохранение новой записи |
| `/api/get-bookings` | GET | Получение списка записей (фильтры: date, master_id, status) |
| `/api/update-booking` | POST | Обновление статуса записи |

### Пример запроса для сохранения:
```javascript
fetch('/api/booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 123456789,
    booking: {
      service: 'Мужская стрижка',
      servicePrice: 1500,
      master: 'Алексей',
      masterId: 'm1',
      date: '2026-03-20',
      time: '14:00',
      clientName: 'Иван',
      clientPhone: '+7 (999) 000-00-00',
      wantNotification: true
    }
  })
})
```

---

## 🔔 Как работают напоминания

1. **GitHub Actions** запускается каждые 30 минут (в :00 и :30)
2. Скрипт `send-reminders.js` проверяет базу данных
3. Находит записи на сегодня, где:
   - `want_notification = true`
   - `reminder_sent = false`
   - До времени записи осталось ≤ 2 часов
4. Отправляет сообщение через Telegram Bot API
5. Помечает `reminder_sent = true`

### Изменение расписания
Откройте `.github/workflows/reminders.yml`:
```yaml
on:
  schedule:
    - cron: '0,30 * * * *'  # Каждые 30 минут
```

Другие примеры:
- `0 */2 * * *` — каждые 2 часа
- `0 9 * * *` — каждый день в 9:00
- `0 8,20 * * *` — в 8:00 и 20:00

---

## 🛠️ Локальная разработка

### Запуск фронтенда:
```bash
npm install
npm run dev
```

### Тестирование API локально:
```bash
# Установите Vercel CLI
npm install -g vercel

# Запустите локальный сервер Vercel
vercel dev
```

API будут доступны по адресу: `http://localhost:3000/api/...`

---

## 📊 Админ-панель

Доступна по пути `/admin`:
```
https://your-app.vercel.app/admin
```

Функции:
- Просмотр всех записей на сегодня
- Фильтрация по мастерам
- Изменение статуса (Завершено/Отменено)
- Статистика: выручка, количество записей

---

## ❓ Частые проблемы

### Ошибка: "Failed to save booking"
✅ Проверьте переменные окружения на Vercel
✅ Убедитесь, что SQL схема применена в Supabase

### Напоминания не отправляются
✅ Проверьте GitHub Actions логи
✅ Убедитесь, что `BOT_TOKEN` добавлен в GitHub Secrets
✅ Проверьте, что у записей есть `telegram_chat_id` или `client_user_id`

### Бот не открывает приложение
✅ Убедитесь, что URL начинается с `https://`
✅ Проверьте, что проект деплоится без ошибок

---

## 📞 Поддержка

При проблемах проверяйте:
1. **Vercel Logs** — логи API запросов
2. **Supabase Logs** — ошибки базы данных
3. **GitHub Actions** — логи напоминаний
