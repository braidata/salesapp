import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '../context/NotificationContext';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';

const NotificationBell: React.FC = () => {
  const { data: session } = useSession();
  const { notifications, fetchNotifications, markAsRead, deleteNotification } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (session) {
      const fetchPermissionsAndNotifications = async () => {
        const permission = await checkPermissions(['payments', 'all']);
        if (permission) {
          const category = permission === 'payments' ? 'Nuevo Pago' : 'Nueva Validación';
          fetchNotifications(parseInt(session.token.sub), category);
        }
      };
      fetchPermissionsAndNotifications();
    }
  }, [session]);

  useEffect(() => {
    const socket = io({
      path: '/api/socketServer',
    });
    setSocket(socket);

    socket.on('newNotification', () => {
      const fetchPermissionsAndNotifications = async () => {
        const permission = await checkPermissions(['payments', 'all']);
        if (permission) {
          const category = permission === 'payments' ? 'Nuevo Pago' : 'Nueva Validación';
          fetchNotifications(parseInt(session.token.sub), category);
        }
      };
      fetchPermissionsAndNotifications();
    });

    return () => socket.disconnect();
  }, [fetchNotifications, session]);

  const unreadCount = notifications.filter((notif) => notif.status === 'unread').length;

  const handleMarkAsRead = async (id: number, content: string) => {
    await markAsRead(id);
    fetchNotifications(parseInt(session?.token.sub), 'all');

    const paymentIdMatch = content.match(/pago (\d+)/);
    const orderIdMatch = content.match(/pedido (\d+)/);
    const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (content.includes('analista')) {
      if (orderId) {
        router.push(`/dashboard?orderId=${orderId}`);
      } else {
        console.error("Order ID is undefined");
      }
    } else if (content.includes('usuario')) {
      if (paymentId && orderId) {
        router.push(`/pagos?paymentId=${paymentId}&orderId=${orderId}`);
      } else {
        console.error("Payment ID or Order ID is undefined");
      }
    }
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    fetchNotifications(parseInt(session?.token.sub), 'all');
  };

  const formatTime = (time: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(time).getTime()) / (1000 * 60));
    if (diff < 60) return `hace ${diff} minutos`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)} horas`;
    return `hace ${Math.floor(diff / 1440)} días`;
  };

  const handleClickOutside = (event) => {
    if (!dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkPermissions = async (requiredPermissions) => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session.session.user.email : null,
      }),
    });
    const data = await res.json();
    console.log("Los permisos son 2: ", data);

    if (data && data.user && data.user[0] && data.user[0].permissions) {
      const userPermissions = data.user[0].permissions.toLowerCase();
      console.log("Los permisos son 2b",userPermissions)
      if (requiredPermissions.some(permission => userPermissions.includes(permission))) {
        console.log("Los permisos son 2c",userPermissions)
        return userPermissions;
      }
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative focus:outline-none"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <svg
          className="w-8 h-8 text-gray-800 dark:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a7.003 7.003 0 00-4-6.326V4a2 2 0 10-4 0v.674A7.003 7.003 0 006 11v3.159c0 .379-.214.725-.595.943L4 17h11z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 21h-2a1 1 0 001 1h0a1 1 0 001-1z"
          ></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-50">
          <div className="px-4 py-2 text-lg font-semibold text-gray-800 dark:text-white">Notificaciones</div>
          {notifications.length === 0 ? (
            <div className="px-4 py-2 text-gray-700 dark:text-gray-300">No hay notificaciones</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer ${notif.status === 'read' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-600'} hover:bg-gray-300 dark:hover:bg-gray-500`}
              >
                <div className="flex justify-between items-center">
                  <div onClick={() => handleMarkAsRead(notif.id, notif.content)} className="flex-grow">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{notif.category}</div>
                    <div className="text-gray-500 text-xs dark:text-gray-400">{formatTime(notif.createdAt)}</div>
                    <div className="text-gray-700 dark:text-gray-300">{notif.content}</div>
                  </div>
                  <button onClick={() => handleDelete(notif.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;











