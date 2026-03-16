# 🔄 Обновление базы данных

## Важно! Выполните этот SQL скрипт в Supabase

### Шаг 1: Откройте SQL Editor
1. Перейдите на https://app.supabase.com
2. Выберите ваш проект
3. В левом меню нажмите **SQL Editor**
4. Нажмите **New Query**

### Шаг 2: Выполните SQL скрипт

Скопируйте всё содержимое файла `update-roles.sql` и вставьте в SQL Editor.

Или выполните по шагам:

```sql
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

-- 4. Добавляем колонку is_cancelled в bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by BIGINT;
```

### Шаг 3: Проверьте результат

```sql
-- Проверка таблицы ролей
SELECT * FROM user_roles;

-- Должно быть:
-- 1362609452 | superadmin
-- [ID мастера] | master
```

---

## ✅ После обновления БД:

1. **Подождите 1-2 минуты** пока Vercel перезадеплоит
2. **Очистите кэш Telegram** (удалите бота и найдите заново)
3. **Откройте бота** — должна появиться кнопка "Начать"

---

## 📋 Что изменится:

### Для клиента (ID не в базе мастеров):
- Видит кнопку "📅 Записаться на стрижку"
- После записи видит свою запись с кнопкой "Отменить"

### Для мастера (ID есть в masters.telegram_chat_id):
- Видит кнопку "📊 Панель мастера"
- Открывается панель с его записями

### Для суперадмина (ID: 1362609452):
- Видит кнопку "⚙️ Панель управления"
- Полный доступ ко всем записям, мастерам, услугам
- Может редактировать и удалять всё
