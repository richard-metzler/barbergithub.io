-- Схема базы данных Supabase для барбершопа BLADE & STYLE
-- Выполните этот SQL в редакторе Supabase: https://app.supabase.com/project/_/sql

-- ============================================
-- 1. Таблица услуг (services)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Таблица мастеров (masters)
-- ============================================
CREATE TABLE IF NOT EXISTS masters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  specialty TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Таблица записей (bookings)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  service TEXT NOT NULL,
  service_price INTEGER NOT NULL,
  master TEXT NOT NULL,
  master_id TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_user_id BIGINT,
  want_notification BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
  reminder_sent BOOLEAN DEFAULT false,
  telegram_chat_id BIGINT
);

-- ============================================
-- 4. Индексы для ускорения поиска
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reminder ON bookings(want_notification, reminder_sent, date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_user_id);

-- ============================================
-- 5. Начальные данные (опционально)
-- ============================================
INSERT INTO services (id, name, price, duration, emoji) VALUES
  ('s1', 'Мужская стрижка', 1500, 45, '💇‍♂️'),
  ('s2', 'Женская стрижка', 2500, 60, '💇‍♀️'),
  ('s3', 'Детская стрижка', 1000, 30, '👦'),
  ('s4', 'Стрижка + Борода', 2200, 60, '🧔'),
  ('s5', 'Окрашивание', 4000, 120, '🎨'),
  ('s6', 'Укладка', 1200, 30, '✨'),
  ('s7', 'Моделирование бороды', 1000, 30, '🪒'),
  ('s8', 'Камуфляж седины', 1800, 45, '🖌️')
ON CONFLICT (id) DO NOTHING;

INSERT INTO masters (id, name, avatar, specialty, rating) VALUES
  ('m1', 'Алексей', '👨‍🎨', 'Топ-барбер', 4.9),
  ('m2', 'Мария', '👩‍🎨', 'Стилист-колорист', 4.8),
  ('m3', 'Дмитрий', '🧑‍🎨', 'Барбер', 4.7),
  ('m4', 'Елена', '👩‍💼', 'Стилист', 4.9)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. RLS (Row Level Security) - опционально
-- ============================================
-- Включаем RLS для таблицы bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Разрешаем всем вставлять новые записи (для публичного API)
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Разрешаем всем читать записи (для админки)
CREATE POLICY "Allow public read bookings" ON bookings
  FOR SELECT USING (true);

-- Разрешаем обновлять только статус (для админки)
CREATE POLICY "Allow public update bookings" ON bookings
  FOR UPDATE USING (true);
