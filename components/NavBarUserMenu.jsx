import React, { useEffect } from 'react';
import { useSelectedUser } from '../context/SelectUserContext';


const UserSelector = ({ loggedInUserEmail }) => {
  const { selectedUser, setSelectedUser, teamUsers, setTeamUsers } = useSelectedUser();

  useEffect(() => {
    const fetchTeamUsers = async () => {
      console.log('Fetching team users...');
      try {
        const response = await fetch('/api/mysqlTeams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: loggedInUserEmail }),
        });

        console.log('Response:', response);

        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);

          const fetchedTeamUsers = data.users;
          console.log('Fetched team users:', fetchedTeamUsers);

          // Actualizar el estado de los usuarios del equipo en el contexto
          setTeamUsers(fetchedTeamUsers);
        } else {
          console.error('Error fetching team users. Status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching team users:', error);
      }
    };

    console.log('loggedInUserEmail:', loggedInUserEmail);
    console.log('setTeamUsers:', setTeamUsers);

    fetchTeamUsers();
  }, [loggedInUserEmail, setTeamUsers]);

  const handleUserChange = (event) => {
    const selectedUserEmail = event.target.value;
    console.log('Selected user email:', selectedUserEmail);
    setSelectedUser(selectedUserEmail);

    // Guardar el usuario seleccionado en el contexto como creator
    setSelectedUser(selectedUserEmail);
  };

  console.log('teamUsers in component:', teamUsers);
  console.log('selectedUser in component:', selectedUser);

  return (
    <div>
      <label htmlFor="user-select">Vendedor:</label>
      <select
        id="user-select"
        value={selectedUser}
        onChange={handleUserChange}
      >
        <option value="">Ver opciones</option>
        {teamUsers?.map((user) => (
          <option key={user.email} value={user.email}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default UserSelector;