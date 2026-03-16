import { useState, useEffect, useRef, useCallback } from 'react';
import {
  services, defaultMasters, getAvailableSlots, getNextDays, formatDate, formatDateFull,
  type Service, type Master,
} from './data';
import { useTelegram } from './useTelegram';

type Step = 'welcome' | 'services' | 'master' | 'date' | 'time' | 'name' | 'phone' | 'notification' | 'confirm' | 'done';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  widget?: Step;
}

let msgId = 0;
function createMsg(text: string, sender: 'bot' | 'user', widget?: Step): Message {
  return { id: ++msgId, text, sender, timestamp: new Date(), widget };
}

export function ChatBot() {
  const { init, getUserName, getUserId, hapticFeedback, sendData, close, isTelegram } = useTelegram();

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>('welcome');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [wantNotification, setWantNotification] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState(false);
  const [masters, setMasters] = useState<Master[]>(defaultMasters);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загрузка мастеров из API
  useEffect(() => {
    const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;
    fetch(`${API_URL}/api/masters`)
      .then(r => r.json())
      .then(data => {
        if (data.masters && data.masters.length > 0) {
          setMasters(data.masters);
        }
      })
      .catch(() => {
        console.log('Using default masters');
        setMasters(defaultMasters);
      });
  }, []);

  // Инициализация Telegram WebApp
  useEffect(() => {
    init();
    // Если пользователь зашел из Telegram, берем его имя
    const tgName = getUserName();
    if (tgName) {
      setClientName(tgName);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const addBotMessage = useCallback((text: string, widget?: Step) => {
    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, createMsg(text, 'bot', widget)]);
      scrollToBottom();
    }, 600 + Math.random() * 400);
  }, [scrollToBottom]);

  const addUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, createMsg(text, 'user')]);
    scrollToBottom();
  }, [scrollToBottom]);

  // Welcome
  useEffect(() => {
    if (step === 'welcome') {
      addBotMessage('Привет! 👋 Я бот барбершопа «BLADE & STYLE».');
      setTimeout(() => {
        addBotMessage('Помогу вам записаться на стрижку быстро и удобно. Выберите услугу:', 'services');
        setStep('services');
      }, 1200);
    }
  }, []);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    addUserMessage(`${service.emoji} ${service.name}`);
    setTimeout(() => {
      addBotMessage(`Отлично! ${service.name} — отличный выбор! Теперь выберите мастера:`, 'master');
      setStep('master');
    }, 300);
  };

  const handleSelectMaster = (master: Master) => {
    setSelectedMaster(master);
    addUserMessage(`${master.avatar} ${master.name}`);
    setTimeout(() => {
      addBotMessage(`${master.name} — прекрасный специалист! ⭐ ${master.rating}\n\nВыберите удобную дату:`, 'date');
      setStep('date');
    }, 300);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    addUserMessage(`📅 ${formatDate(date)}`);
    setTimeout(() => {
      addBotMessage('Выберите удобное время:', 'time');
      setStep('time');
    }, 300);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    addUserMessage(`🕐 ${time}`);
    setTimeout(() => {
      addBotMessage('Почти готово! Введите ваше имя:', 'name');
      setStep('name');
      setTimeout(() => inputRef.current?.focus(), 800);
    }, 300);
  };

  const handleSubmitName = () => {
    if (!clientName.trim()) return;
    addUserMessage(clientName.trim());
    setTimeout(() => {
      addBotMessage(`Приятно познакомиться, ${clientName.trim()}! 😊\n\nТеперь введите номер телефона:`, 'phone');
      setStep('phone');
      setTimeout(() => inputRef.current?.focus(), 800);
    }, 300);
  };

  const handleSubmitPhone = () => {
    if (!clientPhone.trim()) return;
    addUserMessage(clientPhone.trim());
    setTimeout(() => {
      addBotMessage('Хотите получать напоминание о записи за 2 часа?', 'notification');
      setStep('notification');
    }, 300);
  };

  const handleNotification = (want: boolean) => {
    setWantNotification(want);
    addUserMessage(want ? '✅ Да, хочу получать напоминание' : '❌ Нет, спасибо');
    setTimeout(() => {
      addBotMessage('Проверьте данные вашей записи:', 'confirm');
      setStep('confirm');
    }, 300);
  };

  const handleConfirm = async () => {
    addUserMessage('✅ Подтверждаю!');

    // Вибрация при подтверждении (в Telegram)
    hapticFeedback('success');

    // Формируем данные для отправки
    const bookingData = {
      action: 'booking_confirmed',
      userId: getUserId(),
      booking: {
        service: selectedService?.name,
        servicePrice: selectedService?.price,
        master: selectedMaster?.name,
        masterId: selectedMaster?.id,
        date: selectedDate?.toISOString().slice(0, 10),
        time: selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        wantNotification,
      }
    };

    // Отправляем данные боту (если запущено в Telegram)
    if (isTelegram) {
      sendData(bookingData);
    }

    // Отправляем на бэкенд для сохранения в базу
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/booking';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('API error:', result);
        // Не прерываем, показываем успех всё равно
      } else {
        console.log('✅ Booking saved:', result.booking?.id);
      }
    } catch (error) {
      console.error('Failed to save booking:', error);
      // Не прерываем пользователя, просто логируем ошибку
    }

    setTimeout(() => {
      let doneMsg = '🎉 Запись подтверждена!\n\nЖдем вас в нашем барбершопе.';
      if (wantNotification) {
        doneMsg = '🎉 Запись подтверждена!\n\n🔔 Мы пришлем вам уведомление за 2 часа до визита. До встречи!';
      }
      addBotMessage(doneMsg, 'done');
      setStep('done');
    }, 300);
  };

  const handleRestart = () => {
    setMessages([]);
    setStep('welcome');
    setSelectedService(null);
    setSelectedMaster(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientName('');
    setClientPhone('');
    setWantNotification(true);
    msgId = 0;
    setTimeout(() => {
      addBotMessage('Привет! 👋 Я бот барбершопа «BLADE & STYLE».');
      setTimeout(() => {
        addBotMessage('Помогу вам записаться на стрижку быстро и удобно. Выберите услугу:', 'services');
        setStep('services');
      }, 1200);
    }, 200);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'name') handleSubmitName();
      if (step === 'phone') handleSubmitPhone();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const availableDays = getNextDays(14);
  const availableSlots = selectedMaster && selectedDate
    ? getAvailableSlots(selectedMaster.id, selectedDate.toISOString().slice(0, 10))
    : [];

  return (
    <div className="flex w-full h-full max-h-[85vh] sm:h-[700px] max-w-md bg-[#17212b] rounded-2xl overflow-hidden shadow-2xl border border-[#242f3d] flex-col relative mx-2">
      {/* Header */}
      <div className="bg-[#1c2733] px-4 py-3 flex items-center gap-3 border-b border-[#242f3d] shrink-0 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg">
          ✂️
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm">BLADE & STYLE Bot</div>
          <div className="text-[#6c7883] text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            онлайн
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="text-[#6c7883] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#242f3d]"
          title="Начать заново"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 21" />
            <path d="M3 14V21H10" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#242f3d transparent' }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            
            {/* Widget Service */}
            {msg.sender === 'bot' && msg.widget === 'services' && step === 'services' && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in-up">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className="flex flex-col text-left p-3 rounded-xl bg-[#2b5278] hover:bg-[#326292] text-white transition-all shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{service.emoji}</span>
                      <span className="font-semibold text-sm">{service.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-blue-200">
                      <span>{service.price} ₽</span>
                      <span>{service.duration} мин</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Widget Master */}
            {msg.sender === 'bot' && msg.widget === 'master' && step === 'master' && (
              <div className="mt-2 flex flex-col gap-2 animate-fade-in-up">
                {masters.map(master => (
                  <button
                    key={master.id}
                    onClick={() => handleSelectMaster(master)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#2b5278] hover:bg-[#326292] text-white transition-all shadow-sm active:scale-95 text-left"
                  >
                    <div className="text-3xl">{master.avatar}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{master.name}</div>
                      <div className="text-xs text-blue-200">{master.specialty}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-yellow-400 text-xs font-bold">⭐ {master.rating}</div>
                      <div className="text-xs text-blue-200">{Math.floor(master.rating * 20)} отз.</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Widget Date */}
            {msg.sender === 'bot' && msg.widget === 'date' && step === 'date' && (
              <div className="mt-2 grid grid-cols-4 gap-2 animate-fade-in-up">
                {availableDays.map(date => {
                  const isWeekend = date.getDay() === 0;
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleSelectDate(date)}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all shadow-sm active:scale-95 ${
                        isWeekend 
                          ? 'bg-[#2b5278]/50 text-white/50 cursor-not-allowed' 
                          : 'bg-[#2b5278] hover:bg-[#326292] text-white'
                      }`}
                      disabled={isWeekend}
                    >
                      <span className="text-xs uppercase">{['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][date.getDay()]}</span>
                      <span className="font-bold text-lg">{date.getDate()}</span>
                      <span className="text-[10px]">{['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'][date.getMonth()]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Widget Time */}
            {msg.sender === 'bot' && msg.widget === 'time' && step === 'time' && (
              <div className="mt-2 grid grid-cols-3 gap-2 animate-fade-in-up">
                {availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleSelectTime(time)}
                    className="py-2 px-1 rounded-xl font-medium text-sm transition-all text-center shadow-sm active:scale-95 bg-[#2b5278] hover:bg-[#326292] text-white"
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}

            {/* Notification Widget */}
            {msg.sender === 'bot' && msg.widget === 'notification' && step === 'notification' && (
              <div className="mt-2 grid grid-cols-2 gap-2 animate-fade-in-up">
                <button
                  onClick={() => handleNotification(true)}
                  className="flex items-center justify-center py-3 rounded-xl bg-[#2b5278] hover:bg-[#326292] text-white transition-all shadow-sm active:scale-95 font-medium"
                >
                  🔔 Да, напомнить
                </button>
                <button
                  onClick={() => handleNotification(false)}
                  className="flex items-center justify-center py-3 rounded-xl bg-[#242f3d] hover:bg-[#2f3d4d] text-gray-300 transition-all shadow-sm active:scale-95 font-medium"
                >
                  🔇 Нет, не нужно
                </button>
              </div>
            )}

            {/* Widget Confirm */}
            {msg.sender === 'bot' && msg.widget === 'confirm' && step === 'confirm' && (
              <div className="mt-2 bg-[#242f3d] rounded-xl p-4 text-white text-sm animate-fade-in-up shadow-sm">
                <div className="font-semibold mb-3 border-b border-[#313f50] pb-2 text-center">
                  Ваша запись 📋
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Услуга:</span>
                    <span className="font-medium text-right">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Мастер:</span>
                    <span className="font-medium text-right">{selectedMaster?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Дата:</span>
                    <span className="font-medium text-right">
                      {selectedDate ? formatDateFull(selectedDate) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Время:</span>
                    <span className="font-medium text-right">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Сумма:</span>
                    <span className="font-medium text-right text-blue-300">{selectedService?.price} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Клиент:</span>
                    <span className="font-medium text-right">{clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Телефон:</span>
                    <span className="font-medium text-right">{clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Напоминание:</span>
                    <span className="font-medium text-right text-green-400">
                      {wantNotification ? 'За 2 часа 🔔' : 'Отключено 🔇'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Подтвердить запись
                </button>
              </div>
            )}
            
            {/* Done Widget */}
            {msg.sender === 'bot' && msg.widget === 'done' && step === 'done' && (
              <div className="mt-2 animate-fade-in-up space-y-2">
                <button
                  onClick={handleRestart}
                  className="w-full bg-[#242f3d] hover:bg-[#2b3848] text-[#5288c1] font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Записаться ещё раз
                </button>
                {isTelegram && (
                  <button
                    onClick={close}
                    className="w-full bg-[#5288c1] hover:bg-[#4372a3] text-white font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#1c2733] p-3 border-t border-[#242f3d] shrink-0">
        {(step === 'name' || step === 'phone') ? (
          <div className="flex gap-2 relative">
            <input
              ref={inputRef}
              type={step === 'phone' ? 'tel' : 'text'}
              value={step === 'name' ? clientName : clientPhone}
              onChange={(e) => step === 'name' ? setClientName(e.target.value) : setClientPhone(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={step === 'name' ? 'Введите ваше имя...' : '+7 (999) 000-00-00'}
              className="flex-1 bg-[#242f3d] text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5288c1] border border-transparent transition-all"
            />
            <button
              onClick={() => step === 'name' ? handleSubmitName() : handleSubmitPhone()}
              disabled={step === 'name' ? !clientName.trim() : !clientPhone.trim()}
              className="bg-[#5288c1] hover:bg-[#4372a3] text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 w-12 flex justify-center items-center shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-[#6c7883] py-2">
            Выберите вариант в чате выше ☝️
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.sender === 'bot';
  const time = `${message.timestamp.getHours().toString().padStart(2, '0')}:${message.timestamp.getMinutes().toString().padStart(2, '0')}`;
  
  return (
    <div className={`flex w-full animate-fade-in ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm whitespace-pre-wrap relative text-[15px] ${
        isBot 
          ? 'bg-[#182533] text-white rounded-bl-sm border border-[#242f3d]' 
          : 'bg-[#2b5278] text-white rounded-br-sm'
      }`}>
        <span dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br/>') }} />
        <span className="text-[11px] text-gray-400 ml-2 float-right mt-2 inline-block">
          {time}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex w-full justify-start animate-fade-in">
      <div className="bg-[#182533] text-white rounded-2xl rounded-bl-sm border border-[#242f3d] px-4 py-3 shadow-sm flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
