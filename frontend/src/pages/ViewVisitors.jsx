import { useContext, useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import axios from "axios";
import { MdOutlineBlock, MdOutlineModeEdit } from "react-icons/md";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import PaginatedTable from "../components/PaginatedTable";
import {
  getSqlTimeStamp,
  isoToLocal,
  showCheckOutTime,
} from "../utils/helperFunctions";
import baseURL, { imageBaseUrl } from "../utils/baseURL";
import toaster from "../utils/toaster";
import { Context } from "../utils/Context";
import imgPlaceholder from "../assets/img_placeholder.jpg";
import StepProgressBar from "../components/StepProgressBar";
import socket from "../utils/socket";
import { FaFilePdf, FaRegCheckCircle } from "react-icons/fa";

const ViewVisitors = () => {
  const { user } = useContext(Context);

  const [open, setOpen] = useState({
    calendar: false,
    dialog: false,
    rejectDialog: false,
    checkout: false,
    exportDialog: false,
    exportDateDialog: false,
    startDate: false,
    endDate: false,

    exportStartDate: false,
    exportEndDate: false,
  });

  const [exportType, setExportType] = useState("");

  const [date, setDate] = useState({
    startDate: "",
    endDate: "",
  });

  const formatDate = (d) => {
    if (!d) return "";
    return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;
  };

  const [exportDates, setExportDates] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  const [tableData, setTableData] = useState({
    data: [],
    pageSize: 5,
    currentPage: 0,
    totalItems: 0,
    totalPages: 0,
  });
  const [inputs, setInputs] = useState({
    // date: new Date(),
    startDate: new Date(),
    endDate: new Date(),
    search: "",
    comment: "",
    outTime: "",
    out_time: new Date(),
  });
  const [dialogData, setDialogData] = useState({});

  async function fetchData(page) {
    // const startDate = new Date(inputs.date);
    // startDate.setHours(0, 0, 0, 0);
    // const endDate = new Date(startDate);
    // endDate.setDate(startDate.getDate() + 1);
    // // startDate.setDate(startDate.getDate() - 6);
    // startDate.setDate(startDate.getDate());

    const startDate = new Date(inputs.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(inputs.endDate);
    endDate.setHours(23, 59, 59, 999);
    const d1 = getSqlTimeStamp(startDate);
    const d2 = getSqlTimeStamp(endDate);
    try {
      const url = page
        ? `${baseURL}/api/v1/visitor/search-by-date?page=${page}&size=5`
        : `${baseURL}/api/v1/visitor/search-by-date?size=5`;
      const res = await axios.post(
        `${url}`,
        {
          startDate: d1,
          endDate: d2,
          search: inputs.search,
        },
        { withCredentials: true },
      );
      const data = res.data.data;

      if (res.data.success) {
        data.items.forEach((item) => {
          item.in_time = isoToLocal(item.in_time);
          item.out_time = item.out_time
            ? showCheckOutTime(item.out_time)
            : null;
          item.gate_pass_time = item.gate_pass_issued
            ? isoToLocal(item.gate_pass_time)
            : null;
        });

        setTableData({
          data: data.items,
          pageSize: data.pageSize,
          totalItems: data.totalItems,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        });
      }
    } catch (error) {
      setTableData({
        data: [],
        pageSize: 5,
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,
      });
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to fetch visitors");
    }
  }

  const d = new Date();

  useEffect(() => {
    setDate({
      startDate: formatDate(inputs.startDate),
      endDate: formatDate(inputs.endDate),
    });
  }, []);

  // useEffect(() => {
  //   if (inputs.date) {
  //     let txtDate = `${inputs.date.getDate().toString().padStart(2, "0")}/${(
  //       inputs.date.getMonth() + 1
  //     )
  //       .toString()
  //       .padStart(2, "0")}/${inputs.date.getFullYear()}`;

  //     setDate(txtDate);
  //   }
  // }, [inputs.date]);

  const handleApprove = async (id) => {
    const url = `${baseURL}/api/v1/visitor/update-status`;
    const data = {
      id: id,
      status: "approved",
    };
    try {
      const res = await axios.post(url, data, { withCredentials: true });
      if (res.data.success) {
        toaster("success", "Visitor approved successfully");
        fetchData(tableData.currentPage);
        setOpen((prev) => ({ ...prev, dialog: false }));
        socket.emit("approve-visitor", {
          role: user.role,
          tenant_id: user.tenant_id,
          visitor_id: id,
        });
      } else {
        toaster("error", res.data.message || "Failed to approve visitor");
      }
    } catch (error) {
      console.log(error);

      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to approve visitor");
    }
  };
  const handleReject = async (id) => {
    const url = `${baseURL}/api/v1/visitor/update-status`;
    const data = {
      id: id,
      status: "rejected",
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
        fetchData(tableData.currentPage);
        setOpen((prev) => ({ ...prev, dialog: false, rejectDialog: false }));
        socket.emit("reject-visitor", {
          role: user.role,
          tenant_id: user.tenant_id,
          visitor_id: id,
        });
      } else {
        toaster("error", res.data.message || "Failed to reject visitor");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to reject visitor");
    }
  };
  const handleCheckOut = async () => {
    try {
      const url = `${baseURL}/api/v1/visitor/check-out`;
      const data = {
        id: dialogData.id,
        out_time: getSqlTimeStamp(inputs.out_time),
      };
      const res = await axios.post(url, data, { withCredentials: true });
      if (res.data.success) {
        toaster("success", "Visitor checked out successfully");
        fetchData(tableData.currentPage);
        setOpen((prev) => ({ ...prev, dialog: false, checkout: false }));
      } else {
        toaster("error", res.data.message || "Failed to check out visitor");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to check out visitor");
    }
  };

  const handleExportPDF = async () => {
    try {
      const startDate = getSqlTimeStamp(exportDates.startDate);
      let end = exportDates.endDate;
      // end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 0);
      const endDate = getSqlTimeStamp(end);

      const res = await axios.post(
        `${baseURL}/api/v1/visitor/get-pdf`,
        {
          startDate,
          endDate,
          currentTime: new Date(),
        },
        {
          responseType: "blob", // 🔥 VERY IMPORTANT
          withCredentials: true,
        },
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "visitor_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setOpen((prev) => ({ ...prev, exportDialog: false }));
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to download PDF");
    }
  };

  const handleExportCSV = async () => {
    try {
      const startDate = getSqlTimeStamp(exportDates.startDate);

      let end = new Date(exportDates.endDate);
      end.setHours(23, 59, 59, 0);

      const endDate = getSqlTimeStamp(end);

      const res = await axios.post(
        `${baseURL}/api/v1/visitor/get-csv`,
        { startDate, endDate },
        {
          responseType: "blob",
          withCredentials: true,
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "visitor_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setOpen((prev) => ({ ...prev, exportDateDialog: false }));
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to download CSV");
    }
  };

  return (
    <div className="w-full h-full">
      <div className="w-full flex flex-row justify-center items-end gap-2 p-2">
        <Input
          className="max-w-full bg-white"
          placeholder="Search by visitor name, contact, whom to meet"
          value={inputs.search}
          onChange={(e) =>
            setInputs((prev) => {
              return { ...prev, search: e.target.value };
            })
          }
        />

        <div className="flex gap-4 flex-col md:flex-row">
          {/* START DATE */}
          <div className="w-full md:w-auto">
            <p className="ms-2 mb-2">Select start date</p>
            <Popover
              open={open.startDate}
              onOpenChange={(set) =>
                setOpen((prev) => ({ ...prev, startDate: set }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-36 justify-between font-normal"
                >
                  {inputs.startDate ? date.startDate : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inputs.startDate}
                  captionLayout="dropdown"
                  startMonth={new Date(2025, 0)}
                  endMonth={new Date()}
                  onSelect={(d) => {
                    setInputs((prev) => ({ ...prev, startDate: d }));
                    setDate((prev) => ({
                      ...prev,
                      startDate: formatDate(d),
                    }));
                    setOpen((prev) => ({ ...prev, startDate: false }));
                  }}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* END DATE */}
          <div className="w-full md:w-auto">
            <p className="ms-2 mb-2">Select end date</p>
            <Popover
              open={open.endDate}
              onOpenChange={(set) =>
                setOpen((prev) => ({ ...prev, endDate: set }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-36 justify-between font-normal"
                >
                  {inputs.endDate ? date.endDate : "Select date"}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inputs.endDate}
                  captionLayout="dropdown"
                  startMonth={new Date(2025, 0)}
                  endMonth={new Date()}
                  onSelect={(d) => {
                    setInputs((prev) => ({ ...prev, endDate: d }));
                    setDate((prev) => ({
                      ...prev,
                      endDate: formatDate(d),
                    }));
                    setOpen((prev) => ({ ...prev, endDate: false }));
                  }}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* <Popover
          open={open.calendar}
          onOpenChange={(set) =>
            setOpen((prev) => {
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
              // selected={inputs.date}
              captionLayout="dropdown"
              startMonth={new Date(2025, 0)}
              endMonth={new Date(d.getFullYear(), d.getMonth(), d.getDate())}
              onSelect={(date) => {
                setInputs({ ...inputs, date });
                setOpen((prev) => {
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
                  setOpen((prev) => {
                    return { ...prev, calendar: false };
                  });
                }}
              >
                Today
              </Button>
            </div>
          </PopoverContent>
        </Popover> */}
        {/* <Button
          className="cursor-pointer shadow-md"
          onClick={() => {
            if (inputs.date) {
              fetchData();
            }
          }}
        >
          Search
        </Button> */}
        <Button onClick={() => fetchData()}>Search</Button>
        <Button
          className="cursor-pointer shadow-md bg-blue-600 hover:bg-blue-700"
          onClick={() => setOpen((prev) => ({ ...prev, exportDialog: true }))}
        >
          Export
        </Button>
      </div>
      <PaginatedTable
        open={open}
        setIsOpen={setOpen}
        setDialogData={setDialogData}
        fetchData={fetchData}
        tableData={tableData}
      />
      <Dialog
        open={open.dialog}
        onOpenChange={(val) =>
          setOpen((prev) => ({ ...prev, exportDialog: val }))
        }
      >
        <DialogTitle />
        <DialogDescription />
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] md:w-[600px] backdrop:blur-md bg-[#e4e5e6] max-h-full "
          onPointerDownOutside={() =>
            setOpen({ calendar: false, dialog: false, rejectDialog: false })
          }
          unbounded={true}
        >
          <div className="w-full flex flex-col gap-4">
            <div className="bg-white p-2 rounded-md shadow-md">
              <StepProgressBar
                currentStep={
                  dialogData?.gate_pass_issued
                    ? 5
                    : dialogData?.status == "pending"
                      ? 2
                      : dialogData?.status == "reject"
                        ? 4
                        : 4
                }
                rejected={dialogData?.status == "rejected"}
              />
            </div>
            <div className="flex flex-col md:flex-row bg-white p-2 rounded-md shadow-md h-[67vh] overflow-scroll hide-scrollbar">
              <div className="md:hidden w-full flex flex-row justify-around gap-2 p-2 items-center">
                <div>
                  <p className="text-center text-gray-500 mb-2">Image</p>
                  <img
                    src={
                      dialogData?.visitor_image
                        ? imageBaseUrl + dialogData.visitor_image
                        : "/images/placeholder.png"
                    }
                    alt="Visitor"
                    className="w-28 h-28 rounded-md object-cover mb-4"
                  />
                </div>
                <div>
                  <p className="text-center text-gray-500 mb-2">Document</p>
                  {dialogData?.document_image ? (
                    dialogData.document_image.indexOf(".pdf") >= 0 ? (
                      <FaFilePdf className="w-28 h-28 text-red-600 mb-4" />
                    ) : (
                      <img
                        src={imageBaseUrl + dialogData.document_image}
                        alt="document"
                        className="w-28 h-28 rounded-md object-cover mb-4"
                      />
                    )
                  ) : (
                    <img
                      src={imgPlaceholder}
                      alt="placeholder"
                      className="w-28 h-28 rounded-md object-cover mb-4"
                    />
                  )}
                </div>
              </div>
              <table className="h-full flex-1 p-2 details-table md:border-r">
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
                  {/* <tr>
                    <td className="text-gray-600 m-0">Registration type:</td>
                    <td className="text-black m-0 capitalize">
                      {dialogData?.registation_type}
                    </td>
                  </tr> */}
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
                    <td className="text-gray-600 m-0">Unit Name:</td>
                    <td className="text-black m-0 capitalize">
                      {dialogData?.unit_name || "Not mentioned"}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-600 m-0">City:</td>
                    <td className="text-black m-0 capitalize">
                      {dialogData?.city || "Not mentioned"}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-600 m-0">Designation:</td>
                    <td className="text-black m-0 capitalize">
                      {dialogData?.designation || "Not mentioned"}
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
                    <td className="text-gray-600 m-0">Register by:</td>
                    <td className="text-black m-0 capitalize">
                      {dialogData?.creator_name}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 m-0">Check out:</td>
                    <td className="text-black m-0 flex items-center gap-2">
                      {dialogData?.out_time ? (
                        dialogData?.out_time
                      ) : open.checkout ? (
                        <div className="flex items-center">
                          <Input
                            type="time"
                            className="rounded-r-none border-r-0"
                            value={inputs.outTime}
                            onChange={(e) => {
                              const t = e.target.value.split(":");
                              const d = new Date();
                              d.setHours(parseInt(t[0]), parseInt(t[1]), 0, 0);
                              setInputs((prev) => ({
                                ...prev,
                                outTime: e.target.value,
                                out_time: d,
                              }));
                            }}
                          />
                          <Button
                            variant="outline"
                            className="rounded-l-none px-2 cursor-pointer"
                            onClick={() => {
                              const d = new Date();

                              setInputs((prev) => ({
                                ...prev,
                                outTime:
                                  d.getHours().toString().padStart(2, "0") +
                                  ":" +
                                  d.getMinutes().toString().padStart(2, "0"),
                                out_time: d,
                              }));
                            }}
                          >
                            Now
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="ms-2 text-red-600 hover:bg-red-100 hover:text-red-700 cursor-pointer"
                            onClick={() => {
                              setOpen((prev) => ({
                                ...prev,
                                checkout: false,
                              }));
                              setInputs((prev) => ({
                                ...prev,
                                outTime: "",
                              }));
                            }}
                          >
                            <MdOutlineBlock />
                          </Button>
                        </div>
                      ) : (
                        "Not checked-out yet"
                      )}
                      {!dialogData?.out_time &&
                        !open.checkout &&
                        !!dialogData.gate_pass_issued && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-600"
                            onClick={() => {
                              setOpen((prev) => ({
                                ...prev,
                                checkout: true,
                              }));
                            }}
                          >
                            <MdOutlineModeEdit />
                          </Button>
                        )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="hidden md:flex w-32 flex-col gap-2 p-2 items-center">
                <div>
                  <p className="text-center text-gray-500 mb-2">Image</p>
                  <img
                    src={
                      dialogData?.visitor_image
                        ? imageBaseUrl + dialogData.visitor_image
                        : "/images/placeholder.png"
                    }
                    alt="Visitor"
                    className="w-28 h-28 rounded-md object-cover mb-4"
                  />
                </div>
                <div>
                  <p className="text-center text-gray-500 mb-2">Document</p>
                  {dialogData?.document_image ? (
                    dialogData.document_image.indexOf(".pdf") >= 0 ? (
                      <FaFilePdf className="w-28 h-28 text-red-600 mb-4" />
                    ) : (
                      <img
                        src={imageBaseUrl + dialogData.document_image}
                        alt="document"
                        className="w-28 h-28 rounded-md object-cover mb-4"
                      />
                    )
                  ) : (
                    <img
                      src={imgPlaceholder}
                      alt="placeholder"
                      className="w-28 h-28 rounded-md object-cover mb-4"
                    />
                  )}
                </div>
              </div>
            </div>

            {!dialogData?.out_time && inputs.outTime && (
              <div className="flex justify-center">
                <Button className="cursor-pointer" onClick={handleCheckOut}>
                  Check Out
                </Button>
              </div>
            )}

            {(user?.role == "approver" ||
              user?.role == "admin" ||
              user?.role == "superuser") &&
              dialogData?.status == "pending" && (
                <div className="flex w-full justify-center gap-8 items-center p-2">
                  <Button
                    className="cursor-pointer bg-green-600 hover:bg-green-700 w-24"
                    onClick={() => handleApprove(dialogData.id)}
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
      <Dialog
        open={open.rejectDialog}
        onOpenChange={(val) =>
          setOpen((prev) => ({ ...prev, exportDialog: val }))
        }
      >
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] md:w-full"
          onPointerDownOutside={() =>
            setOpen({ calendar: false, dialog: false, rejectDialog: false })
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
                  onClick={() => handleReject(dialogData.id)}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={open.exportDialog}
        onOpenChange={(val) =>
          setOpen((prev) => ({ ...prev, exportDialog: val }))
        }
      >
        <DialogContent
          className="w-[95vw] md:w-[300px]"
          onPointerDownOutside={() =>
            setOpen((prev) => ({ ...prev, exportDialog: false }))
          }
        >
          <DialogTitle>Select Export Type</DialogTitle>
          <DialogDescription>Choose format to export report</DialogDescription>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              className="bg-blue-700 hover:bg-blue-800 cursor-pointer"
              onClick={() => {
                setExportType("pdf");
                setOpen((prev) => ({
                  ...prev,
                  exportDialog: false,
                  exportDateDialog: true,
                }));
              }}
            >
              Export PDF
            </Button>

            <Button
              className="bg-green-800 hover:bg-green-900 cursor-pointer"
              onClick={() => {
                setExportType("csv");
                setOpen((prev) => ({
                  ...prev,
                  exportDialog: false,
                  exportDateDialog: true,
                }));
              }}
            >
              Export CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={open.exportDateDialog}
        onOpenChange={(val) =>
          setOpen((prev) => ({ ...prev, exportDateDialog: val }))
        }
      >
        <DialogContent
          className="w-[95vw] md:w-[400px]"
          onPointerDownOutside={() =>
            setOpen((prev) => ({ ...prev, exportDateDialog: false }))
          }
        >
          <DialogTitle>Export {exportType?.toUpperCase()} Report</DialogTitle>

          <DialogDescription>Select date range</DialogDescription>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-4 mt-2">
              {/* START DATE */}
              <div>
                <label className="text-sm">Start Date</label>
                <Popover
                  open={open.exportStartDate}
                  onOpenChange={(val) =>
                    setOpen((prev) => ({ ...prev, exportStartDate: val }))
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {exportDates.startDate
                        ? formatDate(exportDates.startDate)
                        : formatDate(new Date())}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportDates.startDate}
                      captionLayout="dropdown"
                      startMonth={new Date(2025, 0)}
                      endMonth={new Date()}
                      onSelect={(d) => {
                        setExportDates((prev) => ({
                          ...prev,
                          startDate: d,
                        }));
                        setOpen((prev) => ({
                          ...prev,
                          exportStartDate: false,
                        }));
                      }}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* END DATE */}
              <div>
                <label className="text-sm">End Date</label>
                <Popover
                  open={open.exportEndDate}
                  onOpenChange={(val) =>
                    setOpen((prev) => ({ ...prev, exportEndDate: val }))
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {exportDates.endDate
                        ? formatDate(exportDates.endDate)
                        : formatDate(new Date())}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportDates.endDate}
                      captionLayout="dropdown"
                      startMonth={new Date(2025, 0)}
                      endMonth={new Date()}
                      onSelect={(d) => {
                        setExportDates((prev) => ({
                          ...prev,
                          endDate: d,
                        }));
                        setOpen((prev) => ({
                          ...prev,
                          exportEndDate: false,
                        }));
                      }}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    exportDateDialog: false,
                  }))
                }
              >
                Cancel
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (exportType === "pdf") {
                    handleExportPDF();
                  } else {
                    handleExportCSV();
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewVisitors;
