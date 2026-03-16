const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  console.log('BOT_TOKEN exists:', !!process.env.BOT_TOKEN);
  
  if (!process.env.BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN missing' });
  }
  
  try {
    const bot = new TelegramBot(process.env.BOT_TOKEN);
    const body = req.body;
    
    if (body?.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || '';
      
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
};
