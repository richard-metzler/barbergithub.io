# 🤖 Настройка Telegram Mini App для записи на стрижку

## Шаг 1: Создание бота в Telegram

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Введите название бота, например: `Барбершоп BLADE & STYLE`
4. Введите username бота, например: `blade_style_bot` (должен заканчиваться на `bot`)
5. **Сохраните токен**, который выдаст BotFather (выглядит так: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Размещение веб-приложения (Hosting)

Ваше приложение должно быть доступно по HTTPS. Варианты:

### Вариант А: Vercel (бесплатно, рекомендуется)
1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Загрузите проект на GitHub
3. Подключите репозиторий к Vercel
4. Получите ссылку вида: `https://your-app.vercel.app`

### Вариант Б: Netlify (бесплатно)
1. Зарегистрируйтесь на [netlify.com](https://netlify.com)
2. Перетащите папку `dist` на сайт Netlify
3. Получите ссылку вида: `https://your-app.netlify.app`

### Вариант В: GitHub Pages (бесплатно)
1. Создайте репозиторий на GitHub
2. Загрузите содержимое папки `dist`
3. Включите GitHub Pages в настройках репозитория

## Шаг 3: Подключение Mini App к боту

1. Вернитесь к **@BotFather**
2. Отправьте `/mybots` и выберите вашего бота
3. Нажмите **Bot Settings** → **Menu Button** → **Configure Menu Button**
4. Введите текст кнопки: `📅 Записаться`
5. Введите URL вашего приложения: `https://your-app.vercel.app`

### Альтернатива: Web App через команду
1. Отправьте BotFather команду `/setmenubutton`
2. Или используйте `/newapp` для создания Web App

## Шаг 4: Настройка приветственного сообщения

1. В @BotFather отправьте `/setdescription`
2. Выберите бота
3. Введите описание:
```
✂️ Барбершоп BLADE & STYLE

Запишитесь на стрижку в пару кликов!
• Выберите услугу и мастера
• Укажите удобное время
• Получите напоминание за 2 часа

Нажмите кнопку «📅 Записаться» ниже 👇
```

## Шаг 5: Настройка команд бота

1. Отправьте `/setcommands` в @BotFather
2. Выберите бота
3. Введите:
```
start - Начать запись
services - Наши услуги
prices - Цены
contacts - Контакты
```

## 🔧 Для полноценной работы (бэкенд)

Чтобы бот отправлял напоминания и сохранял записи, нужен сервер. Вот что потребуется:

### Необходимые компоненты:
1. **Сервер** (Node.js, Python, или другой)
2. **База данных** (PostgreSQL, MongoDB, или Firebase)
3. **Библиотека для Telegram Bot API**:
   - Node.js: `telegraf` или `node-telegram-bot-api`
   - Python: `python-telegram-bot` или `aiogram`

### Пример серверного кода (Node.js):

```javascript
// server.js
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cron = require('node-cron');

const bot = new TelegramBot('ВАШ_ТОКЕН', { polling: true });
const app = express();

// Получение данных из Mini App
app.post('/api/booking', (req, res) => {
  const { chatId, booking } = req.body;
  
  // Сохранить в базу данных
  saveBooking(booking);
  
  // Отправить подтверждение
  bot.sendMessage(chatId, `✅ Вы записаны!\n\n` +
    `📅 ${booking.date} в ${booking.time}\n` +
    `✂️ ${booking.service}\n` +
    `👨‍🎨 Мастер: ${booking.master}`
  );
  
  // Запланировать напоминание
  scheduleReminder(chatId, booking);
  
  res.json({ success: true });
});

// Напоминание за 2 часа
function scheduleReminder(chatId, booking) {
  const reminderTime = new Date(booking.datetime);
  reminderTime.setHours(reminderTime.getHours() - 2);
  
  // Используйте node-schedule или cron для планирования
  schedule.scheduleJob(reminderTime, () => {
    bot.sendMessage(chatId, 
      `🔔 Напоминание!\n\n` +
      `Через 2 часа у вас стрижка в BLADE & STYLE\n` +
      `⏰ ${booking.time}\n` +
      `👨‍🎨 Мастер: ${booking.master}\n\n` +
      `Ждём вас! 💈`
    );
  });
}

app.listen(3000);
```

## 📱 Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите **START** или кнопку меню **📅 Записаться**
3. Должно открыться ваше веб-приложение прямо в Telegram!

## 🎨 Дополнительные настройки

### Установить аватар бота:
1. `/setuserpic` в @BotFather
2. Отправьте изображение (рекомендуется 512x512 px)

### Включить inline-режим:
1. `/setinline` в @BotFather
2. Введите placeholder, например: `Поиск услуг...`

## ❓ Частые вопросы

**Q: Бот не открывает приложение?**
A: Убедитесь, что URL начинается с `https://` (не http)

**Q: Как получить chat_id пользователя?**
A: В Mini App используйте `window.Telegram.WebApp.initDataUnsafe.user.id`

**Q: Как закрыть Mini App после записи?**
A: Вызовите `window.Telegram.WebApp.close()`

---

## 📞 Поддержка

Если нужна помощь с настройкой бэкенда или интеграцией — обращайтесь!
