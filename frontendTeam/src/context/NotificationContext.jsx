import { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg) => {
    setNotifications((prev) => [msg, ...prev.slice(0, 9)]); // 최대 10개 유지
  };

  const clearNotifications = () => {
    setNotifications([]); // ✅ 읽음 처리: 실시간 알림 초기화
  };
  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

