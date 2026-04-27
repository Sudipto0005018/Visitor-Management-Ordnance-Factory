import { Link, useNavigate, NavLink } from "react-router";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { RiAdminFill } from "react-icons/ri";
import { FaUserTie } from "react-icons/fa";

import axios from "axios";

import { useContext, useEffect, useState } from "react";
import { Context } from "../utils/Context";
import { makeAvatarName } from "../utils/helperFunctions";
import { FaRegBell } from "react-icons/fa";
import { MdNotifications } from "react-icons/md";
import { BsPeopleFill } from "react-icons/bs";
import { MdDashboard } from "react-icons/md";
import { FaHistory, FaCalendarAlt } from "react-icons/fa";
import { PiNotepadFill } from "react-icons/pi";
import { IoMdSettings } from "react-icons/io";
import { IoQrCode } from "react-icons/io5";
import { FaUserSecret } from "react-icons/fa6";
import { ChevronRight } from "lucide-react";
import { ImExit } from "react-icons/im";

import logo from "@/assets/GSF.png";
import toaster from "../utils/toaster";
import baseUrl from "../utils/baseURL";
import socket from "../utils/socket";

const Header = () => {
  const navigate = useNavigate();
  const { user, setUser, notifications, setNotifications } =
    useContext(Context);
  const handleLogout = async () => {
    try {
      socket.emit("leaveGroup", `${user.role}-${user.tenant_id}`);
      await axios.get(baseUrl + "/api/v1/user/logout", {
        withCredentials: true,
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setNotifications({
        visitors: 0,
        appointments: 0,
        rejected: 0,
        approved: 0,
      });
      toaster("success", "Logged out successfully");
      navigate("/");
    } catch (error) {
      toaster("error", "Failed to logout. Please try again");
    }
  };

  const [backupLoading, setBackupLoading] = useState(false);
  const [avatarName, setAvatarName] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (user) {
      setAvatarName(makeAvatarName(user.name));
    }
  }, [user]);
  return (
    <header className="flex h-16 w-full shrink-0 items-center px-4">
      {user && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-4 w-[300px] ">
            <Link
              to="/dashboard"
              className="flex w-full justify-center mt-4 mb-2"
            >
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </Link>
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col gap-2 py-3 h-full ">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => {
                    return `flex w-full items-center p-2 text-md font-normal ${
                      isActive ? "active" : ""
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <MdDashboard className="mr-2" />
                  Dashboard
                </NavLink>
                <Collapsible
                  title="Visitor"
                  defaultOpen={false}
                  className="group/collapsible m-0 p-0"
                >
                  <CollapsibleTrigger className="flex items-center w-full p-2">
                    <BsPeopleFill className="mr-2" />
                    Visitor
                    <ChevronRight
                      size={15}
                      className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <NavLink
                      to="/add-new-visitor"
                      className={({ isActive }) => {
                        return `ms-4 flex w-3/4 items-center p-2 text-md font-normal ${
                          isActive ? "active" : ""
                        }`;
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Add Visitor
                    </NavLink>
                    <NavLink
                      to="/view-visitors"
                      className={({ isActive }) => {
                        return `ms-4 flex w-3/4 items-center p-2 text-md font-normal ${
                          isActive ? "active" : ""
                        }`;
                      }}
                      onClick={() => setOpen(false)}
                    >
                      View Visitor
                    </NavLink>
                  </CollapsibleContent>
                </Collapsible>

                <NavLink
                  to="/add-employee"
                  className={({ isActive }) => {
                    return `flex w-full items-center p-2 text-md font-normal ${
                      isActive ? "active" : ""
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <FaUserTie className="mr-2" />
                  Employee
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) => {
                    return `flex w-full items-center p-2 text-md font-normal ${
                      isActive ? "active" : ""
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <FaHistory className="mr-2" />
                  History
                </NavLink>
                <Collapsible
                  title="Visitor"
                  defaultOpen={false}
                  className="group/collapsible m-0 p-0"
                >
                  <CollapsibleTrigger className="flex items-center w-full p-2">
                    <FaCalendarAlt className="mr-2" />
                    Appointment
                    <ChevronRight
                      size={15}
                      className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <NavLink
                      to="/add-appointment"
                      className={({ isActive }) => {
                        return `ms-4 flex w-3/4 items-center p-2 text-md font-normal ${
                          isActive ? "active" : ""
                        }`;
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Add Appointment
                    </NavLink>
                    <NavLink
                      to="/view-appointments"
                      className={({ isActive }) => {
                        return `ms-4 flex w-3/4 items-center p-2 text-md font-normal ${
                          isActive ? "active" : ""
                        }`;
                      }}
                      onClick={() => setOpen(false)}
                    >
                      View Appointment
                    </NavLink>
                  </CollapsibleContent>
                </Collapsible>
                <NavLink
                  to="/issue-gate-pass"
                  className={({ isActive }) => {
                    return `flex w-full items-center p-2 text-md font-normal ${
                      isActive ? "active" : ""
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <PiNotepadFill className="mr-2" />
                  Gate Pass
                </NavLink>
                {/* <NavLink
                                    to="/issue-qr"
                                    href="#"
                                    className={({ isActive }) => {
                                        return `flex w-full items-center p-2 text-md font-normal ${
                                            isActive ? "active" : ""
                                        }`;
                                    }}
                                    onClick={() => setOpen(false)}
                                >
                                    <IoQrCode className="mr-2" />
                                    QR Code
                                </NavLink> */}
                <NavLink
                  to="/visitors-movement"
                  className={({ isActive }) => {
                    return `flex w-full items-center p-2 text-md font-normal ${
                      isActive ? "active" : ""
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <FaUserSecret className="mr-2" />
                  Visitor Movement
                </NavLink>
                {/* <NavLink
                                    to="/settings"
                                    className={({ isActive }) => {
                                        return `flex w-full items-center p-2 text-md font-normal ${
                                            isActive ? "active" : ""
                                        }`;
                                    }}
                                    onClick={() => setOpen(false)}
                                >
                                    <IoMdSettings className="mr-2" />
                                    Settings
                                </NavLink> */}
                <NavLink
                  to="/users"
                  className={({ isActive }) => {
                    return `flex w-full items-center p-2 text-md font-normal ${
                      isActive ? "active" : ""
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <RiAdminFill className="mr-2" />
                  Users
                </NavLink>
              </div>
              <div>
                <p className="ms-4 text-xs text-gray-400">{user?.name}</p>
                <button
                  className="text-start flex items-center gap-2 ms-2 mb-2 p-2 font-normal cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
                  style={{ textAlign: "left" }}
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                >
                  <ImExit />
                  Logout
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      <Link to="/dashboard" className="mr-6 hidden lg:flex">
        <img src={logo} alt="Logo" className="h-12 w-auto" />
      </Link>
      <div className="mx-6 hidden md:flex">
        <p className="text-2xl text-black">Visitor Management</p>
      </div>
      <div className="ml-6 block md:hidden flex-1">
        <Link to={user ? "/dashboard" : "/"} className="text-lg text-black">
          Visitor Management
        </Link>
      </div>
      {user?.role === "superuser" && (
        <Button
          className="cursor-pointer"
          disabled={backupLoading}
          onClick={async () => {
            try {
              setBackupLoading(true);
              toaster("info", "Backup started...");

              await axios.get(baseUrl + "/api/v1/backup/run-backup", {
                withCredentials: true,
              });

              toaster("success", "Backup completed");
            } catch {
              toaster("error", "Backup failed");
            } finally {
              setBackupLoading(false);
            }
          }}
        >
          {backupLoading ? "Backing up..." : "Backup"}
        </Button>
      )}
      <div className="hidden lg:flex-1 lg:flex lg:justify-end lg:gap-6 lg:items-center">
        {user &&
          (((user?.role == "approver" || user?.role == "superuser") &&
            (notifications.visitors > 0 || notifications.appointments > 0)) ||
            (user?.role == "user" &&
              (notifications.approved > 0 || notifications.rejected > 0))) && (
            <Popover>
              <PopoverTrigger className="cursor-pointer">
                <div className="relative">
                  <FaRegBell className="size-6 ringing" />
                  <span className="absolute top-0 right-0 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-2 border border-gray-950 bg-slate-100 w-[350px]">
                {(user?.role == "approver" || user?.role == "superuser") && (
                  <>
                    {notifications.visitors > 0 && (
                      <Link to="/view-visitors">
                        <div className="flex items-center gap-2 p-2 shadow-md bg-white rounded-md border cursor-pointer">
                          <MdNotifications className="pointer-events-none" />
                          <p className="pointer-events-none">
                            {notifications.visitors} pending visitors
                          </p>
                        </div>
                      </Link>
                    )}
                    {notifications.appointments > 0 && (
                      <Link to="/view-appointments">
                        <div className="flex items-center gap-2 p-2 shadow-md bg-white rounded-md border cursor-pointer">
                          <MdNotifications className="pointer-events-none" />
                          <p className="pointer-events-none">
                            {notifications.appointments} pending appointments
                          </p>
                        </div>
                      </Link>
                    )}
                    {notifications.visitors == 0 &&
                      notifications.appointments == 0 && (
                        <p className="text-center text-gray-500">
                          You have no notifications
                        </p>
                      )}
                  </>
                )}
                {user?.role == "user" && (
                  <>
                    {notifications.approved > 0 && (
                      <Link
                        to="/view-visitors"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            approved: 0,
                          }))
                        }
                      >
                        <div className="flex items-center gap-2 p-2 shadow-md bg-white rounded-md border cursor-pointer">
                          <MdNotifications className="pointer-events-none text-green-800" />
                          <p className="pointer-events-none text-green-800">
                            {notifications.approved} approved visitors
                          </p>
                        </div>
                      </Link>
                    )}
                    {notifications.rejected > 0 && (
                      <Link
                        to="/view-visitors"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            rejected: 0,
                          }))
                        }
                      >
                        <div className="flex items-center gap-2 p-2 shadow-md bg-white rounded-md border cursor-pointer">
                          <MdNotifications className="pointer-events-none text-red-800" />
                          <p className="pointer-events-none text-red-800">
                            {notifications.rejected} rejected visitors
                          </p>
                        </div>
                      </Link>
                    )}
                    {notifications.approved == 0 &&
                      notifications.rejected == 0 && (
                        <p className="text-center text-gray-500">
                          You have no notifications
                        </p>
                      )}
                  </>
                )}
              </PopoverContent>
            </Popover>
          )}
        {user && (
          <div>
            <Popover className="ml-auto">
              <PopoverTrigger>
                <div className="w-10 h-10 bg-primary rounded-full relative">
                  <span
                    className="text-center m-0 text-white cursor-pointer"
                    style={{
                      position: "absolute",
                      fontFamily: "sans-serif",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                    }}
                  >
                    {avatarName}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-2">
                  <p className="text-center text-gray-600">{user.name}</p>
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer"
                    onClick={() => navigate("/change-password")}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </header>
  );
};

function MenuIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export default Header;

// Dashboard
// Approval
// Report
// Settings
