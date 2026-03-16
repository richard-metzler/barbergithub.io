import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatBot } from './ChatBot';
import { AdminDashboard } from './AdminDashboard';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0e1621] flex flex-col items-center">
        <div className="w-full h-screen overflow-hidden flex justify-center items-center">
          <Routes>
            {/* Клиентская часть (Бот) */}
            <Route path="/" element={<ChatBot />} />
            
            {/* Панель администратора / мастера скрыта по отдельному пути */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Редирект на главную для несуществующих путей */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
