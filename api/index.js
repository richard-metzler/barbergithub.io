import TelegramBot from 'node-telegram-bot-api';

export default async function handler(req, res) {
  if (!process.env.BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN missing' });
  }
  
  try {
    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    const body = req.body;
    
    if (body?.message?.text === '/start') {
      const chatId = body.message.chat.id;
      await bot.sendMessage(chatId, 
        '🎉 *Telegram Booking Bot готов!*', {
          reply_markup: {
            inline_keyboard: [[
              { 
                text: '🚀 Открыть бронирование', 
                web_app: { 
                  url: 'https://project-lmebt.vercel.app' 
                } 
              }
            ]]
          }
        });
    }
    
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
