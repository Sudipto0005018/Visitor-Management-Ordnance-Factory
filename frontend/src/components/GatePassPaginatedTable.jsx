import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ChevronRightIcon } from "lucide-react";
import axios from "axios";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import Spinner from "./Spinner";
import baseURL from "../utils/baseURL";
import Chip from "./Chip";
import toaster from "../utils/toaster";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { minifyRefNumber } from "../utils/helperFunctions";

const GatePassPaginatedTable = ({
  fetchData,
  tableData,
  filters,
  setFilters,
  role,
}) => {
  const breakpoint = useBreakpoint();
  const [columnVisibility, setColumnVisibility] = useState({});
  const visibilityConfig = {
    lg: {},
    md: { purpose: false, whome_to_meet: false },
    sm: {
      visitor_contact: false,
      purpose: false,
      whome_to_meet: false,
      approved_by: false,
    },
  };
  useEffect(() => {
    setColumnVisibility(visibilityConfig[breakpoint] || {});
  }, [breakpoint]);

  // const [inputs, setInputs] = useState({
  //   date: new Date(),
  //   search: "",
  // });

  // const [date, setDate] = useState();

  const [formattedDate, setFormattedDate] = useState({
    startDate: "",
    endDate: "",
  });
  // const [isOpen, setIsOpen] = useState({
  //   calendar: false,
  // });
  const [isOpen, setIsOpen] = useState({
    startDate: false,
    endDate: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [clickedId, setClickedId] = useState(undefined);
  const [open, setOpen] = useState({ confirm: false, data: false });
  const [input, setInput] = useState({
    rfid_num: "",
  });
  const [qr, setQr] = useState(false);
  const location = useLocation();
  const handleShowMore = (id) => {
    setClickedId(id);
    setOpen({ confirm: false, data: true });
  };
  useEffect(() => {
    if (location.pathname === "/issue-qr") {
      setQr(true);
    }
  }, [location.pathname]);
  const handleIssue = async (id) => {
    try {
      setIsLoading(true);
      if (open.data && input.rfid_num == "") {
        toaster("error", "Please enter RFID tag number");
        return;
      }
      const url = qr
        ? `${baseURL}/api/v1/visitor/issue-qr/${id}${
            input.rfid_num ? `?rfid_num=${input.rfid_num}` : ""
          }`
        : `${baseURL}/api/v1/visitor/issue-gate-pass/${id}${
            input.rfid_num ? `?rfid_num=${input.rfid_num}` : ""
          }`;
      const res = await axios.get(url, {
        withCredentials: true,
        // responseType: "blob",
        responseType: "arraybuffer",
        validateStatus: () => true,
      });
      const contentType = res.headers["content-type"];
      if (res.status === 200 && contentType.includes("application/pdf")) {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
          fetchData(tableData.currentPage);
        } else {
          toaster("error", "Popup blocked. Please allow popups for this site.");
        }
      } else {
        const text = new TextDecoder().decode(res.data);
        const json = JSON.parse(text);
        toaster("error", json.message);
      }
    } catch (error) {
      console.log(error);

      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to issue gate pass");
    } finally {
      setIsLoading(false);
      setClickedId(undefined);
      setInput({ rfid_num: "" });
    }
    setOpen({ confirm: false, data: false });
  };
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "ref_number",
        header: "Reference No",
      },
      {
        accessorKey: "visitor_contact",
        header: "Contact No",
      },
      {
        accessorKey: "purpose",
        header: "Purpose",
      },
      {
        accessorKey: "whome_to_meet",
        header: "Whom to Meet",
      },
      {
        accessorKey: "approved_by",
        header: "Approved By",
        cell: ({ row }) => {
          const approvedBy = row.original.approved_by || "--";
          return <span className="text-sm text-gray-700">{approvedBy}</span>;
        },
      },
      {
        header: `Gate pass status`,
        cell: ({ row }) => {
          const issued = row.original.gate_pass_issued;
          return (
            <Chip
              text={issued ? "Issued" : "Pending"}
              varient={issued ? "approved" : "pending"}
            />
          );
        },
      },
    ];
    // {
    //   header: "Generate Pass",
    //   cell: ({ row }) => {
    //     const issued = row.original.gate_pass_issued;
    //     return (
    //       <Button
    //         disabled={isLoading}
    //         variant="outline"
    //         size="icon"
    //         className="cursor-pointer shadow-md"
    //         onClick={() => {
    //           if (!issued) handleShowMore(row.original.id);
    //         }}
    //       >
    //         {isLoading && row.original.id == clickedId ? (
    //           <Spinner />
    //         ) : (
    //           <ChevronRightIcon />
    //         )}
    //       </Button>
    //     );
    //   },
    // },

    if (role === "user") {
      baseColumns.push({
        header: "Generate Pass",
        cell: ({ row }) => {
          const issued = row.original.gate_pass_issued;

          if (issued) {
            return <span className="text-gray-400">Already Issued</span>;
          }

          return (
            <Button
              disabled={isLoading}
              variant="outline"
              size="icon"
              className="cursor-pointer shadow-md"
              onClick={() => handleShowMore(row.original.id)}
            >
              {isLoading && row.original.id == clickedId ? (
                <Spinner />
              ) : (
                <ChevronRightIcon />
              )}
            </Button>
          );
        },
      });
    }
    return baseColumns;
  }, [role, tableData, clickedId, isLoading]);

  const table = useReactTable({
    data: tableData.items || [],
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  // useEffect(() => {
  //   if (filters.date) {
  //     const d = filters.date;
  //     const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
  //       d.getMonth() + 1,
  //     ).padStart(2, "0")}/${d.getFullYear()}`;
  //     setDate(formatted);
  //   }
  // }, [filters.date]);

  const formatDate = (d) => {
    if (!d) return "";
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    setFormattedDate({
      startDate: formatDate(filters.startDate),
      endDate: formatDate(filters.endDate),
    });
  }, [filters.startDate, filters.endDate]);

  return (
    <div className="space-y-4">
      <div className="w-full flex flex-col md:flex-row rounded-md gap-2 p-2">
        {/* <Input
          placeholder="Search by name, contact or ref no"
          value={inputs.search}
          onChange={(e) =>
            setInputs((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
        /> */}
        <Input
          className="mt-8 bg-white"
          placeholder="Search by name, contact or reference no."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
        />

        <div className="flex gap-2 w-full md:w-auto justify-between">
          {/* START DATE */}
          <div className="w-full md:w-auto">
            <p className="ms-2 mb-2">Select start date</p>
            <Popover
              open={isOpen.startDate}
              onOpenChange={(val) =>
                setIsOpen((prev) => ({ ...prev, startDate: val }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-36 justify-between font-normal"
                >
                  {filters.startDate ? formattedDate.startDate : "Start date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => {
                    setFilters((prev) => ({ ...prev, startDate: date }));
                    setIsOpen((prev) => ({ ...prev, startDate: false }));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* END DATE */}
          <div className="w-full md:w-auto">
            <p className="ms-2 mb-2">Select end date</p>
            <Popover
              open={isOpen.endDate}
              onOpenChange={(val) =>
                setIsOpen((prev) => ({ ...prev, endDate: val }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-36 justify-between font-normal"
                >
                  {filters.endDate ? formattedDate.endDate : "End date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => {
                    setFilters((prev) => ({ ...prev, endDate: date }));
                    setIsOpen((prev) => ({ ...prev, endDate: false }));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={() => fetchData(1)}
            className="shadow-md cursor-pointer mt-8"
          >
            Search
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                if (breakpoint === "sm") {
                  if (header.column.columnDef.header == "Gate pass status") {
                    header.column.columnDef.header = "Status";
                  } else if (header.column.columnDef.header == "Reference No") {
                    header.column.columnDef.header = "Ref No";
                  } else if (
                    header.column.columnDef.header == "Generate Pass"
                  ) {
                    header.column.columnDef.header = "Issue";
                  }
                }
                return (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const value = flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext(),
                );
                return (
                  <TableCell key={cell.id}>
                    <p className="text-xs md:text-base text-wrap">
                      {cell.column.columnDef.header == "Ref No" &&
                      breakpoint == "sm"
                        ? minifyRefNumber(cell.getValue("ref_number"))
                        : value}
                    </p>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tableData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            // variant="outline"
            className="w-20 cursor-pointer"
            size="sm"
            disabled={tableData.currentPage == 1}
            onClick={() => fetchData(tableData.currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {tableData.currentPage} of {tableData.totalPages}
          </span>
          <Button
            className="w-20 cursor-pointer"
            size="sm"
            onClick={() => fetchData(tableData.currentPage + 1)}
            disabled={tableData.currentPage >= tableData.totalPages}
          >
            Next
          </Button>
        </div>
      )}
      {tableData.totalItems == 0 && (
        <p className="text-center text-gray-600 mt-10">
          No approved visitor found.
        </p>
      )}
      {/* <Dialog open={open.confirm}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-md"
                    onPointerDownOutside={() => setOpen({ confirm: false, data: false })}
                >
                    <DialogTitle>Issue Visitor Card</DialogTitle>
                    <DialogDescription>Do you want to issue a visitor card?</DialogDescription>
                    <div className="flex items-center justify-end gap-5">
                        <Button
                            variant="ghost"
                            className="w-14 cursor-pointer"
                            onClick={() => {
                                setOpen({ confirm: false, data: false });
                                handleIssue(clickedId);
                            }}
                        >
                            No
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-14 cursor-pointer"
                            onClick={() => {
                                setOpen({ confirm: false, data: true });
                            }}
                        >
                            Yes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog> */}
      <Dialog open={open.data}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          onPointerDownOutside={() => setOpen({ confirm: false, data: false })}
        >
          <DialogTitle>Issue Visitor Card</DialogTitle>
          <DialogDescription>Please enter card number</DialogDescription>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={input.rfid_num}
              onChange={(e) => setInput({ ...input, rfid_num: e.target.value })}
              className="w-full"
              placeholder="Enter card number"
            />
          </div>
          <div className="flex items-center justify-end gap-5">
            <Button
              variant="ghost"
              className="w-14 cursor-pointer"
              onClick={() => {
                setOpen({ confirm: false, data: false });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="w-14 cursor-pointer"
              onClick={() => {
                handleIssue(clickedId);
              }}
            >
              Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GatePassPaginatedTable;
