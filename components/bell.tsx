import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '../context/NotificationContext'; // Importamos el hook personalizado

const NotificationBell: React.FC = () => {
  const { data: session } = useSession();
  const { notifications, fetchNotifications, markAsRead } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchNotifications(session.token.sub);
    }
  }, [session]);

  const unreadCount = notifications.filter((notif) => notif.status === 'unread').length;

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    fetchNotifications(session?.token.sub);
  };

  // Filtra las notificaciones que están marcadas como "read"
  const visibleNotifications = notifications.filter((notif) => notif.status === 'unread');

  return (
    <div className="relative">
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
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-50">
          {visibleNotifications.length === 0 ? (
            <div className="px-4 py-2 text-gray-700 dark:text-gray-300">No hay notificaciones</div>
          ) : (
            visibleNotifications.map((notif) => (
              <div
                key={notif.id}
                className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer bg-gray-100 dark:bg-gray-700"
                onClick={() => handleMarkAsRead(notif.id)}
              >
                {notif.content}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;






