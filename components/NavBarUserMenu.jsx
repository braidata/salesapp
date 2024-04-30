import React, { useEffect } from 'react';
import { useSelectedUser } from '../context/SelectUserContext';
import LoginButton from "../components/loginButton";


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
    <div className="group relative flex justify-center items-center text-sm font-bold">
    <div className="absolute opacity-0 group-hover:opacity-100 group-hover:translate-y-[100%] translate-y-[400%] duration-900 shadow-md">
      <div className="bg-gradient-to-br from-lime-200 to-teal-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-teal-900 flex items-center gap-1 p-2 rounded-md">
      <div className="text-[0px] group-hover:text-sm duration-900 z-50">
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
      </div>
      <div className="shadow-md bg-gradient-to-br from-lime-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-teal-900 absolute bottom-0 translate-y-1/2 left-1/2 translate-x-full rotate-45 p-1"></div>
      <div className="rounded-md bg-white group-hover:opacity-0  duration-500 w-full h-full absolute top-0 left-0">
        <div className="border-b border-r border-white bg-white absolute bottom-0 translate-y-1/2 left-1/2 translate-x-full rotate-45 p-1"></div>
      </div>
    </div>

    <div className="shadow-md flex items-center bg-gradient-to-br from-lime-200 to-teal-200 dark:bg-gradient-to-br dark:from-blue-800 dark:to-teal-900 p-3 rounded-full cursor-pointer duration-300">

      <LoginButton />
      
    </div>
      </div>
    
  );
};

export default UserSelector;