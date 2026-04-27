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
import { FaRegClock } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import { FaXmark } from "react-icons/fa6";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    LineChart,
    Line,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import toaster from "../utils/toaster";
import { RxExternalLink } from "react-icons/rx";
import { useNavigate } from "react-router";
import { useBreakpoint } from "../hooks/useBreakpoint";

const ApproverDashboard = () => {
    const navigate = useNavigate();
    const breakpoint = useBreakpoint();
    const [tableData, setTableData] = useState({
        totalVisitors: 0,
        approvedVisitors: 0,
        rejectedVisitors: 0,
        pendingVisitors: 0,
        totalOutVisitors: 0,
        approvalPendings: [],
        appointmentSummary: [],
        dailyVisitors: [],
        timeSlotVisitors: [],
    });
    async function fetchData() {
        const d = new Date();
        // d.setDate(d.getDate() - 1); // Fetch data for the previous day
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 1);
        const endDate = getSqlTimeStamp(d);
        d.setDate(d.getDate() - 1);
        const startDate = getSqlTimeStamp(d);
        try {
            const response = await axios.post(
                `${baseURL}/api/v1/user/approver-dashboard`,
                {
                    startDate: startDate,
                    endDate: endDate,
                },
                { withCredentials: true }
            );
            if (response.data.success) {
                setTableData(response.data.data);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            toaster("error", errMsg || "Failed to fetch dashboard data");
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const columnVisibility = {
        lg: {},
        md: { purpose: false, whome_to_meet: false },
        sm: { purpose: false, whome_to_meet: false, Visitor_category: false },
    };

    return (
        <div className="lg:h-full flex flex-col gap-2">
            <div className="flex w-full gap-4 h-[72%] md:h-[36%] lg:h-[18%] flex-col lg:flex-row">
                <div className="flex flex-col md:flex-row w-full lg:w-1/2 gap-4">
                    <Card className="w-full md:w-1/2 p-4">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalVisitors || 0}
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
                    <Card className="w-full md:w-1/2 p-4">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalVisitors - tableData.totalOutVisitors || 0}
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
                    <Card className="w-full md:w-1/2 p-4">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalAppointments || 0}
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
                    <Card className="w-full md:w-1/2 p-4">
                        <div className="flex h-full">
                            <div className="w-3/4 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-2xl text-blue-700">
                                        {tableData.totalOutVisitors || 0}
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
            <div className="flex w-full gap-4 h-[50px] lg:h-[6%]">
                <Card className="w-1/3 h-full py-0 px-5 rounded-md ">
                    <div className="flex w-full h-full items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-[4px] items-center justify-center bg-blue-700 rounded-full flex md:hidden lg:flex">
                                <FaRegClock className="text-white" />
                            </div>
                            <p className="text-blue-700 hidden md:block">Approval Pending</p>
                        </div>
                        <p className="text-blue-700">{tableData.pendingVisitors}</p>
                    </div>
                </Card>
                <Card className="w-1/3 h-full py-0 px-5 rounded-md ">
                    <div className="flex w-full h-full items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-[4px] items-center justify-center bg-green-700 rounded-full flex md:hidden lg:flex">
                                <FaCheck className="text-white" />
                            </div>
                            <p className="text-green-700 hidden md:block">Approved</p>
                        </div>
                        <p className="text-green-700">{tableData.approvedVisitors}</p>
                    </div>
                </Card>
                <Card className="w-1/3 h-full py-0 px-5 rounded-md ">
                    <div className="flex w-full h-full items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-[4px] items-center justify-center bg-red-700 rounded-full flex md:hidden lg:flex">
                                <FaXmark className="text-white" />
                            </div>
                            <p className="text-red-700 hidden md:block">Rejected</p>
                        </div>
                        <p className="text-red-700">{tableData.rejectedVisitors}</p>
                    </div>
                </Card>
            </div>
            <div className="w-full gap-4 hidden md:flex lg:flex-row flex-col md:h-[440px] lg:h-[35%]">
                <Card className="w-full lg:w-2/3 h-1/2 lg:h-full p-2 gap-1 hide-dahboard-scroll">
                    <div className="flex items-center justify-between px-5">
                        <p className="font-semibold">Visitor Approval Pending</p>
                        <RxExternalLink
                            className="cursor-pointer"
                            onClick={() => navigate("/view-visitors")}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Category</TableHead>
                                <TableHead className="hidden md:table-cell">
                                    Person to Meet
                                </TableHead>
                                <TableHead className="md:hidden">Meet with</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>
                                    Kiosk <span className="hidden md:inline">Name</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="w-full">
                            {tableData.approvalPendings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center pt-12">
                                        No pending visitors found
                                    </TableCell>
                                </TableRow>
                            )}
                            {tableData.approvalPendings?.map((visitor, index) => (
                                <TableRow key={visitor.name + index}>
                                    <TableCell>{visitor.name}</TableCell>
                                    <TableCell className="hidden md:block">
                                        {visitor.Visitor_category}
                                    </TableCell>
                                    <TableCell>{visitor.whome_to_meet}</TableCell>
                                    <TableCell>{visitor.purpose}</TableCell>
                                    <TableCell>{visitor.created_by}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
                <Card className="w-full lg:w-1/3 h-1/2 lg:h-full p-2 gap-1 hide-dahboard-scroll">
                    <div className="flex items-center justify-between px-5">
                        <p className="font-semibold">Appointment Summary</p>
                        <RxExternalLink
                            className="cursor-pointer"
                            onClick={() => navigate("/view-appointments")}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Whom to Visit</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Pending</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="w-full">
                            {tableData.appointmentSummary?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center pt-12">
                                        No appointments found
                                    </TableCell>
                                </TableRow>
                            )}
                            {tableData.appointmentSummary?.map((appointment, index) => (
                                <TableRow key={appointment.whome_to_meet + index}>
                                    <TableCell>{appointment.whome_to_meet}</TableCell>
                                    <TableCell>{appointment.total}</TableCell>
                                    <TableCell>{appointment.pending}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
            <div className="hidden md:flex lg:flex-row flex-col gap-4 md:h-[440px] lg:h-[35%] w-full">
                <Card className="h-1/2 lg:h-full w-full lg:w-2/3 p-2 gap-1 hide-dahboard-scroll">
                    <p className="text-center text-sm">Visitor Trends on {getTodayString()}</p>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart
                            data={tableData.timeSlotVisitors}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time_slot" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="total_visitors"
                                name="Total Visitor"
                                stroke="#1447e6"
                            />
                            <Line
                                type="monotone"
                                dataKey="approved"
                                name="Approved"
                                stroke="oklch(52.7% 0.154 150.069)"
                            />
                            <Line
                                type="monotone"
                                dataKey="rejected"
                                name="Rejected"
                                stroke="oklch(50.5% 0.213 27.518)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card className="h-1/2 lg:h-full w-full lg:w-1/3 p-2 gap-1 hide-dahboard-scroll flex flex-col">
                    <p className="text-center text-sm">No of Visitor in last 5 days</p>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart accessibilityLayer data={tableData.dailyVisitors} barSize={25}>
                            <CartesianGrid vertical={false} stroke="#bbb" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="visit_date"
                                tickLine={false}
                                tickFormatter={(value) => value.slice(-2)}
                            />
                            <YAxis allowDecimals={false} />
                            <Bar dataKey="total_visitors" fill="#1447e6" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

export default ApproverDashboard;
