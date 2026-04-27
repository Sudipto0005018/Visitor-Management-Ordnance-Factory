import { createContext, useState } from "react";
// import axios from "axios";
// import { baseProductsUrl } from "../utils";

const Context = createContext();

const ContextProvider = ({ children }) => {
  const [selectedMenu, setSelectedMenu] = useState("");
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [notifications, setNotifications] = useState({
    visitors: 0,
    appointments: 0,
    rejected: 0,
    approved: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  return (
    <Context.Provider
      value={{
        selectedMenu,
        setSelectedMenu,
        user,
        setUser,
        config,
        setConfig,
        notifications,
        setNotifications,
        employees,
        setEmployees,
        loading,
        setLoading,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;

export { Context };
