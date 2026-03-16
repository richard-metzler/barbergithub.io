import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from './useTelegram';

interface Appointment {
  id: number;
  client_name: string;
  client_phone: string;
  service: string;
  service_price: number;
  master: string;
  master_id: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'canceled';
  is_cancelled: boolean;
  want_notification: boolean;
  reminder_sent: boolean;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { getUserId, close } = useTelegram();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterId, setMasterId] = useState<string>('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  
  // Расписание (блокировка времени)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<'date' | 'time' | 'details'>('date');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([]);
  const [scheduleReason, setScheduleReason] = useState('');
  const [scheduleClient, setScheduleClient] = useState({ name: '', phone: '' });

  const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;

  // Получение следующих 14 дней
  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatDateFull = (date: Date) => {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Обработка выбора даты для блокировки
  const handleScheduleDateSelect = (date: Date) => {
    setScheduleDate(date.toISOString().slice(0, 10));
    setScheduleStep('time');
  };

  // Обработка выбора времени для блокировки
  const handleScheduleTimeToggle = (time: string) => {
    console.log('Time toggle:', time);
    setScheduleTimes(prev => {
      const newTimes = prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time];
      console.log('New scheduleTimes:', newTimes);
      return newTimes;
    });
  };

  // Получаем данные мастера
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    fetch(`${API_URL}/api/get-user-role?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.masterId) {
          setMasterId(data.masterId);
          // Загружаем записи этого мастера
          fetch(`${API_URL}/api/get-bookings?master_id=${data.masterId}`)
            .then(r => r.json())
            .then(data => {
              setAppointments(data.bookings || []);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusChange = (id: number, newStatus: Appointment['status']) => {
    fetch(`${API_URL}/api/update-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    })
      .then(r => r.json())
      .then(() => {
        setAppointments(appointments.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        ));
      })
      .catch(err => console.error('Failed to update:', err));
  };

  const handleEditAppointment = (app: Appointment) => {
    setEditingAppointment(app);
    setEditDate(app.date);
    setEditTime(app.time);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAppointment) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin-bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAppointment.id,
          date: editDate,
          time: editTime
        }),
      });
      
      if (response.ok) {
        setAppointments(appointments.map(app =>
          app.id === editingAppointment.id 
            ? { ...app, date: editDate, time: editTime }
            : app
        ));
        setShowEditModal(false);
      } else {
        alert('Ошибка обновления');
      }
    } catch (error) {
      alert('Ошибка обновления');
    }
  };

  // Блокировка времени в расписании
  const handleBlockTime = async () => {
    console.log('handleBlockTime called');
    console.log('masterId:', masterId);
    console.log('scheduleDate:', scheduleDate);
    console.log('scheduleTimes:', scheduleTimes);
    
    if (!masterId || !scheduleDate || scheduleTimes.length === 0) {
      const errorMsg = `Ошибка проверки:\nmasterId: ${masterId || 'пустой'}\nscheduleDate: ${scheduleDate || 'пустой'}\nscheduleTimes: ${scheduleTimes.length} элементов`;
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    const userId = getUserId();

    try {
      // Блокируем каждое выбранное время
      const results = [];
      for (const time of scheduleTimes) {
        const response = await fetch(`${API_URL}/api/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            master_id: masterId,
            date: scheduleDate,
            time,
            reason: scheduleReason || 'Запись по телефону',
            client_name: scheduleClient.name || 'Запись по телефону',
            client_phone: scheduleClient.phone || '',
            created_by: userId,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error('Schedule API error:', result);
          throw new Error(result.error || 'Ошибка при блокировке');
        }
        
        results.push(result);
      }

      alert(`✅ Заблокировано время: ${scheduleTimes.join(', ')}`);
      setShowScheduleModal(false);
      setScheduleStep('date');
      setScheduleDate('');
      setScheduleTimes([]);
      setScheduleReason('');
      setScheduleClient({ name: '', phone: '' });
      loadData();
    } catch (error: any) {
      console.error('Block time error:', error);
      alert('❌ Ошибка блокировки: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'canceled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'canceled': return 'Отменено';
      default: return 'Ожидается';
    }
  };

  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.service_price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1621] flex items-center justify-center">
        <div className="text-white text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col">
      {/* Header */}
      <div className="bg-[#1c2733] px-4 py-4 border-b border-[#242f3d]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-[#6c7883] hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Панель мастера</h1>
            <p className="text-[#6c7883] text-sm">Ваши записи на сегодня</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#242f3d] rounded-xl p-3 text-center">
            <div className="text-[#6c7883] text-xs mb-1">Всего</div>
            <div className="text-2xl font-bold text-white">{appointments.length}</div>
          </div>
          <div className="bg-[#242f3d] rounded-xl p-3 text-center">
            <div className="text-[#6c7883] text-xs mb-1">Выполнено</div>
            <div className="text-2xl font-bold text-green-400">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
          </div>
          <div className="bg-[#242f3d] rounded-xl p-3 text-center">
            <div className="text-[#6c7883] text-xs mb-1">Выручка</div>
            <div className="text-2xl font-bold text-blue-400">{totalRevenue} ₽</div>
          </div>
        </div>

        {/* Блокировка времени */}
        <button
          onClick={() => setShowScheduleModal(true)}
          className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 py-3 rounded-xl font-semibold transition-all mb-4 flex items-center justify-center gap-2"
        >
          <span className="text-xl">🚫</span>
          Заблокировать время (запись по телефону)
        </button>

        {/* Schedule */}
        <h2 className="text-white font-bold mb-3">📅 Расписание</h2>

        {appointments.length === 0 ? (
          <div className="text-center text-[#6c7883] py-12">
            <div className="text-4xl mb-2">📭</div>
            <div>Записей пока нет</div>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments
              .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.time.localeCompare(b.time);
              })
              .map((app) => (
              <div key={app.id} className="bg-[#242f3d] rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-white text-lg">{app.client_name}</div>
                    <div className="text-sm text-[#8b9bb4]">📞 {app.client_phone}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(app.status)}`}>
                    {getStatusText(app.status)}
                  </span>
                </div>
                
                <div className="bg-[#1c2733] rounded-lg p-3 mb-3">
                  <div className="text-sm text-white">✂️ {app.service} — {app.service_price} ₽</div>
                  <div className="text-sm text-[#8b9bb4] mt-1">
                    📅 {app.date} в {app.time}
                  </div>
                </div>

                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => handleEditAppointment(app)}
                    className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 py-2 rounded-lg text-sm transition-colors"
                  >
                    ✏️ Изменить
                  </button>
                </div>

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(app.id, 'completed')}
                      className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 py-2 rounded-lg text-sm transition-colors"
                    >
                      ✅ Завершить
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, 'canceled')}
                      className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 py-2 rounded-lg text-sm transition-colors"
                    >
                      ❌ Отменить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-[#1c2733] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm border-b sm:border border-[#242f3d] mb-safe">
            <h2 className="text-xl font-bold text-white mb-4 text-center">✏️ Редактировать запись</h2>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#242f3d transparent' }}>
              <div className="mb-4">
                <div className="text-[#6c7883] text-sm mb-2">Клиент:</div>
                <div className="text-white font-semibold">{editingAppointment.client_name}</div>
              </div>

              <div className="mb-4">
                <div className="text-[#6c7883] text-sm mb-2">Услуга:</div>
                <div className="text-white">{editingAppointment.service}</div>
              </div>

              <div>
                <label className="text-[#6c7883] text-sm mb-2 block">Дата:</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#242f3d] text-white px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[#6c7883] text-sm mb-2 block">Время:</label>
                <select
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full bg-[#242f3d] text-white px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 sticky bottom-0 pt-4 bg-[#1c2733] border-t border-[#242f3d]">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all"
              >
                💾 Сохранить
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-4 rounded-xl transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Block Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-[#1c2733] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md border-b sm:border border-[#242f3d] mb-safe max-h-[90vh] overflow-y-auto">
            {/* Шаг 1: Выбор даты */}
            {scheduleStep === 'date' && (
              <>
                <h2 className="text-xl font-bold text-white mb-2 text-center">📅 Выберите дату</h2>
                <p className="text-[#6c7883] text-sm mb-6 text-center">Для блокировки времени</p>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {getNextDays(14).map(date => {
                    const isSelected = scheduleDate === date.toISOString().slice(0, 10);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleScheduleDateSelect(date)}
                        className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                            : 'bg-[#2b5278] hover:bg-[#326292] text-white'
                        }`}
                      >
                        <span className="text-xs uppercase">{['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][date.getDay()]}</span>
                        <span className="font-bold text-lg">{date.getDate()}</span>
                        <span className="text-xs">{['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'][date.getMonth()]}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 sticky bottom-0 pt-4 bg-[#1c2733] border-t border-[#242f3d]">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-4 rounded-xl transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}

            {/* Шаг 2: Выбор времени */}
            {scheduleStep === 'time' && (
              <>
                <h2 className="text-xl font-bold text-white mb-2 text-center">🕐 Выберите время</h2>
                <p className="text-[#6c7883] text-sm mb-6 text-center">
                  {scheduleDate ? formatDateFull(new Date(scheduleDate)) : ''}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {timeSlots.map(time => {
                    const isSelected = scheduleTimes.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => handleScheduleTimeToggle(time)}
                        className={`py-3 px-2 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                            : 'bg-[#2b5278] hover:bg-[#326292] text-white'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 sticky bottom-0 pt-4 bg-[#1c2733] border-t border-[#242f3d]">
                  <button
                    onClick={() => setScheduleStep('date')}
                    className="flex-1 bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-4 rounded-xl transition-all"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={() => setScheduleStep('details')}
                    disabled={scheduleTimes.length === 0}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all"
                  >
                    Далее ({scheduleTimes.length})
                  </button>
                </div>
              </>
            )}

            {/* Шаг 3: Детали блокировки */}
            {scheduleStep === 'details' && (
              <>
                <h2 className="text-xl font-bold text-white mb-2 text-center">📝 Детали блокировки</h2>
                <p className="text-[#6c7883] text-sm mb-6 text-center">
                  Заблокировано: {scheduleTimes.length} слот(ов)
                </p>

                <div className="space-y-4 mb-4">
                  <div className="bg-[#242f3d] rounded-xl p-4">
                    <div className="text-[#6c7883] text-sm mb-2">Дата:</div>
                    <div className="text-white font-semibold">{scheduleDate ? formatDateFull(new Date(scheduleDate)) : ''}</div>
                  </div>

                  <div className="bg-[#242f3d] rounded-xl p-4">
                    <div className="text-[#6c7883] text-sm mb-2">Время:</div>
                    <div className="text-white font-semibold flex flex-wrap gap-2">
                      {scheduleTimes.map(time => (
                        <span key={time} className="bg-orange-600/20 text-orange-400 px-2 py-1 rounded-lg text-sm">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[#6c7883] text-sm mb-2 block">Причина:</label>
                    <input
                      type="text"
                      value={scheduleReason}
                      onChange={(e) => setScheduleReason(e.target.value)}
                      placeholder="Запись по телефону"
                      className="w-full bg-[#242f3d] text-white px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[#6c7883] text-sm mb-2 block">Имя клиента:</label>
                    <input
                      type="text"
                      value={scheduleClient.name}
                      onChange={(e) => setScheduleClient({ ...scheduleClient, name: e.target.value })}
                      placeholder="Иван"
                      className="w-full bg-[#242f3d] text-white px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[#6c7883] text-sm mb-2 block">Телефон:</label>
                    <input
                      type="tel"
                      value={scheduleClient.phone}
                      onChange={(e) => setScheduleClient({ ...scheduleClient, phone: e.target.value })}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full bg-[#242f3d] text-white px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 sticky bottom-0 pt-4 bg-[#1c2733] border-t border-[#242f3d]">
                  <button
                    onClick={() => setScheduleStep('time')}
                    className="flex-1 bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-4 rounded-xl transition-all"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={handleBlockTime}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-xl transition-all"
                  >
                    🚫 Заблокировать
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
