process.env.NTBA_FIX_319 = 1;
const TelegramBot = require('node-telegram-bot-api');

module.exports = async (req, res) => {
  try {
    const bot = new TelegramBot(process.env.BOT_TOKEN);
    const body = req.body;

    // Проверяем, есть ли сообщение
    if (body.message) {
      const chatId = body.message.chat.id;
      const messageId = body.message.message_id;
      const text = body.message.text || '';

      // Если это /start - удаляем сообщение и ничего не отправляем
      if (text === '/start') {
        try {
          // Удаляем сообщение /start
          await bot.deleteMessage(chatId, messageId);
        } catch (deleteError) {
          console.error('Failed to delete message:', deleteError);
        }
        // Не отправляем никаких ответов
      }
    }

    // Проверяем callback query (inline кнопки)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      // Обрабатываем нажатия на кнопки, если нужно
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
};
