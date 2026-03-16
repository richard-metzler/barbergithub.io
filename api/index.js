export default async function handler(req, res) {
  // Debug
  console.log('BOT_TOKEN:', !!process.env.BOT_TOKEN);
  
  if (!process.env.BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN missing' });
  }
  
  try {
    const TelegramBot = await import('node-telegram-bot-api');
    const bot = new TelegramBot(process.env.BOT_TOKEN);
    
    if (req.body?.message) {
      const chatId = req.body.message.chat.id;
      const text = req.body.message.text || '';
      
      if (text === '/start') {
        await bot.sendMessage(chatId, 
          '🎉 *Telegram Booking Bot готов!*\n\n' +
          'Нажмите кнопку для открытия веб-приложения:', 
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '🚀 Открыть бронирование', web_app: { url: 'https://barbergithub.io' } }
              ]]
            }
          });
      }
    }
    
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
