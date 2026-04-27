import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import axios from "axios";

import dashboard1 from "@/assets/dashboard1.png";
import dashboard2 from "@/assets/dashboard2.png";
import dashboard3 from "@/assets/dashboard3.png";
import dashboard4 from "@/assets/dashboard4.png";
import { useEffect, useState } from "react";
import { getSqlTimeStamp, getTodayString, isoToLocal } from "../utils/helperFunctions";
import baseURL from "../utils/baseURL";
import Chip from "../components/Chip";
import toaster from "../utils/toaster";
import { RxExternalLink } from "react-icons/rx";
import { useNavigate } from "react-router";
import { useBreakpoint } from "../hooks/useBreakpoint";

const Dashboard = () => {
    const navigate = useNavigate();
    const breakpoint = useBreakpoint("lg");
    const [tableData, setTableData] = useState({
        totalVisitors: 0,
        approvedVisitors: 0,
        rejectedVisitors: 0,
        pendingVisitors: 0,
        totalOutVisitors: 0,
        totalAppointments: 0,
        activeVisitors: [],
        visitorDetails: [],
        appointmentDetails: [],
    });
    async function fetchData() {
        const d = new Date();
        const now = getSqlTimeStamp(d.getTime());
        d.setHours(0, 0, 0, 0);
        const startDate = getSqlTimeStamp(d.getTime());
        d.setDate(d.getDate() + 1);
        const endDate = getSqlTimeStamp(d.getTime());
        try {
            const res = await axios.post(
                `${baseURL}/api/v1/user/user-dashboard`,
                { startDate, endDate, currentTime: now },
                { withCredentials: true }
            );
            if (res.data.success) {
                setTableData(res.data.data);
            } else {
                console.error("Failed to fetch dashboard data");
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            toaster("error", errMsg || "Failed to fetch dashboard data");
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const visibilityConfig = {
        lg: {},
        md: { purpose: false, whome_to_meet: false, out_time: false },
        sm: {
            visitor_contact: false,
            purpose: false,
            whome_to_meet: false,
            out_time: false,
            // in_time: false,
            created_by_name: false,
            approved_by_name: false,
            Visitor_category: false,
        },
    };
    const hiddenCols = visibilityConfig[breakpoint] || {};
    const isVisible = (col) => hiddenCols[col] !== false;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex w-full gap-4 h-[72%] md:h-[36%] lg:h-[15vh] flex-col lg:flex-row">
                <div className="flex flex-col md:flex-row w-full lg:w-1/2 gap-4">
                    <Card className="w-full md:w-1/2 p-4 min-h-[100px]">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalVisitors}
                                    </p>
                                    <p className="text-black text-xs">{getTodayString()}</p>
                                </div>
                                <p className="text-gray-600 mt-2 text-sm">Total Visitors</p>
                            </div>
                            <div className="w-1/4 flex items-center justify-center">
                                <img src={dashboard1} alt="Visitor Icon" className="w-12 h-12" />
                            </div>
                        </div>
                    </Card>
                    <Card className="min-h-[100px] w-full md:w-1/2 p-4">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalVisitors - tableData.totalOutVisitors}
                                    </p>
                                    <p className="text-black text-xs">{getTodayString()}</p>
                                </div>
                                <p className="text-gray-600 mt-2 text-sm">Active Visitors</p>
                            </div>
                            <div className="w-1/4 flex items-center justify-center">
                                <img src={dashboard2} alt="Visitor Icon" className="w-12 h-12" />
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="flex flex-col md:flex-row w-full lg:w-1/2 gap-4">
                    <Card className="w-full md:w-1/2 p-4 min-h-[100px]">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalAppointments}
                                    </p>
                                    <p className="text-black text-xs">{getTodayString()}</p>
                                </div>
                                <p className="text-gray-600 mt-2 text-sm">Total Appointments</p>
                            </div>
                            <div className="w-1/4 flex items-center justify-center">
                                <img src={dashboard3} alt="Visitor Icon" className="w-12 h-12" />
                            </div>
                        </div>
                    </Card>
                    <Card className="w-full md:w-1/2 p-4 min-h-[100px]">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalOutVisitors || "0"}
                                    </p>
                                    <p className="text-black text-xs">{getTodayString()}</p>
                                </div>
                                <p className="text-gray-600 mt-2 text-sm">Completed</p>
                            </div>
                            <div className="w-1/4 flex items-center justify-center">
                                <img src={dashboard4} alt="Visitor Icon" className="w-12 h-12" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <div className="lg:mt-2 w-full gap-4 hidden md:flex lg:flex-row md:flex-col md:h-[500px] lg:h-[34vh] ">
                <Card className="w-full lg:w-1/2 h-1/2 lg:h-full p-2 gap-1 hide-dahboard-scroll">
                    <div className="flex items-center justify-between px-2">
                        <p className="font-semibold text-sm">Active Visitors</p>
                        <RxExternalLink
                            className="cursor-pointer"
                            onClick={() => navigate("/view-visitors")}
                        />
                    </div>
                    <Table className="dashboard-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">
                                    Whom to Meet
                                </TableHead>
                                <TableHead className="md:hidden">Meet With</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="w-full">
                            {tableData.activeVisitors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center pt-12">
                                        No active visitors found
                                    </TableCell>
                                </TableRow>
                            )}
                            {tableData.activeVisitors.map((visitor, index) => (
                                <TableRow key={visitor.name + index}>
                                    <TableCell>{visitor.name}</TableCell>
                                    <TableCell>{visitor.whome_to_meet}</TableCell>
                                    <TableCell>{isoToLocal(visitor.in_time)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
                <Card className="w-full lg:w-1/2 h-1/2 lg:h-full p-2 gap-1 hide-dahboard-scroll">
                    <div className="flex items-center justify-between px-5">
                        <p className="font-semibold">Active Appointments</p>
                        <RxExternalLink
                            className="cursor-pointer"
                            onClick={() => navigate("/view-appointments")}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">
                                    Whom to Meet
                                </TableHead>
                                <TableHead className="md:hidden">Meet With</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="w-full">
                            {tableData.appointmentDetails.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center pt-12">
                                        No appointments found
                                    </TableCell>
                                </TableRow>
                            )}
                            {tableData.appointmentDetails.map((appointment, index) => (
                                <TableRow key={appointment.name + index}>
                                    <TableCell>{appointment.name}</TableCell>
                                    <TableCell>{appointment.whome_to_meet}</TableCell>
                                    <TableCell>{isoToLocal(appointment.appoint_time)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
            <Card className="hidden md:block md:h-[250px] lg:h-[34vh] p-2 gap-1 hide-dahboard-scroll">
                <div className="flex items-center justify-between px-5">
                    <p className="font-semibold">Visitor Register</p>
                    <RxExternalLink
                        className="cursor-pointer"
                        onClick={() => navigate("/view-visitors")}
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {isVisible("name") && (
                                <TableHead>
                                    <p className="text-wrap">Name</p>
                                </TableHead>
                            )}
                            {isVisible("whome_to_meet") && <TableHead>Person to Meet</TableHead>}
                            {isVisible("purpose") && <TableHead>Purpose</TableHead>}
                            {isVisible("status") && <TableHead>Status</TableHead>}
                            {isVisible("in_time") && <TableHead>Check In</TableHead>}
                            {isVisible("out_time") && <TableHead>Check Out</TableHead>}
                            {isVisible("Visitor_category") && (
                                <TableHead>
                                    <span className="hidden md:inline">Visitor</span> Category
                                </TableHead>
                            )}
                            {isVisible("approved_by_name") && <TableHead>Approved By</TableHead>}
                            {isVisible("created_by_name") && <TableHead>Kiosk Name</TableHead>}
                        </TableRow>
                    </TableHeader>

                    <TableBody className="w-full">
                        {tableData.visitorDetails.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={breakpoint === "lg" ? 8 : breakpoint === "md" ? 6 : 4}
                                    className="text-center pt-7"
                                >
                                    No visitors found
                                </TableCell>
                            </TableRow>
                        )}
                        {tableData.visitorDetails.map((visitor, index) => (
                            <TableRow key={index}>
                                {isVisible("name") && (
                                    <TableCell>
                                        <p className="text-wrap">{visitor.name}</p>
                                    </TableCell>
                                )}
                                {isVisible("whome_to_meet") && (
                                    <TableCell>{visitor.whome_to_meet}</TableCell>
                                )}
                                {isVisible("purpose") && <TableCell>{visitor.purpose}</TableCell>}
                                {isVisible("status") && (
                                    <TableCell className="capitalize">
                                        <Chip text={visitor.status} varient={visitor.status} />
                                    </TableCell>
                                )}
                                {isVisible("in_time") && (
                                    <TableCell>{isoToLocal(visitor.in_time)}</TableCell>
                                )}
                                {isVisible("out_time") && (
                                    <TableCell>
                                        {visitor.out_time ? isoToLocal(visitor.out_time) : "--"}
                                    </TableCell>
                                )}
                                {isVisible("Visitor_category") && (
                                    <TableCell className="capitalize">
                                        {visitor.Visitor_category}
                                    </TableCell>
                                )}
                                {isVisible("approved_by_name") && (
                                    <TableCell>{visitor.approved_by_name || "--"}</TableCell>
                                )}
                                {isVisible("created_by_name") && (
                                    <TableCell>{visitor.created_by_name}</TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

export default Dashboard;
