import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServerClient, type Booking } from '../lib/supabase';

// Разрешаем CORS для запросов с фронтенда
function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  // Обработка preflight запроса
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userId, booking } = req.body;

    // Проверка обязательных данных
    if (!booking) {
      return res.status(400).json({ error: 'Booking data required' });
    }

    // Создаём серверный клиент Supabase
    const supabase = createServerClient();

    // Формируем объект для вставки
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

    // Сохраняем в базу
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save booking', details: error.message });
    }

    // Отправляем подтверждение в Telegram (если есть chat_id)
    if (process.env.BOT_TOKEN && booking.client_user_id) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
        
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
            chat_id: booking.client_user_id,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgError) {
        console.error('Telegram notification error:', tgError);
        // Не прерываем запрос, если уведомление не отправилось
      }
    }

    return res.status(200).json({ 
      success: true, 
      booking: data,
      message: 'Booking saved successfully' 
    });

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
