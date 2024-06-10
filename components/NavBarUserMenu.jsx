import React, { useEffect, useState } from 'react';
import { useSelectedUser } from '../context/SelectUserContext';
import LoginButton from "../components/loginButton";

const UserSelector = ({ loggedInUserEmail }) => {
  const { selectedUser, setSelectedUser, teamUsers, setTeamUsers } = useSelectedUser();
  const [showSelector, setShowSelector] = useState(false);

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

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-gradient-to-br from-lime-200 to-teal-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-teal-900 p-2 rounded-full shadow-md" onClick={toggleSelector}>
        <LoginButton />
        <p className="px-2 py-1">{selectedUser}</p>
      </div>
      {showSelector && (
        <div className="flex items-center space-x-2 bg-gradient-to-br from-lime-200 to-teal-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-teal-900 p-2 rounded-md shadow-md">
          <label htmlFor="user-select" className="text-sm">Usuario:</label>
          <select
            id="user-select"
            value={selectedUser}
            onChange={handleUserChange}
            className="p-1 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">Ver opciones</option>
            {teamUsers?.map((user) => (
              <option key={user.email} value={user.email}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
