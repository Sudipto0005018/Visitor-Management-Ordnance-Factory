import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import baseURL from "@/utils/baseURL";
import toaster from "../utils/toaster";
import { Eye, EyeOff } from "lucide-react";

const ChangePassword = () => {
    const [inputs, setInputs] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs({
            ...inputs,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputs.newPassword !== inputs.confirmPassword) {
            alert("New password and confirm password do not match.");
            return;
        }
        try {
            const response = await axios.post(
                `${baseURL}/api/v1/user/change-password`,
                {
                    oldPassword: inputs.currentPassword,
                    newPassword: inputs.newPassword,
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                toaster("success", "Password changed successfully!");
                setInputs({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                setShowPassword({
                    oldPassword: false,
                    newPassword: false,
                    confirmPassword: false,
                });
            } else {
                toaster("error", response.data.message || "Failed to change password.");
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            toaster("error", errMsg || "An error occurred while changing password.");
        }
    };

    return (
        <div className="w-full h-full rounded-lg flex items-center justify-center">
            <div className="w-[400px] bg-white rounded-md p-4 shadow-md flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-5">Change Password</h2>
                <div className="w-full">
                    <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1 mt-4">
                        Current password<span className="text-red-500"> *</span>
                    </label>
                    <div className="relative w-full max-w-sm">
                        <Input
                            type={showPassword.oldPassword ? "text" : "password"}
                            placeholder="Current password"
                            name="currentPassword"
                            value={inputs.currentPassword}
                            onChange={handleChange}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((prev) => ({
                                    ...prev,
                                    oldPassword: !prev.oldPassword,
                                }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {showPassword.oldPassword ? (
                                <EyeOff className="w-5 h-5 cursor-pointer" />
                            ) : (
                                <Eye className="w-5 h-5 cursor-pointer" />
                            )}
                        </button>
                    </div>
                    <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1 mt-4">
                        New password<span className="text-red-500"> *</span>
                    </label>
                    <div className="relative w-full max-w-sm">
                        <Input
                            type={showPassword.newPassword ? "text" : "password"}
                            placeholder="New password"
                            name="newPassword"
                            value={inputs.newPassword}
                            onChange={handleChange}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((prev) => ({
                                    ...prev,
                                    newPassword: !prev.newPassword,
                                }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {showPassword.newPassword ? (
                                <EyeOff className="w-5 h-5 cursor-pointer" />
                            ) : (
                                <Eye className="w-5 h-5 cursor-pointer" />
                            )}
                        </button>
                    </div>
                    <label className="ms-1 mb-2 text-sm font-medium text-gray-700 flex items-center gap-1 mt-4">
                        Confirm password<span className="text-red-500"> *</span>
                    </label>
                    <div className="relative w-full max-w-sm">
                        <Input
                            type={showPassword.confirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            name="confirmPassword"
                            value={inputs.confirmPassword}
                            onChange={handleChange}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((prev) => ({
                                    ...prev,
                                    confirmPassword: !prev.confirmPassword,
                                }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {showPassword.confirmPassword ? (
                                <EyeOff className="w-5 h-5 cursor-pointer" />
                            ) : (
                                <Eye className="w-5 h-5 cursor-pointer" />
                            )}
                        </button>
                    </div>
                </div>
                <Button className="cursor-pointer mt-5" onClick={handleSubmit}>
                    Change
                </Button>
            </div>
        </div>
    );
};

export default ChangePassword;
