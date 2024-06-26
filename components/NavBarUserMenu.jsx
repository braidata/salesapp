import React, { useEffect, useState, useRef } from 'react';
import { useSelectedUser } from '../context/SelectUserContext';
import { useSession, signOut } from 'next-auth/react';
import LoginButton from "../components/loginButton";

const UserSelector = ({ loggedInUserEmail }) => {
  const { data: session } = useSession();
  const { selectedUser, setSelectedUser, teamUsers, setTeamUsers } = useSelectedUser();
  const [showSelector, setShowSelector] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchTeamUsers = async () => {
      try {
        const response = await fetch('/api/mysqlTeams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: loggedInUserEmail }),
        });

        if (response.ok) {
          const data = await response.json();
          setTeamUsers(data.users);
        } else {
          console.error('Error fetching team users. Status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching team users:', error);
      }
    };

    fetchTeamUsers();
  }, [loggedInUserEmail, setTeamUsers]);

  const handleUserChange = (event) => {
    const selectedUserEmail = event.target.value;
    setSelectedUser(selectedUserEmail);
  };

  const toggleSelector = () => {
    setShowSelector(!showSelector);
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowSelector(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex gap-4 items-center space-x-4">
      <div
        className="flex items-center justify-center w-full bg-gradient-to-br from-lime-200 to-teal-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-teal-900 rounded-full shadow-md cursor-pointer"
        onClick={toggleSelector}
      >
        <LoginButton/>
      </div>
      {showSelector && (
        <div ref={dropdownRef} className="absolute right-0 mt-56 w-60 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto rounded-md shadow-lg py-2 z-50">
          <div className="px-4 py-2 text-lg font-semibold text-gray-800 dark:text-white">
            {session?.user?.name}
          </div>
          <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
            {session?.user?.email}
          </div>
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <label htmlFor="user-select" className="text-sm text-gray-800 dark:text-gray-200">Cambiar usuario:</label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={handleUserChange}
              className="mt-1 w-full p-2 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              <option value="">Selecciona un usuario</option>
              {teamUsers?.map((user) => (
                <option key={user.email} value={user.email}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="px-4 py-2 mt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full text-left text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
