import { useContext, useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import axios from "axios";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { getAppointmentDate, getSqlTimeStamp, isoToLocal } from "../utils/helperFunctions";
import baseURL, { imageBaseUrl } from "../utils/baseURL";
import toaster from "../utils/toaster";
import { Context } from "../utils/Context";
import AppointmentPaginatedTable from "../components/AppointmentPaginatedTable";
import Chip from "../components/Chip";
import socket from "../utils/socket";
import Spinner from "../components/Spinner";
import { useBreakpoint } from "../hooks/useBreakpoint";
import PreviewDialog from "../components/PreviewDialog";

const ViewVisitors = () => {
    const { user } = useContext(Context);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState({
        startDate: false,
        endDate: false,
        dialog: false,
        rejectDialog: false,
        approveDialog: false,
        approveCalender: false,
    });
    const [tableData, setTableData] = useState({
        data: [],
        pageSize: 5,
        currentPage: 0,
        totalItems: 0,
        totalPages: 0,
    });

    const [searchTableData, setSearchTableData] = useState({
        data: [],
        pageSize: 5,
        currentPage: 0,
        totalItems: 0,
        totalPages: 0,
    });
    const sDate = new Date();
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(sDate);
    eDate.setDate(sDate.getDate() - 7);

    const [inputs, setInputs] = useState({
      // startDate: eDate,
      startDate: null,
      endDate: sDate,
      status: undefined,
      comment: "",
      appointmentDate: new Date(),
      appointmentTime: "",
    });
    function dateStr(date) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;
    }
    const [date, setDate] = useState({
        startDate: dateStr(eDate),
        endDate: dateStr(sDate),
        appointmentDate: dateStr(new Date()),
    });
    const [dialogData, setDialogData] = useState({});

    async function fetchData(page, isDateFilter = false) {
      // const startDate = new Date(inputs.startDate);
      const startDate = inputs.startDate
        ? new Date(inputs.startDate)
        : new Date(); // fallback to today
      startDate.setHours(0, 0, 0, 0);
      const d1 = getSqlTimeStamp(startDate);
      const endDate = new Date(inputs.endDate);
      endDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1);
      const d2 = getSqlTimeStamp(endDate);
      setIsLoading(true);
      try {
        let url;
        if (isDateFilter) {
          url = page
            ? `${baseURL}/api/v1/appointment/get-appointments?page=${page}&size=5`
            : `${baseURL}/api/v1/appointment/get-appointments?size=5`;
        } else {
          url = page
            ? `${baseURL}/api/v1/appointment/search?page=${page}&size=5`
            : `${baseURL}/api/v1/appointment/search?size=5`;
        }
        const res = await axios.post(
          `${url}`,
          {
            startDate: isDateFilter ? d1 : undefined,
            endDate: isDateFilter ? d2 : undefined,
            status: isDateFilter ? inputs.status : undefined,
            search: inputs.search,
          },
          { withCredentials: true },
        );
        const data = res.data.data;

        if (res.data.success) {
          data.data.forEach((item) => {
            item.approved_at = item.approved_at
              ? getAppointmentDate(item.approved_at)
              : "";
          });
          if (isDateFilter) {
            setTableData({
              data: data.data,
              pageSize: data.pageSize,
              totalItems: data.totalItems,
              totalPages: data.totalPages,
              currentPage: data.currentPage,
            });
          } else {
            setSearchTableData({
              data: data.data,
              pageSize: data.pageSize,
              totalItems: data.totalItems,
              totalPages: data.totalPages,
              currentPage: data.currentPage,
            });
          }
        }
      } catch (error) {
        setTableData({
          data: [],
          pageSize: 5,
          totalItems: 0,
          totalPages: 0,
          currentPage: 0,
        });
        setSearchTableData({
          data: [],
          pageSize: 5,
          totalItems: 0,
          totalPages: 0,
          currentPage: 0,
        });
        const errMsg = error.response?.data?.message || error.message;
        toaster("error", errMsg || "Failed to fetch visitors");
      } finally {
        setIsLoading(false);
      }
    }

    const d = new Date();

    const handleApprove = async (fromView = false) => {
        const url = `${baseURL}/api/v1/appointment/approve-reject`;
        if (!inputs.appointmentTime) {
            toaster("error", "Please select appointment time");
            return;
        }
        const data = {
            ref_number: dialogData.ref_number,
            status: "approved",
            appoint_time: inputs.appointmentDate,
        };
        try {
            const res = await axios.post(url, data, { withCredentials: true });
            if (res.data.success) {
                toaster("success", "Visitor approved successfully");
                fetchData(tableData.currentPage, fromView);
                setOpen((prev) => ({ ...prev, dialog: false, approveDialog: false }));
                // socket.emit("approve-appointment", {
                //     role: user.role,
                //     tenant_id: user.tenant_id,
                //     appointment_id: dialogData._id,
                // });
            } else {
                toaster("error", res.data.message || "Failed to approve visitor");
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            toaster("error", errMsg || "Failed to approve visitor");
        }
    };

    const handleReject = async (fromView = false) => {
        const url = `${baseURL}/api/v1/appointment/approve-reject`;
        if (!inputs.comment || inputs.comment.trim() === "") {
            toaster("error", "Please provide a reason for rejection");
            return;
        }
        const data = {
            ref_number: dialogData.ref_number,
            status: "rejected",
            comment: inputs.comment,
        };
        if (!inputs.comment) {
            toaster("error", "Please provide a reason for rejection");
            return;
        }
        data.comment = inputs.comment;
        try {
            const res = await axios.post(url, data, { withCredentials: true });
            if (res.data.success) {
                toaster("success", "Visitor rejected successfully");
                fetchData(tableData.currentPage, fromView);
                setOpen((prev) => ({ ...prev, dialog: false, rejectDialog: false }));
                socket.emit("reject-appointment", {
                    role: user.role,
                    tenant_id: user.tenant_id,
                    appointment_id: dialogData._id,
                });
            } else {
                toaster("error", res.data.message || "Failed to reject visitor");
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message;
            toaster("error", errMsg || "Failed to reject visitor");
        }
    };

    return (
      <div className="w-full h-full">
        <Tabs defaultValue="View" className="h-full w-full">
          <TabsList className="flex gap-3">
            <TabsTrigger
              value="View"
              className="cursor-pointer w-40 py-4 data-[state=active]:text-blue-700 data-[state=active]:border-blue-500  data-[state=inactive]:border-gray-400 "
            >
              View
            </TabsTrigger>
            <TabsTrigger
              value="Search"
              className="cursor-pointer w-40 py-4 data-[state=active]:text-blue-700 data-[state=active]:border-blue-500 data-[state=inactive]:border-gray-400"
            >
              Search
            </TabsTrigger>
          </TabsList>
          <TabsContent value="View" className="pt-4 flex flex-col w-full gap-4">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex gap-4 w-full md:w-auto">
                <div className="w-1/2 md:w-auto">
                  <p className="ms-2 mb-2">Select start date</p>
                  <Popover
                    open={open.startDate}
                    onOpenChange={(set) =>
                      setOpen((prev) => {
                        return { ...prev, startDate: set };
                      })
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-5/6 md:w-36 justify-between font-normal"
                      >
                        {/* {inputs.startDate ? date.startDate : "Select date"} */}
                        {inputs.startDate
                          ? date.startDate
                          : dateStr(new Date())}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={inputs.startDate}
                        captionLayout="dropdown"
                        startMonth={new Date(2025, 0)}
                        endMonth={
                          new Date(d.getFullYear(), d.getMonth(), d.getDate())
                        }
                        onSelect={(date) => {
                          setInputs({ ...inputs, startDate: date });
                          setDate((prev) => {
                            return { ...prev, startDate: dateStr(date) };
                          });
                          setOpen((prev) => {
                            return { ...prev, startDate: false };
                          });
                        }}
                        classNames={{
                          day: "h-9 w-9 text-sm rounded-sm overflow-hidden aria-selected:bg-blue-500 aria-selected:text-white",
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-1/2 md:w-auto">
                  <p className="ms-2 mb-2">Select end date</p>
                  <Popover
                    open={open.endDate}
                    onOpenChange={(set) =>
                      setOpen((prev) => {
                        return { ...prev, endDate: set };
                      })
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-5/6 md:w-36 justify-between font-normal"
                      >
                        {inputs.endDate ? date.endDate : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={inputs.endDate}
                        captionLayout="dropdown"
                        startMonth={new Date(2025, 0)}
                        endMonth={
                          new Date(d.getFullYear(), d.getMonth(), d.getDate())
                        }
                        onSelect={(date) => {
                          setInputs({ ...inputs, endDate: date });
                          setDate((prev) => {
                            return { ...prev, endDate: dateStr(date) };
                          });
                          setOpen((prev) => {
                            return { ...prev, endDate: false };
                          });
                        }}
                        classNames={{
                          day: "h-9 w-9 text-sm rounded-sm overflow-hidden aria-selected:bg-blue-500 aria-selected:text-white",
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2 md:w-auto">
                  <p className="ms-2 mb-2">Select status</p>
                  <Select
                    defaultValue="all"
                    onValueChange={(value) => {
                      setInputs({
                        ...inputs,
                        status: value == "all" ? undefined : value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-5/6 md:w-[180px] bg-white">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select status</SelectLabel>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end h-full md:w-auto w-1/2">
                  <Button
                    className="cursor-pointer w-5/6 md:w-auto "
                    onClick={() => {
                      fetchData(0, true);
                    }}
                  >
                    Show
                  </Button>
                </div>
              </div>
            </div>
            <AppointmentPaginatedTable
              fetchData={fetchData}
              tableData={tableData}
              isView={true}
              setOpen={setOpen}
              setDialogData={setDialogData}
            />
          </TabsContent>
          <TabsContent value="Search">
            <div className="flex gap-4 py-4 bg-white p-4 mt-2 rounded-md shadow-md">
              <Input
                placeholder="Search by name, contact, reference number or whom to meet"
                onChange={(e) => {
                  setInputs((prev) => ({ ...prev, search: e.target.value }));
                }}
                value={inputs.search || ""}
              />
              <Button
                className="cursor-pointer"
                onClick={() => {
                  if (inputs.search) {
                    fetchData(0, false);
                  } else {
                    toaster("error", "Please enter a search term");
                  }
                }}
              >
                Search
              </Button>
            </div>
            {!isLoading && (
              <AppointmentPaginatedTable
                fetchData={fetchData}
                tableData={searchTableData}
                isView={false}
                setOpen={setOpen}
                setDialogData={setDialogData}
              />
            )}
            {isLoading && (
              <div className="mt-10">
                <Spinner />
              </div>
            )}
          </TabsContent>
        </Tabs>
        <Dialog open={open.dialog}>
          <DialogTitle />
          <DialogDescription />
          <DialogContent
            className="w-[320px] md:w-[450px]"
            showCloseButton={false}
            onPointerDownOutside={() =>
              setOpen({
                startDate: false,
                endDate: false,
                dialog: false,
                rejectDialog: false,
              })
            }
            unbounded={true}
          >
            <div className="flex flex-col gap-3 bg-white p-2">
              <p className="text-center font-semibold text-xl">
                Appointment Details
              </p>
              <table className="appointment-table">
                <tbody>
                  <tr>
                    <td className="text-gray-600 m-0">Name:</td>
                    <td className="text-black m-0">{dialogData?.name}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 m-0">Ref No:</td>
                    <td className="text-black m-0">{dialogData?.ref_number}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 m-0">Contact No:</td>
                    <td className="text-black m-0">
                      {dialogData?.visitor_contact}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 m-0">Email:</td>
                    <td className="text-black m-0">
                      {dialogData?.email || "Not mentioned"}
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
                    <td className="text-gray-600 m-0">Address:</td>
                    <td className="text-black m-0">
                      {dialogData?.visitor_address}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 m-0">Status:</td>
                    <td className="text-black m-0 capitalize">
                      <Chip
                        text={dialogData.status}
                        varient={dialogData.status}
                      />
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
                        {dialogData?.approved_by || "Not done yet"}
                      </td>
                    </tr>
                  )}
                  {dialogData?.status != "pending" && (
                    <tr>
                      <td className="text-gray-600 m-0">
                        {dialogData?.status == "rejected"
                          ? "Rejected at:"
                          : "Approved at:"}
                      </td>
                      <td className="text-black m-0">
                        {dialogData?.approved_at || "Not done yet"}
                      </td>
                    </tr>
                  )}
                  {dialogData?.status === "rejected" && (
                    <tr>
                      <td className="text-gray-600 m-0">Comment</td>
                      <td className="text-black m-0">
                        {dialogData?.comment || "No comment"}
                      </td>
                    </tr>
                  )}
                  {dialogData.document_image && (
                    <tr>
                      <td className="text-gray-600 m-0">Document</td>
                      <td>
                        <PreviewDialog imageName={dialogData.document_image} />
                      </td>
                    </tr>
                  )}
                  {dialogData.status == "approved" && (
                    <tr>
                      <td className="text-gray-600 m-0">Appointment Date:</td>
                      <td className="text-black m-0">
                        {dialogData?.appoint_time
                          ? getAppointmentDate(dialogData?.appoint_time)
                          : "Not scheduled yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {(user?.role == "approver" ||
                user?.role == "admin" ||
                user?.role == "superuser") &&
                dialogData?.status == "pending" && (
                  <div className="flex w-full justify-center gap-8 items-center p-2">
                    <Button
                      className="cursor-pointer bg-green-600 hover:bg-green-700 w-24"
                      onClick={() => {
                        setOpen((prev) => ({
                          ...prev,
                          dialog: false,
                          approveDialog: true,
                        }));
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      className="cursor-pointer bg-red-600 hover:bg-red-700 w-24"
                      onClick={() =>
                        setOpen((prev) => ({
                          ...prev,
                          dialog: false,
                          rejectDialog: true,
                        }))
                      }
                    >
                      Reject
                    </Button>
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={open.rejectDialog}>
          <DialogContent
            showCloseButton={false}
            className="w-[90%] md:w-full"
            onPointerDownOutside={() =>
              setOpen({ ...open, dialog: false, rejectDialog: false })
            }
          >
            <DialogTitle>Rejection cause?</DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              Please provide a reason for rejection.
            </DialogDescription>
            <div>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Enter reason for rejection"
                  value={inputs.comment}
                  onChange={(e) =>
                    setInputs((prev) => {
                      return { ...prev, comment: e.target.value };
                    })
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setOpen((prev) => ({
                        ...prev,
                        dialog: true,
                        rejectDialog: false,
                      }))
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleReject(true)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={open.approveDialog}>
          <DialogContent
            showCloseButton={false}
            className="w-full"
            onPointerDownOutside={() => {
              setOpen({ ...open, dialog: false, approveDialog: false });
            }}
            onCloseAutoFocus={() => {
              setInputs((prev) => ({
                ...prev,
                appointmentDate: new Date(),
                appointmentTime: "",
              }));
              setDate((prev) => ({
                ...prev,
                appointmentDate: dateStr(new Date()),
              }));
            }}
          >
            <DialogTitle>Appointment Date & Time</DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              Please select the appointment date and time.
            </DialogDescription>
            <div>
              <p className="ms-2 my-2">Select date:</p>
              <Popover
                open={open.approveCalender}
                onOpenChange={(set) => {
                  setOpen((prev) => {
                    return { ...prev, approveCalender: set };
                  });
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-48 justify-between font-normal"
                  >
                    {date.appointmentDate
                      ? date.appointmentDate
                      : "Select date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date.appointmentDate}
                    captionLayout="dropdown"
                    startMonth={
                      new Date(d.getFullYear(), d.getMonth(), d.getDate())
                    }
                    onSelect={(date) => {
                      setInputs({
                        ...inputs,
                        appointmentDate: getSqlTimeStamp(date),
                      });
                      setDate((prev) => {
                        return { ...prev, appointmentDate: dateStr(date) };
                      });
                      setOpen((prev) => {
                        return { ...prev, approveCalender: false };
                      });
                    }}
                    disabled={(date) => date <= new Date()}
                  />
                </PopoverContent>
              </Popover>
              <p className="ms-2 mt-4">Select Time:</p>
              <Input
                placeholder="In Time"
                className="my-2 w-48"
                type="time"
                value={inputs.appointmentTime}
                onChange={(e) => {
                  setInputs((prev) => ({
                    ...prev,
                    appointmentTime: e.target.value,
                  }));
                  const [hours, minutes] = e.target.value.split(":");
                  const appointmentDate = new Date(inputs.appointmentDate);
                  appointmentDate.setHours(hours, minutes, 0, 0);
                  setInputs((prev) => ({
                    ...prev,
                    appointmentDate: getSqlTimeStamp(appointmentDate),
                  }));
                }}
              />
              <div className="flex gap-5 w-full justify-end">
                <Button
                  variant="ghost"
                  className="w-20 text-center cursor-pointer"
                  onClick={() =>
                    setOpen((prev) => ({
                      ...prev,
                      dialog: true,
                      approveDialog: false,
                    }))
                  }
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  className="w-20 text-center cursor-pointer text-blue-600 hover:text-blue-600"
                  onClick={() => {
                    handleApprove(true);
                  }}
                >
                  Approve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
};

export default ViewVisitors;
