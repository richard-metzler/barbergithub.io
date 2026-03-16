-- Исправление роли суперадмина
-- Выполните в Supabase SQL Editor

UPDATE user_roles 
SET role = 'superadmin' 
WHERE telegram_user_id = 1362609452;

-- Проверка
SELECT * FROM user_roles WHERE telegram_user_id = 1362609452;
