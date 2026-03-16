-- Добавляем поле is_master для таблицы bookings
-- Это нужно чтобы понимать, является ли пользователь мастером

-- Проверяем masters таблицу
SELECT id, name, telegram_chat_id FROM masters;

-- Проверяем, есть ли ваш ID (1362609452) в мастерах
SELECT * FROM masters WHERE telegram_chat_id = 1362609452;
