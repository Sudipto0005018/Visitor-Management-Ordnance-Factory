import { useContext, useEffect } from "react";
import { Outlet } from "react-router";
import axios from "axios";
import { Toaster } from "react-hot-toast";

import socket from "../utils/socket";
import { Context } from "../utils/Context";
import Header from "./Header";
import baseUrl from "../utils/baseURL";

const Layout = () => {
  const { setUser, setConfig, setEmployees, setLoading } = useContext(Context);
  const verifyUser = async () => {
    axios.defaults.withCredentials = true;
    try {
      let response = await axios.get(`${baseUrl}/api/v1/user/verify`, {
        withCredentials: true,
      });
      if (response.data.success) {
        const user = response.data.data;
        const token = user.token;
        delete user.token;
        setUser(user);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        response = await axios.get(`${baseUrl}/api/v1/config/get`);
        if (response.data.success) {
          setConfig(response.data?.data?.config || null);
        } else {
          setConfig(null);
        }
        response = await axios.get(`${baseUrl}/api/v1/employee/dropdown`, {
          withCredentials: true,
        });

        if (response.data.success) {
          setEmployees(response.data.data || []);
        } else {
          setEmployees([]);
        }
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setEmployees([]);
      setConfig({});
    } finally {
      setLoading(false)
    }
  };
  useEffect(() => {
    verifyUser();
  }, []);
  return (
    <div className="w-full h-full flex flex-col">
      <div>
        <Header />
      </div>
      <main className="main-body p-4 bg-gray-100 relative overflow-hidden">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
