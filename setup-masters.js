#!/usr/bin/env node

/**
 * Скрипт для настройки мастеров в Supabase
 * Запуск: node setup-masters.js
 */

import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8');
const getToken = (key) => env.match(new RegExp(key + '=(.+)'))?.[1].trim();

const SUPABASE_URL = getToken('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getToken('SUPABASE_SERVICE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

async function setupMasters() {
  console.log('🔧 Настройка мастеров в Supabase...\n');

  const sql = `
    -- Добавляем поля для мастеров
    ALTER TABLE masters ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
    ALTER TABLE masters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

    -- Удаляем всех мастеров
    DELETE FROM masters;

    -- Добавляем тестового мастера (ID: 1362609452)
    INSERT INTO masters (id, name, avatar, specialty, rating, telegram_chat_id, is_active) VALUES
      ('m1', 'Алексей', '👨‍🎨', 'Топ-барбер', 4.9, 1362609452, true);

    -- Проверяем
    SELECT * FROM masters;
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql })
    });

    // Альтернативно: используем прямой SQL через admin endpoint
    const result = await fetch(`${SUPABASE_URL}/admin/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!result.ok) {
      const error = await result.text();
      console.log('⚠️ Admin API недоступен, попробуйте вручную:\n');
      console.log('1. Откройте https://app.supabase.com');
      console.log('2. SQL Editor → New Query');
      console.log('3. Вставьте SQL из update-masters.sql');
      console.log('4. Нажмите Run\n');
      console.log('Ошибка:', error);
      return false;
    }

    const data = await result.json();
    console.log('✅ Мастера настроены!\n');
    console.log('Результат:', JSON.stringify(data, null, 2));
    return true;

  } catch (error) {
    console.log('⚠️ Не удалось выполнить автоматически.\n');
    console.log('Выполните вручную:');
    console.log('1. Откройте https://app.supabase.com');
    console.log('2. SQL Editor → New Query');
    console.log('3. Вставьте содержимое update-masters.sql');
    console.log('4. Нажмите Run\n');
    console.log('Ошибка:', error.message);
    return false;
  }
}

setupMasters();
