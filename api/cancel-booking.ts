import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const botToken = process.env.BOT_TOKEN;

    if (!supabaseUrl || !supabaseKey || !botToken) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { bookingId, userId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Получаем данные записи
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Отменяем запись
    const { data, error } = await supabase
      .from('bookings')
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        status: 'canceled'
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }

    // Отправляем уведомление клиенту
    try {
      const chatId = booking.client_user_id || userId;
      const message = `❌ *Запись отменена*\n\n` +
        `📅 ${formatDate(booking.date)} в ${booking.time}\n` +
        `✂️ ${booking.service}\n` +
        `👨‍🎨 Мастер: ${booking.master}\n\n` +
        `Вы можете записаться заново в любое время.`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
    } catch (tgError) {
      console.error('Telegram error:', tgError);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Booking cancelled',
      booking: data 
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
