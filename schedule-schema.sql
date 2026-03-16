-- SQL скрипт для создания таблицы расписания мастеров
-- Выполните в Supabase SQL Editor

-- 1. Таблица расписания (мастер может отметить занятость)
CREATE TABLE IF NOT EXISTS schedule (
  id BIGSERIAL PRIMARY KEY,
  master_id TEXT NOT NULL REFERENCES masters(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT true,  -- true = занято/заблокировано
  reason TEXT,  -- причина блокировки (напр. "запись по телефону")
  client_name TEXT,  -- имя клиента если запись по телефону
  client_phone TEXT,  -- телефон клиента
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT,  -- Telegram ID кто создал
  
  UNIQUE(master_id, date, time)
);

-- 2. Индексы для ускорения
CREATE INDEX IF NOT EXISTS idx_schedule_master ON schedule(master_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);
CREATE INDEX IF NOT EXISTS idx_schedule_master_date ON schedule(master_id, date);

-- 3. RLS (безопасность)
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Разрешаем всем читать расписание
CREATE POLICY "Allow public read schedule" ON schedule
  FOR SELECT USING (true);

-- Разрешаем мастерам создавать/редактировать свои записи
CREATE POLICY "Allow masters to insert schedule" ON schedule
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow masters to update schedule" ON schedule
  FOR UPDATE USING (true);

CREATE POLICY "Allow masters to delete schedule" ON schedule
  FOR DELETE USING (true);

-- 4. Проверяем результат
SELECT * FROM schedule LIMIT 5;
