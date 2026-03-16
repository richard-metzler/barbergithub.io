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

export function AdminDashboard() {
  const navigate = useNavigate();
  const { getUserId, close } = useTelegram();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterId, setMasterId] = useState<string>('');

  const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;

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
    </div>
  );
}
