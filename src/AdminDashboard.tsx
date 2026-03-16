import { useState } from 'react';
import { masters } from './data';

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: string;
  time: string;
  status: 'pending' | 'completed' | 'canceled';
  price: number;
}

const mockAppointments: Appointment[] = [
  { id: '1', clientName: 'Иван', clientPhone: '+7 (999) 123-45-67', service: 'Мужская стрижка', time: '10:00', status: 'completed', price: 1500 },
  { id: '2', clientName: 'Антон', clientPhone: '+7 (900) 000-00-00', service: 'Стрижка + Борода', time: '12:30', status: 'pending', price: 2200 },
  { id: '3', clientName: 'Сергей', clientPhone: '+7 (911) 222-33-44', service: 'Моделирование бороды', time: '14:00', status: 'canceled', price: 1000 },
  { id: '4', clientName: 'Максим', clientPhone: '+7 (988) 111-22-33', service: 'Окрашивание', time: '15:30', status: 'pending', price: 4000 },
];

export function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedMasterId, setSelectedMasterId] = useState<string>(masters[0].id);

  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    setAppointments(appointments.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
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

  const selectedMaster = masters.find(m => m.id === selectedMasterId);

  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="w-full max-w-4xl h-full flex flex-col bg-[#17212b] rounded-2xl overflow-hidden shadow-2xl border border-[#242f3d] m-4 animate-fade-in-up text-white">
      
      {/* Header */}
      <div className="bg-[#1c2733] p-6 border-b border-[#242f3d] flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold mb-1">Рабочий стол мастера</h1>
          <p className="text-[#6c7883] text-sm">Управление записями на сегодня</p>
        </div>
        
        <div className="flex gap-2 bg-[#242f3d] p-1 rounded-xl">
          {masters.map(master => (
            <button
              key={master.id}
              onClick={() => setSelectedMasterId(master.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedMasterId === master.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-[#8b9bb4] hover:bg-[#34465d]'
              }`}
            >
              <span>{master.avatar}</span>
              <span className="hidden md:inline">{master.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#242f3d transparent' }}>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#242f3d] rounded-xl p-4 flex flex-col justify-center">
            <div className="text-[#6c7883] text-sm mb-1">Всего записей</div>
            <div className="text-3xl font-bold">{appointments.length}</div>
          </div>
          <div className="bg-[#242f3d] rounded-xl p-4 flex flex-col justify-center">
            <div className="text-[#6c7883] text-sm mb-1">Завершено</div>
            <div className="text-3xl font-bold text-green-400">
              {appointments.filter(a => a.status === 'completed').length}
            </div>
          </div>
          <div className="bg-[#242f3d] rounded-xl p-4 flex flex-col justify-center">
            <div className="text-[#6c7883] text-sm mb-1">Выручка за сегодня</div>
            <div className="text-3xl font-bold text-blue-400">{totalRevenue} ₽</div>
          </div>
        </div>

        {/* Schedule */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📅 Расписание: {selectedMaster?.name}
        </h2>
        
        <div className="space-y-3">
          {appointments.sort((a, b) => a.time.localeCompare(b.time)).map((app) => (
            <div key={app.id} className="bg-[#242f3d] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
              
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="bg-[#1c2733] text-blue-400 font-bold text-lg w-16 h-16 rounded-xl flex items-center justify-center border border-[#313f50] shrink-0">
                  {app.time}
                </div>
                <div>
                  <div className="font-bold text-lg mb-1">{app.clientName}</div>
                  <div className="text-[#8b9bb4] text-sm flex items-center gap-1">
                    📞 {app.clientPhone}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="bg-[#1c2733] py-2 px-4 rounded-lg inline-block text-sm border border-[#313f50]">
                  ✂️ {app.service} <span className="text-blue-300 ml-2 font-medium">{app.price} ₽</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end shrink-0 w-full md:w-auto">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold w-max ${getStatusColor(app.status)}`}>
                  {getStatusText(app.status)}
                </div>
                
                {app.status === 'pending' && (
                  <div className="flex gap-2 mt-2 w-full md:w-auto">
                    <button
                      onClick={() => handleStatusChange(app.id, 'completed')}
                      className="flex-1 md:flex-none bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-green-600/30"
                    >
                      ✅ Завершить
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, 'canceled')}
                      className="flex-1 md:flex-none bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-600/30"
                    >
                      ❌ Отменить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
