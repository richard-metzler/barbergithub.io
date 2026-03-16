import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  status: string;
  reminder_sent: boolean;
  telegram_chat_id?: number;
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Проверка переменных окружения
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const botToken = process.env.BOT_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY'
      });
    }

    const { userId, booking } = req.body;

    if (!booking) {
      return res.status(400).json({ error: 'Booking data required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const bookingData: Partial<Booking> = {
      service: booking.service,
      service_price: booking.servicePrice,
      master: booking.master,
      master_id: booking.masterId,
      date: booking.date,
      time: booking.time,
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      client_user_id: userId,
      want_notification: booking.wantNotification,
      status: 'confirmed',
      reminder_sent: false,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save booking', details: error.message });
    }

    // Отправка подтверждения в Telegram
    if (botToken && userId) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const message = `✅ *Запись подтверждена!*\n\n` +
          `📅 ${formatDate(booking.date)} в ${booking.time}\n` +
          `✂️ ${booking.service}\n` +
          `👨‍🎨 Мастер: ${booking.master}\n` +
          `💰 ${booking.servicePrice} ₽\n\n` +
          `Ждём вас в BLADE & STYLE! 💈`;

        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgError) {
        console.error('Telegram error:', tgError);
      }
    }

    // Отправка уведомления мастеру
    if (botToken && booking.masterId) {
      try {
        const notifyUrl = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/notify-master`;
        
        await fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking,
            masterId: booking.masterId,
          }),
        });
      } catch (masterError) {
        console.error('Master notification error:', masterError);
      }
    }

    return res.status(200).json({ success: true, booking: data });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
