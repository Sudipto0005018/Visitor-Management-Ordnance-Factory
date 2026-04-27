import axios from "axios";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { FaRegCheckCircle } from "react-icons/fa";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import baseURL, { imageBaseUrl } from "../utils/baseURL";
import MovementTable from "../components/MovementTable";
import VerticalStepProgress from "../components/VerticalStepProgress";
import toaster from "../utils/toaster";
import { getSqlTimeStamp } from "../utils/helperFunctions";

const VisitorsMovement = () => {
    const [isOpen, setIsOpen] = useState({
        calendar: false,
        dialog: false,
    });
    const [date, setDate] = useState();
    const [tableData, setTableData] = useState({
        data: [
            {
                id: 2,
                ref_number: "752861238799",
                name: "Sanjay Mishra",
                email: "sanjay@example.com",
                visitor_contact: "9334051519",
                visitor_address: "Varanasi",
                visitor_image: "visitor_1752803909663_A1B2C3D4.jpg",
                whome_to_meet: "T Roy",
                document_type: "Aadhaar Card",
                document_number: "UP9876AA",
                document_image: null,
                purpose: "Work",
                vehicle_number: "UP32ER9911",
                in_time: "2025-07-18 14:00:00",
                out_time: null,
                status: "pending",
                approved_by: null,
                gate_pass_issued: 0,
                gate_pass_time: null,
                required_registration: 0,
                comment: null,
                created_by: 15,
                checkout_updated_by: null,
                created_at: "2025-07-18 13:55:00",
                Visitor_category: "Contractor",
                user_name: "faisal",
                qr_issued: 0,
                registation_type: "offline",
                rfid_num: null,
                mobile_verified: 0,
                email_verified: 0,
                visitor_id: 26,
                gate_details:
                    '[["1","2025-08-01 12:05:16"],["2","2025-08-01 12:06:17"],["4","2025-08-01 12:07:28"],["7","2025-08-01 12:08:49"],["4","2025-08-01 12:25:32"],["2","2025-08-01 12:26:02"],["1","2025-08-01 12:27:49"]]',
                creator_name: "Faisal Shaikh",
                creator_mobile: "9123456706",
                approver_name: null,
                approver_mobile: null,
            },
            {
                id: 1,
                ref_number: "753172210171",
                name: "Yash Goel",
                email: "visitor25@example.com",
                visitor_contact: "9000000025",
                visitor_address: "124 Example Rd",
                visitor_image: "visitor_1752803909663_A1B2C3D4.jpg",
                whome_to_meet: "Employee E",
                document_type: "Aadhaar Card",
                document_number: "192168031115",
                document_image: "document_1753172210167_A1B2C3D4.jpg",
                purpose: "Meeting",
                vehicle_number: null,
                in_time: "2025-07-22 10:15:00",
                out_time: "2025-08-01 18:00:00",
                status: "approved",
                approved_by: 1,
                gate_pass_issued: 1,
                gate_pass_time: "2025-07-25 00:25:53",
                required_registration: 0,
                comment: null,
                created_by: 1,
                checkout_updated_by: null,
                created_at: "2025-07-22 13:46:50",
                Visitor_category: "appointment",
                user_name: "sougata",
                qr_issued: 0,
                registation_type: "offline",
                rfid_num: "TEST RFID 001",
                mobile_verified: 0,
                email_verified: 0,
                visitor_id: 30,
                gate_details:
                    '[["1","2025-08-01 11:32:14"],["2","2025-08-01 11:34:09"],["5","2025-08-01 11:36:12"],["6","2025-08-01 11:37:52"],["5","2025-08-01 12:01:24"],["4","2025-08-01 12:02:32"],["1","2025-08-01 12:03:16"]]',
                creator_name: "Sougata Talukdar",
                creator_mobile: "7797454561",
                approver_name: "Sougata Talukdar",
                approver_mobile: "7797454561",
            },
        ],
        pageSize: 5,
        currentPage: 1,
        totalItems: 2,
        totalPages: 1,
    });
    const [inputs, setInputs] = useState({
        date: new Date(),
        search: "",
    });
    const [dialogData, setDialogData] = useState({});
    async function fetchData(page) {
        try {
            const startDate = new Date(inputs.date);
            startDate.setHours(0, 0, 0, 0);
            const d1 = getSqlTimeStamp(startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            const d2 = getSqlTimeStamp(endDate);

            let url = page
                ? `${baseURL}/api/v1/movement?page=${page}&size=5`
                : `${baseURL}/api/v1/movement?size=5`;

            const response = await axios.post(url, {
                startDate: d1,
                endDate: d2,
                search: inputs.search || undefined,
            });
            console.log("Response from movements:", response.data.data.movements);

            if (response.data.success) {
                setTableData({
                    data: response.data.data.movements,
                    pageSize: response.data.data.pageSize,
                    currentPage: response.data.data.currentPage,
                    totalItems: response.data.data.totalItems,
                    totalPages: response.data.data.totalPages,
                });
            }
        } catch (error) {
            toaster("error", "Something went wrong while fetching data.");
        }
    }
    const d = new Date();

    useEffect(() => {
        if (inputs.date) {
            let txtDate = `${inputs.date.getDate().toString().padStart(2, "0")}/${(
                inputs.date.getMonth() + 1
            )
                .toString()
                .padStart(2, "0")}/${inputs.date.getFullYear()}`;

            setDate(txtDate);
        }
    }, [inputs.date]);

    return (
        <div>
            <h1 className="text-lg font-bold ml-[40%]">Visitor Movement</h1>
            <div className="w-full flex flex-col md:flex-row bg-white rounded-md gap-2 p-2 shadow-md">
                <Input
                    className=""
                    placeholder="Search by name, contact or reference no."
                    value={inputs.search}
                    onChange={(e) =>
                        setInputs((prev) => {
                            return { ...prev, search: e.target.value };
                        })
                    }
                />
                <div className="flex gap-2 w-full md:w-auto justify-between">
                    <Popover
                        open={isOpen.calendar}
                        onOpenChange={(set) =>
                            setIsOpen((prev) => {
                                return { ...prev, calendar: set };
                            })
                        }
                    >
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                id="date"
                                className="w-36 justify-between font-normal"
                            >
                                {inputs.date ? date : "Select date"}
                                <ChevronDownIcon />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={inputs.date}
                                captionLayout="dropdown"
                                startMonth={new Date(2025, 0)}
                                endMonth={new Date(d.getFullYear(), d.getMonth(), d.getDate())}
                                onSelect={(date) => {
                                    setInputs({ ...inputs, date });
                                    setIsOpen((prev) => {
                                        return { ...prev, calendar: false };
                                    });
                                }}
                                classNames={{
                                    day: "h-9 w-9 text-sm rounded-sm overflow-hidden aria-selected:bg-blue-500 aria-selected:text-white",
                                }}
                                // disabled={(date) => date > new Date()}
                            />
                            <div className="w-full flex justify-center pb-2">
                                <Button
                                    variant="ghost"
                                    className="text-primary hover:text-blue-700"
                                    onClick={() => {
                                        // setDate(new Date());
                                        setInputs({ ...inputs, date: new Date() });
                                        setIsOpen((prev) => {
                                            return { ...prev, calendar: false };
                                        });
                                    }}
                                >
                                    Today
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button
                        className="cursor-pointer shadow-md"
                        onClick={() => {
                            if (inputs.date) {
                                fetchData();
                            }
                        }}
                    >
                        Search
                    </Button>
                </div>
            </div>
            <MovementTable
                setIsOpen={setIsOpen}
                tableData={tableData}
                fetchData={fetchData}
                setDialogData={setDialogData}
            />
            <Dialog open={isOpen.dialog}>
                <DialogDescription />
                <DialogContent
                    unbounded={true}
                    showCloseButton={false}
                    className="w-[90vw] max-w-[800px] max-h-[80vh] bg-white flex flex-col text-sm"
                    onPointerDownOutside={() => setIsOpen({ calendar: false, dialog: false })}
                >
                    <DialogTitle className="text-center">Visitor Movement Tracker</DialogTitle>
                    <div className="flex-1 overflow-hidden flex gap-4">
                        <div className="w-1/2 md:flex flex-col hidden">
                            <p className="text-center text-lg mb-2">Visitor Details</p>
                            <div className="flex-1 overflow-y-auto p-2 border rounded">
                                <div className="w-full flex justify-center items-center">
                                    <img
                                        src={imageBaseUrl + dialogData.visitor_image}
                                        alt="visitor's image"
                                        className="w-40 h-40 rounded-md border mb-4"
                                    />
                                </div>
                                <table className="h-full flex-1 p-2 details-table border-r">
                                    <tbody>
                                        <tr>
                                            <td className="text-gray-600 m-0">Name:</td>
                                            <td className="text-black m-0">{dialogData?.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Ref No:</td>
                                            <td className="text-black m-0">
                                                {dialogData?.ref_number}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Card No:</td>
                                            <td className="text-black m-0">
                                                {dialogData?.rfid_num || "Not issued"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Contact No:</td>
                                            <td className="text-black m-0 flex items-center gap-1">
                                                {dialogData?.visitor_contact}
                                                {dialogData?.mobile_verified == 1 && (
                                                    <FaRegCheckCircle className="text-green-600" />
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Email:</td>
                                            <td className="text-black m-0 flex items-center gap-1">
                                                {dialogData?.email || "Not mentioned"}
                                                {dialogData?.email_verified == 1 && (
                                                    <FaRegCheckCircle className="text-green-600" />
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Registration type:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.registation_type}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Purpose:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.purpose}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Whom to meet:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.whome_to_meet}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Category:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.Visitor_category}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Address:</td>
                                            <td className="text-black m-0">
                                                {dialogData?.visitor_address}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Status:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.status}
                                            </td>
                                        </tr>
                                        {dialogData?.status != "pending" && (
                                            <tr>
                                                <td className="text-gray-600 m-0">
                                                    {dialogData?.status == "rejected"
                                                        ? "Rejected by:"
                                                        : "Approved by:"}
                                                </td>
                                                <td className="text-black m-0">
                                                    {dialogData?.approver_name || "Not done yet"}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-gray-600 m-0">Check in:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.in_time}
                                            </td>
                                        </tr>
                                        {dialogData?.status == "approved" && (
                                            <tr>
                                                <td className="text-gray-600 m-0">Gatepass:</td>
                                                <td className="text-black m-0 capitalize">
                                                    {dialogData?.gate_pass_time || "Not issued yet"}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-gray-600 m-0">Vehicle no:</td>
                                            <td className="text-black m-0">
                                                {dialogData?.vehicle_number || "Not mentioned"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Document type:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.document_type || "Not mentioned"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Document no:</td>
                                            <td className="text-black m-0">
                                                {dialogData?.document_number || "Not mentioned"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Registered by:</td>
                                            <td className="text-black m-0 capitalize">
                                                {dialogData?.creator_name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-gray-600 m-0">Check out:</td>
                                            <td className="text-black m-0">
                                                {dialogData?.out_time || "Not checked-out yet"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 flex flex-col">
                            <p className="text-center text-lg mb-2">Movement History</p>
                            <div className="flex-1 overflow-y-auto p-2 border rounded">
                                <VerticalStepProgress data={dialogData} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => setIsOpen({ calendar: false, dialog: false })}
                        >
                            Ok
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VisitorsMovement;
