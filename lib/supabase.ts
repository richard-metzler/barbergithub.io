import { createClient } from '@supabase/supabase-js';

// Типы для данных
export interface Booking {
  id?: number;
  created_at?: string;
  service: string;
  service_price: number;
  master: string;
  master_id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  client_user_id?: number;
  want_notification: boolean;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  reminder_sent: boolean;
}

// Создаём клиент Supabase
// Переменные окружения будут доступны в Vercel Functions
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Хелпер для создания клиента с сервисным ключом (для серверных операций)
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;
  return createClient(supabaseUrl, serviceKey);
}
