-- Проверка таблицы schedule
-- Выполните в Supabase SQL Editor

-- 1. Проверяем существует ли таблица
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'schedule'
) as table_exists;

-- 2. Если таблица не существует, создаём:
CREATE TABLE IF NOT EXISTS schedule (
  id BIGSERIAL PRIMARY KEY,
  master_id TEXT NOT NULL REFERENCES masters(id),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT true,
  reason TEXT,
  client_name TEXT,
  client_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT,
  
  UNIQUE(master_id, date, time)
);

-- 3. Создаём индексы
CREATE INDEX IF NOT EXISTS idx_schedule_master ON schedule(master_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);
CREATE INDEX IF NOT EXISTS idx_schedule_master_date ON schedule(master_id, date);

-- 4. Проверяем результат
SELECT * FROM schedule LIMIT 5;
