#!/usr/bin/env node

/**
 * Скрипт проверки настройки проекта
 * Запустите: node setup-check.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const projectDir = join(process.cwd());

console.log('\n🔍 Проверка настройки проекта BLADE & STYLE Barber\n');
console.log('═'.repeat(50));

let allGood = true;

// 1. Проверка .env файла
console.log('\n📄 1. Проверка .env файла...');
const envPath = join(projectDir, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  const checks = [
    { key: 'BOT_TOKEN', name: 'Telegram Bot Token' },
    { key: 'SUPABASE_URL', name: 'Supabase URL' },
    { key: 'SUPABASE_ANON_KEY', name: 'Supabase Anon Key' },
    { key: 'SUPABASE_SERVICE_KEY', name: 'Supabase Service Key' },
  ];
  
  checks.forEach(({ key, name }) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    if (match && match[1].trim() && !match[1].includes('your-')) {
      console.log(`   ✅ ${name}`);
    } else {
      console.log(`   ❌ ${name} — не настроен`);
      allGood = false;
    }
  });
} else {
  console.log('   ❌ .env файл не найден');
  console.log('   💡 Скопируйте .env.example в .env и заполните значения');
  allGood = false;
}

// 2. Проверка API файлов
console.log('\n📁 2. Проверка API файлов...');
const apiFiles = [
  'api/booking.ts',
  'api/get-bookings.ts',
  'api/update-booking.ts',
  'lib/supabase.ts',
];

apiFiles.forEach(file => {
  const filePath = join(projectDir, file);
  if (existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} — не найден`);
    allGood = false;
  }
});

// 3. Проверка GitHub Actions
console.log('\n⚙️ 3. Проверка GitHub Actions...');
const workflowPath = join(projectDir, '.github/workflows/reminders.yml');
if (existsSync(workflowPath)) {
  console.log('   ✅ reminders.yml найден');
} else {
  console.log('   ❌ reminders.yml не найден');
  allGood = false;
}

// 4. Проверка package.json
console.log('\n📦 4. Проверка зависимостей...');
const packagePath = join(projectDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

const requiredDeps = {
  '@supabase/supabase-js': 'dependencies',
  'node-telegram-bot-api': 'dependencies',
};

Object.entries(requiredDeps).forEach(([dep, section]) => {
  if (packageJson[section]?.[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ ${dep} — не установлен`);
    allGood = false;
  }
});

// 5. Проверка SQL схемы
console.log('\n🗄️ 5. Проверка SQL схемы...');
const sqlPath = join(projectDir, 'supabase-schema.sql');
if (existsSync(sqlPath)) {
  console.log('   ✅ supabase-schema.sql найден');
  console.log('   💡 Примените этот SQL в Supabase SQL Editor');
} else {
  console.log('   ❌ supabase-schema.sql не найден');
  allGood = false;
}

// Итог
console.log('\n' + '═'.repeat(50));
if (allGood) {
  console.log('\n✅ Все проверки пройдены! Проект готов к деплою.\n');
  console.log('📋 Следующие шаги:');
  console.log('   1. Примените SQL схему в Supabase');
  console.log('   2. Добавьте переменные окружения на Vercel');
  console.log('   3. Добавьте секреты в GitHub Actions');
  console.log('   4. Задеплойте на Vercel\n');
} else {
  console.log('\n❌ Найдены проблемы. Устраните их перед деплоем.\n');
  console.log('📖 Откройте BACKEND_SETUP.md для подробной инструкции.\n');
}

process.exit(allGood ? 0 : 1);
