import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";

import baseUrl from "../utils/baseURL";
import { Context } from "../utils/Context";
import toaster from "../utils/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const { user, setUser, setEmployees, setConfig } = useContext(Context);

  const [inputs, setInputs] = useState({
    username: "",
    password: "",
    tanent: "a1b2c3d4",
  });
  const handleRedirect = (user) => {
    if (user == null) return;
    else navigate("/dashboard");
  };
  useEffect(() => {
    const tanentId = localStorage.getItem("tanentId");
    if (tanentId) {
      setInputs((prev) => ({ ...prev, tanent: tanentId }));
    }
    if (user) navigate("/dashboard");
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password, tanent } = inputs;
    if (!username || !password || !tanent) {
      toaster("error", "All fields are required");
      return;
    }
    try {
      let response = await axios.post(
        `${baseUrl}/api/v1/user/login`,
        {
          username,
          password,
          tenantId: tanent,
        },
        { withCredentials: true },
      );
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem("tanentId", tanent);
        const user = response.data.data;
        const token = user.token;
        delete user.token;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        setUser(user);
        handleRedirect(user);
      }
      response = await axios.get(`${baseUrl}/api/v1/config/get`);
      if (response.data.success) {
        setConfig(response.data?.data?.config || null);
      } else {
        setConfig(null);
      }
      response = await axios.get(`${baseUrl}/api/v1/employee`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setEmployees(response.data.data?.employees || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.log(error);

      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to Login");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col gap-6 min-w-[350px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    required
                    name="username"
                    value={inputs.username}
                    onChange={handleInputChange}
                  />
                </div>
                {/* <div className="grid gap-3">
                                    <Label htmlFor="tanent">Tanent ID</Label>
                                    <Input
                                        id="tanent"
                                        type="text"
                                        name="tanent"
                                        placeholder="xxxxxx"
                                        required
                                        value={inputs.tanent}
                                        onChange={handleInputChange}
                                    />
                                </div> */}
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    required
                    name="password"
                    value={inputs.password}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full cursor-pointer"
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
