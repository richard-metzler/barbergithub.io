import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './Home';
import { BookingForm } from './BookingForm';
import { AdminDashboard } from './AdminDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0e1621]">
        <Routes>
          {/* Главная - выбор роли */}
          <Route path="/" element={<Home />} />

          {/* Клиент - форма записи */}
          <Route path="/booking" element={<BookingForm />} />

          {/* Мастер - админ панель */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Суперадмин - полная панель */}
          <Route path="/superadmin" element={<SuperAdminDashboard />} />

          {/* Редирект на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
