/**
 * Скрипт для отправки напоминаний о записях
 * Запускается через GitHub Actions каждые 30 минут
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !BOT_TOKEN) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔔 Starting reminder check...');

  // Получаем текущую дату и время
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  // Форматируем для сравнения (YYYY-MM-DD)
  const todayStr = now.toISOString().slice(0, 10);
  const inTwoHoursStr = inTwoHours.toISOString().slice(0, 10);
  const inTwoHoursTime = inTwoHours.toTimeString().slice(0, 5);

  console.log(`📅 Today: ${todayStr}`);
  console.log(`⏰ Checking for appointments before ${inTwoHoursStr} ${inTwoHoursTime}`);

  // Находим записи на сегодня, где ещё не отправлено напоминание
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', todayStr)
    .eq('want_notification', true)
    .eq('reminder_sent', false)
    .eq('status', 'confirmed')
    .order('time', { ascending: true });

  if (error) {
    console.error('❌ Supabase error:', error);
    process.exit(1);
  }

  if (!bookings || bookings.length === 0) {
    console.log('✅ No reminders to send');
    return;
  }

  console.log(`📋 Found ${bookings.length} bookings to remind`);

  let sentCount = 0;
  let failedCount = 0;

  for (const booking of bookings) {
    // Проверяем, нужно ли отправлять напоминание (за 2 часа до времени)
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const timeUntilBooking = bookingDateTime.getTime() - now.getTime();
    const twoHours = 2 * 60 * 60 * 1000;

    // Отправляем, если до записи осталось меньше 2 часов, но больше 0
    if (timeUntilBooking > 0 && timeUntilBooking <= twoHours) {
      const message = `🔔 *Напоминание о записи!*\n\n` +
        `Через 2 часа у вас стрижка в *BLADE & STYLE*\n\n` +
        `⏰ Время: ${booking.time}\n` +
        `✂️ Услуга: ${booking.service}\n` +
        `👨‍🎨 Мастер: ${booking.master}\n` +
        `💰 К оплате: ${booking.service_price} ₽\n\n` +
        `Ждём вас! 💈`;

      // Отправляем через Telegram Bot API
      try {
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: booking.telegram_chat_id || booking.client_user_id,
            text: message,
            parse_mode: 'Markdown',
          }),
        });

        const result = await response.json();
        
        if (result.ok) {
          console.log(`✅ Reminder sent to ${booking.client_name} (${booking.time})`);
          sentCount++;

          // Помечаем напоминание как отправленное
          await supabase
            .from('bookings')
            .update({ reminder_sent: true })
            .eq('id', booking.id);
        } else {
          console.error(`❌ Telegram error for ${booking.client_name}:`, result);
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ Error sending to ${booking.client_name}:`, error);
        failedCount++;
      }
    } else {
      console.log(`⏭️ Skipping ${booking.client_name} (${booking.time}) - not time yet`);
    }
  }

  console.log(`\n📊 Summary: ${sentCount} sent, ${failedCount} failed`);
}

main().catch(console.error);
