-- SQL скрипт для обновления базы данных
-- Выполните в Supabase SQL Editor

-- 1. Добавляем таблицу ролей пользователей
CREATE TABLE IF NOT EXISTS user_roles (
  telegram_user_id BIGINT PRIMARY KEY,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'master', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Добавляем суперадмина (ID: 1362609452)
INSERT INTO user_roles (telegram_user_id, role) 
VALUES (1362609452, 'superadmin')
ON CONFLICT (telegram_user_id) DO UPDATE SET role = 'superadmin';

-- 3. Добавляем мастеров как пользователей с ролью master
INSERT INTO user_roles (telegram_user_id, role)
SELECT telegram_chat_id, 'master' 
FROM masters 
WHERE telegram_chat_id IS NOT NULL
ON CONFLICT (telegram_user_id) DO UPDATE SET role = 'master';

-- 4. Добавляем колонку is_active в bookings для мягкой деактивации
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by BIGINT;

-- 5. Создаём функцию для получения роли пользователя
CREATE OR REPLACE FUNCTION get_user_role(p_telegram_user_id BIGINT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_roles 
  WHERE telegram_user_id = p_telegram_user_id;
  
  IF user_role IS NULL THEN
    -- Проверяем, является ли пользователь мастером
    SELECT 'master' INTO user_role FROM masters 
    WHERE telegram_chat_id = p_telegram_user_id;
    
    IF user_role IS NULL THEN
      user_role := 'client';
    END IF;
    
    -- Сохраняем роль
    INSERT INTO user_roles (telegram_user_id, role) 
    VALUES (p_telegram_user_id, user_role)
    ON CONFLICT (telegram_user_id) DO NOTHING;
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;

-- 6. Проверяем результат
SELECT * FROM user_roles;
