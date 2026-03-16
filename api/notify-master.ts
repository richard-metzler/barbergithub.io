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

    const { booking, masterId } = req.body;

    if (!booking || !masterId) {
      return res.status(400).json({ error: 'booking and masterId required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Получаем chat_id мастера
    const { data: master } = await supabase
      .from('masters')
      .select('telegram_chat_id, name')
      .eq('id', masterId)
      .single();

    if (!master || !master.telegram_chat_id) {
      console.log('Master chat_id not found');
      return res.status(200).json({ success: true, message: 'Master not notified' });
    }

    // Отправляем уведомление мастеру
    const message = `🔔 *Новая запись!*\n\n` +
      `📅 ${formatDate(booking.date)} в ${booking.time}\n` +
      `✂️ Услуга: ${booking.service}\n` +
      `💰 ${booking.servicePrice} ₽\n\n` +
      `👤 Клиент: ${booking.clientName}\n` +
      `📞 ${booking.clientPhone}\n\n` +
      `Вы: ${master.name}`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: master.telegram_chat_id,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Master notified',
      masterChatId: master.telegram_chat_id
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
