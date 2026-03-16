import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from './useTelegram';

type UserRole = 'client' | 'master' | 'superadmin' | 'loading';

export function Home() {
  const navigate = useNavigate();
  const { init, getUserId, close, isTelegram, showMainButton, hideMainButton } = useTelegram();
  
  const [role, setRole] = useState<UserRole>('loading');
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const SUPERADMIN_ID = '1362609452';

  // Инициализация
  useEffect(() => {
    init();
  }, []);

  // Определение роли пользователя
  useEffect(() => {
    const userId = getUserId();
    console.log('Home.tsx: userId =', userId);
    console.log('Home.tsx: SUPERADMIN_ID =', SUPERADMIN_ID);
    
    if (!userId) {
      setRole('client');
      return;
    }

    const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;

    fetch(`${API_URL}/api/get-user-role?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        console.log('Home.tsx: API response =', data);
        setRole(data.role || 'client');

        // Для суперадмина НЕ показываем окно сразу - только по кнопке
        // if (data.role === 'superadmin') {
        //   setShowRoleSelect(true);
        // }

        // Для мастеров - показываем кнопку панели
        if (data.role === 'master') {
          showMainButton('📊 Панель мастера', () => {
            navigate('/admin');
          });
        }
      })
      .catch((err) => {
        console.error('Home.tsx: Error fetching role:', err);
        setRole('client');
      });
  }, [getUserId]);

  // Обработка кнопки "Начать"
  const handleStart = () => {
    if (role === 'master') {
      navigate('/admin');
    } else if (role === 'superadmin') {
      // Суперадмин выбирает роль
      setShowRoleSelect(true);
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

      {/* Modal выбора роли для суперадмина */}
      {showRoleSelect && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-[#1c2733] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm border-b sm:border border-[#242f3d] mb-safe">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Выберите режим</h2>
            <p className="text-[#6c7883] text-sm mb-6 text-center">Как вы хотите войти?</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowRoleSelect(false);
                  navigate('/admin');
                }}
                className="w-full bg-[#2b5278] hover:bg-[#326292] text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👨‍🎨</span>
                <div className="text-left">
                  <div className="font-bold">Мастер</div>
                  <div className="text-xs text-blue-200">Панель мастера</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowRoleSelect(false);
                  navigate('/superadmin');
                }}
                className="w-full bg-[#2b5278] hover:bg-[#326292] text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👑</span>
                <div className="text-left">
                  <div className="font-bold">Суперадмин</div>
                  <div className="text-xs text-blue-200">Полный доступ</div>
                </div>
              </button>

              <button
                onClick={() => setShowRoleSelect(false)}
                className="w-full bg-[#242f3d] hover:bg-[#2b3848] text-[#6c7883] font-semibold py-4 rounded-xl transition-all mt-4"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
