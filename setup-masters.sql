-- Настройка мастеров для Telegram уведомлений
-- Скопируйте весь текст ниже и выполните в Supabase SQL Editor
-- https://app.supabase.com/project/_/sql/new

-- Шаг 1: Добавить новые колонки
ALTER TABLE masters ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Шаг 2: Удалить старых мастеров
DELETE FROM masters;

-- Шаг 3: Добавить тестового мастера с Telegram ID 1362609452
INSERT INTO masters (id, name, avatar, specialty, rating, telegram_chat_id, is_active)
VALUES ('m1', 'Алексей', 'barber', 'Топ-барбер', 4.9, 1362609452, true);

-- Шаг 4: Проверить результат
SELECT * FROM masters;
