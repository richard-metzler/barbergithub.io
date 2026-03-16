// Типы для Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  ready: () => void;
  close: () => void;
  expand: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    chat_instance?: string;
    chat_type?: string;
    start_param?: string;
  };
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  sendData: (data: string) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text?: string }> }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  platform: string;
  version: string;
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp;
  const isTelegram = !!tg;

  // Инициализация при запуске
  const init = () => {
    if (tg) {
      tg.ready();
      tg.expand(); // Развернуть на весь экран
    }
  };

  // Получить данные пользователя
  const getUser = () => {
    return tg?.initDataUnsafe?.user || null;
  };

  // Получить имя пользователя
  const getUserName = () => {
    const user = getUser();
    if (!user) return '';
    return user.first_name + (user.last_name ? ' ' + user.last_name : '');
  };

  // Получить ID пользователя (для отправки уведомлений)
  const getUserId = () => {
    return getUser()?.id || null;
  };

  // Закрыть Mini App
  const close = () => {
    if (tg) {
      tg.close();
    }
  };

  // Показать главную кнопку
  const showMainButton = (text: string, onClick: () => void) => {
    if (tg) {
      tg.MainButton.setText(text);
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
    }
  };

  // Скрыть главную кнопку
  const hideMainButton = () => {
    if (tg) {
      tg.MainButton.hide();
    }
  };

  // Вибрация (Haptic Feedback)
  const hapticFeedback = (type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy') => {
    if (tg?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    }
  };

  // Отправить данные боту
  const sendData = (data: object) => {
    if (tg) {
      tg.sendData(JSON.stringify(data));
    }
  };

  // Показать всплывающее окно
  const showAlert = (message: string) => {
    if (tg) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  };

  // Показать подтверждение
  const showConfirm = (message: string, callback: (confirmed: boolean) => void) => {
    if (tg) {
      tg.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      callback(result);
    }
  };

  // Тема (светлая/тёмная)
  const colorScheme = tg?.colorScheme || 'dark';

  return {
    tg,
    isTelegram,
    init,
    getUser,
    getUserName,
    getUserId,
    close,
    showMainButton,
    hideMainButton,
    hapticFeedback,
    sendData,
    showAlert,
    showConfirm,
    colorScheme,
  };
}
