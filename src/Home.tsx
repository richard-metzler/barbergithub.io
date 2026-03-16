import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from './useTelegram';

type UserRole = 'client' | 'master' | 'superadmin' | 'loading';

export function ChatBot() {
  const navigate = useNavigate();
  const { init, getUserId, close, isTelegram, showMainButton, hideMainButton } = useTelegram();
  
  const [role, setRole] = useState<UserRole>('loading');
  const [lastBooking, setLastBooking] = useState<any>(null);

  // Инициализация
  useEffect(() => {
    init();
  }, []);

  // Определение роли пользователя
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setRole('client');
      return;
    }

    const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;
    
    fetch(`${API_URL}/api/get-user-role?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        setRole(data.role || 'client');
        
        // Для суперадмина и мастеров - показываем кнопку панели
        if (data.role === 'superadmin' || data.role === 'master') {
          showMainButton('📊 Панель управления', () => {
            if (data.role === 'superadmin') {
              navigate('/superadmin');
            } else {
              navigate('/admin');
            }
          });
        }
      })
      .catch(() => {
        setRole('client');
      });
  }, [getUserId]);

  // Обработка кнопки "Начать"
  const handleStart = () => {
    if (role === 'master') {
      navigate('/admin');
    } else if (role === 'superadmin') {
      navigate('/superadmin');
    } else {
      // Клиент - начинаем запись
      navigate('/booking');
    }
  };

  // Загрузка последней записи
  useEffect(() => {
    const userId = getUserId();
    if (!userId || role !== 'client') return;

    const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;
    
    fetch(`${API_URL}/api/get-bookings`)
      .then(r => r.json())
      .then(data => {
        const bookings = data.bookings || [];
        const lastActive = bookings
          .filter((b: any) => !b.is_cancelled && b.status !== 'canceled')
          .sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
        
        if (lastActive) {
          setLastBooking(lastActive);
        }
      })
      .catch(() => {});
  }, [role]);

  // Отмена записи
  const handleCancelBooking = async () => {
    if (!lastBooking) return;

    const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;
    const userId = getUserId();
    
    try {
      const response = await fetch(`${API_URL}/api/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: lastBooking.id,
          userId
        })
      });
      
      if (response.ok) {
        setLastBooking(null);
        alert('Запись отменена');
      } else {
        alert('Ошибка при отмене');
      }
    } catch (error) {
      alert('Ошибка при отмене');
    }
  };

  if (role === 'loading') {
    return (
      <div className="min-h-screen bg-[#0e1621] flex items-center justify-center">
        <div className="text-white text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#17212b] rounded-2xl p-8 shadow-2xl border border-[#242f3d]">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✂️</div>
          <h1 className="text-2xl font-bold text-white mb-2">BLADE & STYLE</h1>
          <p className="text-[#6c7883]">Барбершоп нового поколения</p>
        </div>

        {/* Информация о пользователе */}
        <div className="bg-[#242f3d] rounded-xl p-4 mb-6">
          <div className="text-[#6c7883] text-sm mb-1">Ваша роль:</div>
          <div className="text-white font-semibold text-lg">
            {role === 'client' && '👤 Клиент'}
            {role === 'master' && '👨‍🎨 Мастер'}
            {role === 'superadmin' && '👑 Суперадмин'}
          </div>
        </div>

        {/* Последняя запись для клиента */}
        {role === 'client' && lastBooking && (
          <div className="bg-[#242f3d] rounded-xl p-4 mb-6">
            <div className="text-white font-semibold mb-3">Ваша запись:</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Услуга:</span>
                <span className="text-white">{lastBooking.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Мастер:</span>
                <span className="text-white">{lastBooking.master}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Дата:</span>
                <span className="text-white">{lastBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Время:</span>
                <span className="text-white">{lastBooking.time}</span>
              </div>
            </div>
            <button
              onClick={handleCancelBooking}
              className="w-full mt-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold py-3 rounded-xl transition-all"
            >
              ❌ Отменить запись
            </button>
          </div>
        )}

        {/* Кнопка "Начать" */}
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xl py-4 rounded-xl transition-all shadow-lg active:scale-95 mb-4"
        >
          {role === 'client' && '📅 Записаться на стрижку'}
          {role === 'master' && '📊 Панель мастера'}
          {role === 'superadmin' && '⚙️ Панель управления'}
        </button>

        {/* Подсказка */}
        <div className="text-center text-[#6c7883] text-sm mt-4">
          {role === 'client' && 'Запишитесь на стрижку в пару кликов'}
          {role === 'master' && 'Управляйте своими записями'}
          {role === 'superadmin' && 'Полный доступ ко всем функциям'}
        </div>
      </div>
    </div>
  );
}
