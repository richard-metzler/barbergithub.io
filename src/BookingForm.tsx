import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from './useTelegram';
import {
  services, defaultMasters, getAvailableSlots, getNextDays, formatDate, formatDateFull,
  type Service, type Master,
} from './data';

type Step = 'services' | 'master' | 'date' | 'time' | 'name' | 'phone' | 'confirm' | 'done';

export function BookingForm() {
  const navigate = useNavigate();
  const { init, getUserName, getUserId, hapticFeedback, close, isTelegram } = useTelegram();

  const [step, setStep] = useState<Step>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
    const tgName = getUserName();
    if (tgName) setClientName(tgName);
  }, []);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep('master');
  };

  const handleSelectMaster = (master: Master) => {
    setSelectedMaster(master);
    setStep('date');
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep('name');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmitName = () => {
    if (!clientName.trim()) return;
    setStep('phone');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmitPhone = () => {
    if (!clientPhone.trim()) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    hapticFeedback('success');

    const userId = getUserId();
    const bookingData = {
      service: selectedService?.name,
      servicePrice: selectedService?.price,
      master: selectedMaster?.name,
      masterId: selectedMaster?.id,
      date: selectedDate?.toISOString().slice(0, 10),
      time: selectedTime,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      client_user_id: userId,
      want_notification: true,
    };

    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;
      
      const response = await fetch(`${API_URL}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, booking: bookingData }),
      });

      if (response.ok) {
        setStep('done');
      } else {
        alert('Ошибка при записи. Попробуйте снова.');
      }
    } catch (error) {
      alert('Ошибка при записи. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'master') setStep('services');
    else if (step === 'date') setStep('master');
    else if (step === 'time') setStep('date');
    else if (step === 'name') setStep('time');
    else if (step === 'phone') setStep('name');
    else if (step === 'confirm') setStep('phone');
    else if (step === 'done') navigate('/');
  };

  const availableDays = getNextDays(14);
  const availableSlots = selectedMaster && selectedDate
    ? getAvailableSlots(selectedMaster.id, selectedDate.toISOString().slice(0, 10))
    : [];

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col">
      {/* Header */}
      <div className="bg-[#1c2733] px-4 py-3 flex items-center gap-3 border-b border-[#242f3d]">
        <button onClick={handleBack} className="text-[#6c7883] hover:text-white p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className="flex-1 text-white font-semibold">Запись на стрижку</div>
        <div className="text-[#6c7883] text-sm">
          Шаг {Object.keys({}).indexOf(step) + 1} из 6
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Services */}
        {step === 'services' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Выберите услугу</h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className="flex flex-col text-left p-4 rounded-xl bg-[#2b5278] hover:bg-[#326292] text-white transition-all active:scale-95"
                >
                  <div className="text-2xl mb-2">{service.emoji}</div>
                  <div className="font-semibold text-sm mb-1">{service.name}</div>
                  <div className="text-xs text-blue-200">{service.price} ₽ • {service.duration} мин</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Masters */}
        {step === 'master' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Выберите мастера</h2>
            <div className="space-y-3">
              {defaultMasters.map(master => (
                <button
                  key={master.id}
                  onClick={() => handleSelectMaster(master)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#2b5278] hover:bg-[#326292] text-white transition-all active:scale-95"
                >
                  <div className="text-4xl">{master.avatar}</div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{master.name}</div>
                    <div className="text-sm text-blue-200">{master.specialty}</div>
                  </div>
                  <div className="text-yellow-400 font-bold">⭐ {master.rating}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        {step === 'date' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Выберите дату</h2>
            <div className="grid grid-cols-4 gap-2">
              {availableDays.map(date => {
                const isWeekend = date.getDay() === 0;
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !isWeekend && handleSelectDate(date)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      isWeekend
                        ? 'bg-[#242f3d] text-[#4a5a6a] cursor-not-allowed'
                        : 'bg-[#2b5278] hover:bg-[#326292] text-white active:scale-95'
                    }`}
                    disabled={isWeekend}
                  >
                    <span className="text-xs uppercase">{['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][date.getDay()]}</span>
                    <span className="font-bold text-xl">{date.getDate()}</span>
                    <span className="text-xs">{['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'][date.getMonth()]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Time */}
        {step === 'time' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Выберите время</h2>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map(time => (
                <button
                  key={time}
                  onClick={() => handleSelectTime(time)}
                  className="py-3 rounded-xl bg-[#2b5278] hover:bg-[#326292] text-white font-semibold active:scale-95"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name */}
        {step === 'name' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Введите ваше имя</h2>
            <input
              ref={inputRef}
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}
              placeholder="Как к вам обращаться?"
              className="w-full bg-[#242f3d] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmitName}
              disabled={!clientName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
            >
              Далее
            </button>
          </div>
        )}

        {/* Phone */}
        {step === 'phone' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Введите телефон</h2>
            <input
              ref={inputRef}
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitPhone()}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-[#242f3d] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmitPhone}
              disabled={!clientPhone.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
            >
              Далее
            </button>
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold mb-4">Проверьте данные</h2>
            <div className="bg-[#242f3d] rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Услуга:</span>
                <span className="text-white">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Мастер:</span>
                <span className="text-white">{selectedMaster?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Дата:</span>
                <span className="text-white">{selectedDate ? formatDateFull(selectedDate) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Время:</span>
                <span className="text-white">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Имя:</span>
                <span className="text-white">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Телефон:</span>
                <span className="text-white">{clientPhone}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#313f50]">
                <span className="text-[#6c7883]">Сумма:</span>
                <span className="text-blue-400 font-bold">{selectedService?.price} ₽</span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl"
            >
              {isSubmitting ? 'Запись...' : '✅ Подтвердить запись'}
            </button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-white text-2xl font-bold mb-4">Запись подтверждена!</h2>
            <p className="text-[#6c7883] mb-8">
              Ждём вас в BLADE & STYLE!
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-4 rounded-xl"
            >
              На главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
