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
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [newMaster, setNewMaster] = useState({ name: '', avatar: '👨‍🎨', specialty: 'Барбер', rating: 5.0, telegram_chat_id: '' });
  const [editFormData, setEditFormData] = useState<any>({});

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

  // Открытие редактирования записи
  const handleOpenEditBooking = (booking: Booking) => {
    setEditingItem(booking);
    setEditFormData({ ...booking });
    setShowEditModal(true);
  };

  // Открытие редактирования мастера
  const handleOpenEditMaster = (master: Master) => {
    setEditingItem(master);
    setEditFormData({ ...master, telegram_chat_id: master.telegram_chat_id?.toString() || '' });
    setShowEditModal(true);
  };

  // Открытие редактирования услуги
  const handleOpenEditService = (service: Service) => {
    setEditingItem(service);
    setEditFormData({ ...service });
    setShowEditModal(true);
  };

  // Сохранение редактирования
  const handleSaveEdit = () => {
    if (activeTab === 'bookings') {
      handleUpdateBooking(editFormData.id, editFormData);
    } else if (activeTab === 'masters') {
      handleUpdateMaster(editFormData.id, {
        ...editFormData,
        telegram_chat_id: editFormData.telegram_chat_id ? parseInt(editFormData.telegram_chat_id) : null,
        rating: parseFloat(editFormData.rating) || 5.0,
      });
    } else if (activeTab === 'services') {
      handleUpdateService(editFormData.id, {
        ...editFormData,
        price: parseInt(editFormData.price) || 0,
        duration: parseInt(editFormData.duration) || 30,
      });
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

  // Обновление услуги
  const handleUpdateService = async (id: string, updates: any) => {
    // Для услуг пока заглушка - в реальном проекте нужен API endpoint
    alert('Редактирование услуг будет доступно в следующей версии');
    setShowEditModal(false);
  };

  // Удаление услуги
  const handleDeleteService = async (id: string) => {
    if (!confirm('Удалить услугу?')) return;
    alert('Удаление услуг будет доступно в следующей версии');
  };

  // Добавление мастера
  const handleAddMaster = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin-masters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMaster,
          id: 'm' + Date.now(),
          telegram_chat_id: newMaster.telegram_chat_id ? parseInt(newMaster.telegram_chat_id) : null,
        }),
      });
      
      if (response.ok) {
        loadData();
        setShowAddMasterModal(false);
        setNewMaster({ name: '', avatar: '👨‍🎨', specialty: 'Барбер', rating: 5.0, telegram_chat_id: '' });
      } else {
        alert('Ошибка добавления');
      }
    } catch (error) {
      alert('Ошибка добавления');
    }
  };

  // Удаление мастера
  const handleDeleteMaster = async (id: string) => {
    if (!confirm('Удалить мастера?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin-masters?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadData();
      } else {
        alert('Ошибка удаления');
      }
    } catch (error) {
      alert('Ошибка удаления');
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
                      onClick={() => handleOpenEditBooking(booking)}
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
            <button
              onClick={() => setShowAddMasterModal(true)}
              className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">➕</span>
              Добавить мастера
            </button>
            
            {masters.map(master => (
              <div key={master.id} className="bg-[#242f3d] rounded-xl p-4 flex items-center gap-4">
                <div className="text-4xl">{master.avatar}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{master.name}</div>
                  <div className="text-sm text-[#8b9bb4]">{master.specialty}</div>
                  {master.telegram_chat_id && (
                    <div className="text-xs text-blue-400 mt-1">TG ID: {master.telegram_chat_id}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditMaster(master)}
                    className="bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteMaster(master.id)}
                    className="bg-red-600/20 text-red-400 px-3 py-2 rounded-lg text-sm"
                  >
                    🗑️
                  </button>
                </div>
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditService(service)}
                    className="bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="bg-red-600/20 text-red-400 px-3 py-2 rounded-lg text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1c2733] rounded-2xl p-6 max-w-md w-full border border-[#242f3d]">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              {activeTab === 'bookings' && '✏️ Редактирование записи'}
              {activeTab === 'masters' && '✏️ Редактирование мастера'}
              {activeTab === 'services' && '✏️ Редактирование услуги'}
            </h3>

            {/* Записи */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Клиент:</label>
                  <input
                    type="text"
                    value={editFormData.client_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Телефон:</label>
                  <input
                    type="text"
                    value={editFormData.client_phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, client_phone: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Дата:</label>
                  <input
                    type="date"
                    value={editFormData.date || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Время:</label>
                  <input
                    type="time"
                    value={editFormData.time || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Статус:</label>
                  <select
                    value={editFormData.status || 'pending'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
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

            {/* Мастера */}
            {activeTab === 'masters' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Имя:</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Аватар:</label>
                  <input
                    type="text"
                    value={editFormData.avatar || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, avatar: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Специальность:</label>
                  <input
                    type="text"
                    value={editFormData.specialty || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Рейтинг:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editFormData.rating || 5}
                    onChange={(e) => setEditFormData({ ...editFormData, rating: parseFloat(e.target.value) })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Telegram ID:</label>
                  <input
                    type="text"
                    value={editFormData.telegram_chat_id || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, telegram_chat_id: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Услуги */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Название:</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Цена (₽):</label>
                  <input
                    type="number"
                    value={editFormData.price || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, price: parseInt(e.target.value) })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Длительность (мин):</label>
                  <input
                    type="number"
                    value={editFormData.duration || 30}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6c7883] text-sm mb-2 block">Emoji:</label>
                  <input
                    type="text"
                    value={editFormData.emoji || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, emoji: e.target.value })}
                    className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                💾 Сохранить
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-3 rounded-xl transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Master Modal */}
      {showAddMasterModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1c2733] rounded-2xl p-6 max-w-sm w-full border border-[#242f3d]">
            <h2 className="text-xl font-bold text-white mb-4 text-center">➕ Добавить мастера</h2>
            
            <div className="mb-4">
              <label className="text-[#6c7883] text-sm mb-2 block">Имя:</label>
              <input
                type="text"
                value={newMaster.name}
                onChange={(e) => setNewMaster({ ...newMaster, name: e.target.value })}
                placeholder="Алексей"
                className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="text-[#6c7883] text-sm mb-2 block">Аватар:</label>
              <input
                type="text"
                value={newMaster.avatar}
                onChange={(e) => setNewMaster({ ...newMaster, avatar: e.target.value })}
                placeholder="👨‍🎨"
                className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="text-[#6c7883] text-sm mb-2 block">Специальность:</label>
              <input
                type="text"
                value={newMaster.specialty}
                onChange={(e) => setNewMaster({ ...newMaster, specialty: e.target.value })}
                placeholder="Топ-барбер"
                className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="text-[#6c7883] text-sm mb-2 block">Рейтинг:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={newMaster.rating}
                onChange={(e) => setNewMaster({ ...newMaster, rating: parseFloat(e.target.value) })}
                placeholder="5.0"
                className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="text-[#6c7883] text-sm mb-2 block">Telegram ID:</label>
              <input
                type="text"
                value={newMaster.telegram_chat_id}
                onChange={(e) => setNewMaster({ ...newMaster, telegram_chat_id: e.target.value })}
                placeholder="1362609452"
                className="w-full bg-[#242f3d] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-[#6c7883] mt-1">Оставьте пустым если не нужно</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddMaster}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                ➕ Добавить
              </button>
              <button
                onClick={() => setShowAddMasterModal(false)}
                className="flex-1 bg-[#242f3d] hover:bg-[#2b3848] text-white font-semibold py-3 rounded-xl transition-all"
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
