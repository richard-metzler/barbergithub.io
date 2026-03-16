process.env.NTBA_FIX_319 = 1;
const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  try {
    const bot = new TelegramBot(process.env.BOT_TOKEN);
    const body = req.body;
    
    if (body.message) {
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
    
    res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};
