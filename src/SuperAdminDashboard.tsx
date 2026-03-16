import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from './useTelegram';

interface Booking {
  id: number;
  client_name: string;
  client_phone: string;
  service: string;
  service_price: number;
  master: string;
  master_id: string;
  date: string;
  time: string;
  status: string;
  is_cancelled: boolean;
  created_at: string;
}

interface Master {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  telegram_chat_id?: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  emoji: string;
}

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { getUserId, close } = useTelegram();
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'masters' | 'services'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const API_URL = (import.meta as any).env?.VITE_API_URL || window.location.origin;

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bookings') {
        const r = await fetch(`${API_URL}/api/admin-bookings`);
        const data = await r.json();
        setBookings(data.bookings || []);
      } else if (activeTab === 'masters') {
        const r = await fetch(`${API_URL}/api/masters`);
        const data = await r.json();
        setMasters(data.masters || []);
      } else if (activeTab === 'services') {
        // Загружаем из data.ts заглушку
        const { services } = await import('./data');
        setServices(services);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
    setLoading(false);
  };

  // Обновление записи
  const handleUpdateBooking = async (id: number, updates: any) => {
    try {
      const response = await fetch(`${API_URL}/api/admin-bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      
      if (response.ok) {
        loadData();
        setShowEditModal(false);
      }
    } catch (error) {
      alert('Ошибка обновления');
    }
  };

  // Удаление записи
  const handleDeleteBooking = async (id: number) => {
    if (!confirm('Удалить запись?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin-bookings?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  // Обновление мастера
  const handleUpdateMaster = async (id: string, updates: any) => {
    try {
      const response = await fetch(`${API_URL}/api/admin-masters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      
      if (response.ok) {
        loadData();
        setShowEditModal(false);
      }
    } catch (error) {
      alert('Ошибка обновления');
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

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.service_price || 0), 0);

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
            <h1 className="text-xl font-bold text-white">Панель суперадмина</h1>
            <p className="text-[#6c7883] text-sm">Полный доступ ко всем данным</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1c2733] border-b border-[#242f3d]">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'bookings' ? 'text-white border-b-2 border-blue-500' : 'text-[#6c7883]'
          }`}
        >
          📋 Записи
        </button>
        <button
          onClick={() => setActiveTab('masters')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'masters' ? 'text-white border-b-2 border-blue-500' : 'text-[#6c7883]'
          }`}
        >
          👨‍🎨 Мастера
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-3 font-medium transition-colors ${
            activeTab === 'services' ? 'text-white border-b-2 border-blue-500' : 'text-[#6c7883]'
          }`}
        >
          ✂️ Услуги
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#242f3d] rounded-xl p-3 text-center">
            <div className="text-[#6c7883] text-xs mb-1">Всего записей</div>
            <div className="text-2xl font-bold text-white">{bookings.length}</div>
          </div>
          <div className="bg-[#242f3d] rounded-xl p-3 text-center">
            <div className="text-[#6c7883] text-xs mb-1">Выручка</div>
            <div className="text-2xl font-bold text-blue-400">{totalRevenue} ₽</div>
          </div>
          <div className="bg-[#242f3d] rounded-xl p-3 text-center">
            <div className="text-[#6c7883] text-xs mb-1">Мастеров</div>
            <div className="text-2xl font-bold text-green-400">{masters.length}</div>
          </div>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center text-[#6c7883] py-12">Записей нет</div>
            ) : (
              bookings.map(booking => (
                <div key={booking.id} className="bg-[#242f3d] rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-white">{booking.client_name}</div>
                      <div className="text-sm text-[#8b9bb4]">{booking.client_phone}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="text-[#6c7883]">Услуга: <span className="text-white">{booking.service}</span></div>
                    <div className="text-[#6c7883]">Мастер: <span className="text-white">{booking.master}</span></div>
                    <div className="text-[#6c7883]">Дата: <span className="text-white">{booking.date}</span></div>
                    <div className="text-[#6c7883]">Время: <span className="text-white">{booking.time}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingItem(booking); setShowEditModal(true); }}
                      className="flex-1 bg-blue-600/20 text-blue-400 py-2 rounded-lg text-sm"
                    >
                      ✏️ Редактировать
                    </button>
                    {booking.status !== 'canceled' && (
                      <button
                        onClick={() => handleUpdateBooking(booking.id, { status: 'canceled', is_cancelled: true })}
                        className="flex-1 bg-red-600/20 text-red-400 py-2 rounded-lg text-sm"
                      >
                        ❌ Отменить
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="px-3 bg-red-600/30 text-red-400 py-2 rounded-lg text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Masters Tab */}
        {activeTab === 'masters' && (
          <div className="space-y-3">
            {masters.map(master => (
              <div key={master.id} className="bg-[#242f3d] rounded-xl p-4 flex items-center gap-4">
                <div className="text-4xl">{master.avatar}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{master.name}</div>
                  <div className="text-sm text-[#8b9bb4]">{master.specialty}</div>
                </div>
                <button
                  onClick={() => { setEditingItem(master); setShowEditModal(true); }}
                  className="bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg text-sm"
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            {services.map(service => (
              <div key={service.id} className="bg-[#242f3d] rounded-xl p-4 flex items-center gap-4">
                <div className="text-3xl">{service.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{service.name}</div>
                  <div className="text-sm text-[#8b9bb4]">{service.price} ₽ • {service.duration} мин</div>
                </div>
                <button
                  onClick={() => { setEditingItem(service); setShowEditModal(true); }}
                  className="bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg text-sm"
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1c2733] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Редактирование</h3>
            
            {activeTab === 'bookings' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[#6c7883] text-sm">Статус</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  >
                    <option value="pending">Ожидается</option>
                    <option value="confirmed">Подтверждено</option>
                    <option value="completed">Выполнено</option>
                    <option value="canceled">Отменено</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (activeTab === 'bookings') handleUpdateBooking(editingItem.id, editingItem);
                  setShowEditModal(false);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-[#242f3d] text-white py-2 rounded-lg"
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
