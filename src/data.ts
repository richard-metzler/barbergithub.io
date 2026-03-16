export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  emoji: string;
}

export interface Master {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
}

export const services: Service[] = [
  { id: 's1', name: 'Мужская стрижка', price: 1500, duration: 45, emoji: '💇‍♂️' },
  { id: 's2', name: 'Женская стрижка', price: 2500, duration: 60, emoji: '💇‍♀️' },
  { id: 's3', name: 'Детская стрижка', price: 1000, duration: 30, emoji: '👦' },
  { id: 's4', name: 'Стрижка + Борода', price: 2200, duration: 60, emoji: '🧔' },
  { id: 's5', name: 'Окрашивание', price: 4000, duration: 120, emoji: '🎨' },
  { id: 's6', name: 'Укладка', price: 1200, duration: 30, emoji: '✨' },
  { id: 's7', name: 'Моделирование бороды', price: 1000, duration: 30, emoji: '🪒' },
  { id: 's8', name: 'Камуфляж седины', price: 1800, duration: 45, emoji: '🖌️' },
];

export const masters: Master[] = [
  { id: 'm1', name: 'Алексей', avatar: '👨‍🎨', specialty: 'Топ-барбер', rating: 4.9 },
  { id: 'm2', name: 'Мария', avatar: '👩‍🎨', specialty: 'Стилист-колорист', rating: 4.8 },
  { id: 'm3', name: 'Дмитрий', avatar: '🧑‍🎨', specialty: 'Барбер', rating: 4.7 },
  { id: 'm4', name: 'Елена', avatar: '👩‍💼', specialty: 'Стилист', rating: 4.9 },
];

export const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];

export function getAvailableSlots(_masterId: string, _dateStr: string): string[] {
  // Simulate some slots being taken
  const seed = _masterId.charCodeAt(1) + _dateStr.charCodeAt(_dateStr.length - 1);
  return timeSlots.filter((_, i) => (i + seed) % 3 !== 0);
}

export function getNextDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatDate(date: Date): string {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatDateFull(date: Date): string {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
