import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define el tipo para las notificaciones
interface Notification {
  id: number;
  userId: number;
  content: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: (userId: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
}

// Define el contexto y el proveedor
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Función para obtener las notificaciones desde la base de datos
  const fetchNotifications = async (userId: number) => {
    try {
      const response = await fetch(`/api/mysqlNotifications?userId=${userId}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error al obtener las notificaciones:', error);
    }
  };

  // Función para agregar una nueva notificación
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  // Función para marcar una notificación como leída
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/markNotificationAsRead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== id)
      );
    } catch (error) {
      console.error('Error al marcar la notificación como leída:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, fetchNotifications, addNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};


