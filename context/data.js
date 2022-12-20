import { useState, createContext, useContext } from "react";

export const DataContext = createContext();

export default function DataProvider({ children }) {
  const [dataH, setData] = useState({});

  const setDataValues = (values) => {
    setData((prevValues) => ({
      ...prevValues,
      ...values,
    }));
  };

  return (
    <DataContext.Provider value={{ dataH, setDataValues }}>
      {children}
    </DataContext.Provider>
  );
}

export const useDataData = () => useContext(DataContext);