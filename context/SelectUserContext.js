import { createContext, useContext, useState } from 'react';

export const SelectedUserContext = createContext();

export const SelectedUserProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamUsers, setTeamUsers] = useState([]);

  return (
    <SelectedUserContext.Provider value={{ selectedUser, setSelectedUser, teamUsers, setTeamUsers  }}>
      {children}
    </SelectedUserContext.Provider>
  );
};

export const useSelectedUser = () => useContext(SelectedUserContext);