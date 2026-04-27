import { useContext, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import socket from "../utils/socket";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { BsPeopleFill } from "react-icons/bs";
import { MdDashboard } from "react-icons/md";
import { RiAdminFill } from "react-icons/ri";
import { FaHistory, FaCalendarAlt } from "react-icons/fa";
import { FaUserTie } from "react-icons/fa";
import { PiNotepadFill } from "react-icons/pi";
import { IoMdSettings } from "react-icons/io";
import { IoQrCode } from "react-icons/io5";
import { FaUserSecret } from "react-icons/fa6";
import { Outlet, useLocation, useNavigate } from "react-router";
import { SidebarBoiler, SidebarItem } from "./SidebarBoiler";
import { Context } from "../utils/Context";

const DashboardLayout = () => {
    const { user, selectedMenu, setSelectedMenu, setNotifications } = useContext(Context);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            socket.emit("joinGroup", `${user.role}-${user.tenant_id}`);
            socket.on("notification", (msg) => {
                console.log(msg);
                if (msg.type == "visitor_approved") {
                    setNotifications((prev) => ({
                        ...prev,
                        visitors: Math.max(prev.visitors - 1, 0),
                        approved: prev.approved + 1,
                    }));
                } else if (msg.type == "appointment_approved") {
                    setNotifications((prev) => ({
                        ...prev,
                        appointments: Math.max(prev.appointments - 1, 0),
                    }));
                } else if (msg.type == "visitor_rejected") {
                    setNotifications((prev) => ({
                        ...prev,
                        rejected: prev.rejected + 1,
                        visitors: Math.max(prev.visitors - 1, 0),
                    }));
                } else if (msg.type == "appointment_rejected") {
                    setNotifications((prev) => ({
                        ...prev,
                        appointments: Math.max(prev.appointments - 1, 0),
                    }));
                } else if (msg.type == "visitor_added") {
                    setNotifications((prev) => ({
                        ...prev,
                        visitors: prev.visitors + 1,
                    }));
                } else if (msg.type == "appointment_added") {
                    setNotifications((prev) => ({
                        ...prev,
                        appointments: prev.appointments + 1,
                    }));
                    console.log("Appointment added notification received");
                }
            });
        }
        return () => {
            socket.off("notification");
        };
    }, [user]);

    useEffect(() => {
        const path = location.pathname.split("/").pop();
        const menuMap = {
            dashboard: "Dashboard",
            "history": "Search",
            "add-employee": "Employee",
            "view-visitors": "View Visitor",
            "add-appointment": "Add Appointment",
            "view-appointments": "View Appointment",
            "issue-gate-pass": "Gate Pass",
            "add-new-visitor": "Add Visitor",
            "add-appointment-visitor": "Add Visitor",
            "issue-qr": "QR Code",
            "change-password": "Change Password",
            "visitors-movement": "Visitor Movement",
            "users": "Users"
        };
        setSelectedMenu(menuMap[path] || "Dashboard");
    }, [location.pathname]);

    const emptyFunction = () => {};
    const menu = {
      dashboard: {
        label: "Dashboard",
        icon: MdDashboard,
        onClick: () => navigate("/dashboard"),
      },
      visitor: {
        label: "Visitor",
        icon: BsPeopleFill,
        subItems: [
          {
            label: "Add Visitor",
            onClick: () => setIsDialogOpen(true),
          },
          {
            label: "View Visitor",
            onClick: () => navigate("/view-visitors"),
          },
        ],
      },
      employee: {
        label: "Employee",
        icon: FaUserTie,
        onClick: () => navigate("/add-employee"),
      },
      search: {
        label: "Search",
        icon: FaHistory,
        onClick: () => navigate("/history"),
      },
      appointment: {
        label: "Appointment",
        icon: FaCalendarAlt,
        subItems: [
          {
            label: "Add Appointment",
            onClick: () => navigate("/add-appointment"),
          },
          {
            label: "View Appointment",
            onClick: () => navigate("/view-appointments"),
          },
        ],
      },
      gatePass: {
        label: "Gate Pass",
        icon: PiNotepadFill,
        onClick: () => navigate("/issue-gate-pass"),
      },
      // qr: {
      //     label: "QR Code",
      //     icon: IoQrCode,
      //     onClick: () => navigate("/issue-qr", { state: { qr: true } }),
      // },
      visitorsMovement: {
        label: "Visitor Movement",
        icon: FaUserSecret,
        onClick: () => navigate("/visitors-movement"),
      },
      users: {
        label: "Users",
        icon: RiAdminFill,
          onClick: () => navigate("/users"),
          visible:["superuser", "admin"]
      },
      // settings: {
      //     label: "Settings",
      //     icon: IoMdSettings,
      // },
    };
    const menuItems = Object.keys(menu);

    return (
        <div className="relative h-full flex">
            <SidebarBoiler>
                {menuItems.map((itemKey, index) => {
                    const item = menu[itemKey];
                    if (item.subItems) {
                        return (
                            <SidebarMenuItem className="group/collapsible" key={itemKey}>
                                <Collapsible
                                    title="Visitor"
                                    defaultOpen={false}
                                    className="group/collapsible m-0 p-0"
                                >
                                    <SidebarGroup className="pb-1">
                                        <CollapsibleTrigger className="gap-2.5 flex items-center">
                                            <item.icon />
                                            {item.label}
                                            <ChevronRight
                                                size={15}
                                                className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                                            />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarGroupContent className="mt-2 pb-0">
                                                <SidebarMenu>
                                                    {item.subItems.map((subItem, i) => (
                                                        <SidebarItem
                                                            className="cursor-pointer"
                                                            key={i}
                                                            onClick={
                                                                subItem.onClick || emptyFunction
                                                            }
                                                        >
                                                            <a
                                                                href="#"
                                                                className={`ps-5 ${
                                                                    selectedMenu == subItem.label
                                                                        ? "active"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span>{subItem.label}</span>
                                                            </a>
                                                        </SidebarItem>
                                                    ))}
                                                </SidebarMenu>
                                            </SidebarGroupContent>
                                        </CollapsibleContent>
                                    </SidebarGroup>
                                </Collapsible>
                            </SidebarMenuItem>
                        );
                    } else
                        return (
                            <SidebarItem key={itemKey} onClick={item.onClick || emptyFunction}>
                                <a href="#" className={selectedMenu == item.label ? "active" : ""}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </a>
                            </SidebarItem>
                        );
                })}
            </SidebarBoiler>
            <div className="flex-1">
                <ScrollArea className="h-full">
                    <div className="h-container">
                        <Outlet />
                    </div>
                </ScrollArea>
            </div>
            <Dialog open={isDialogOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-md"
                    onPointerDownOutside={(e) => setIsDialogOpen(false)}
                >
                    <DialogHeader>
                        <DialogTitle>Add Visitor</DialogTitle>
                        <DialogDescription>
                            Is this visitor having an appointment?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-7">
                        <Button
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => {
                                navigate("/add-appointment-visitor");
                                setIsDialogOpen(false);
                            }}
                        >
                            Yes
                        </Button>
                        <Button
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => {
                                navigate("/add-new-visitor");
                                setIsDialogOpen(false);
                            }}
                        >
                            No
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardLayout;
