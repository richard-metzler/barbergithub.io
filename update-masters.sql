-- SQL скрипт для настройки мастеров
-- Выполните в Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- 1. Добавляем поле telegram_chat_id в таблицу masters
ALTER TABLE masters ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Удаляем всех текущих мастеров
DELETE FROM masters;

-- 3. Добавляем тестового мастера с вашим Telegram ID
INSERT INTO masters (id, name, avatar, specialty, rating, telegram_chat_id, is_active) VALUES
  ('m1', 'Алексей', '👨‍🎨', 'Топ-барбер', 4.9, 1362609452, true);

-- 4. Проверяем результат
SELECT * FROM masters;
