// import { useMemo, useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router";
// import { ChevronRightIcon } from "lucide-react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getPaginationRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { imageBaseUrl } from "../utils/baseURL";
// import { useBreakpoint } from "../hooks/useBreakpoint";
// import { getDateTime } from "../utils/helperFunctions";
// import { Context } from "../utils/Context";

// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import StepProgressBar from "../components/StepProgressBar";
// import imgPlaceholder from "../assets/img_placeholder.jpg";

// const HistoryTable = ({ fetchData, tableData }) => {
//   const { user } = useContext(Context);
//   const breakpoint = useBreakpoint();
//   const navigate = useNavigate();
//   const [columnVisibility, setColumnVisibility] = useState({});

//   const [open, setOpen] = useState({
//     dialog: false,
//     checkout: false,
//     rejectDialog: false,
//   });
//   const [inputs, setInputs] = useState({
//     // date: new Date(),
//     startDate: new Date(),
//     endDate: new Date(),
//     search: "",
//     comment: "",
//     outTime: "",
//     out_time: new Date(),
//   });

//   const [dialogData, setDialogData] = useState({});
//   const visibilityConfig = {
//     lg: {},
//     md: { purpose: false, whome_to_meet: false, out_time: false },
//     sm: {
//       visitor_contact: false,
//       purpose: false,
//       whome_to_meet: false,
//       out_time: false,
//       in_time: false,
//     },
//   };
//   useEffect(() => {
//     setColumnVisibility(visibilityConfig[breakpoint] || {});
//   }, [breakpoint]);

//   useEffect(() => {
//     fetchData();
//   }, []);
//   const handleRedirect = (id, className) => {
//     const visitorData = tableData.items.find((visitor) => visitor.id === id);
//     if (className !== "text-red-600") {
//       navigate("/add-new-visitor", {
//         state: {
//           visitor: {
//             name: visitorData.name,
//             email: visitorData.email,
//             visitor_contact: visitorData.visitor_contact,
//             visitor_address: visitorData.visitor_address,
//           },
//         },
//       });
//     } else {
//       navigate("/add-new-visitor");
//     }
//   };

//   const handleOpenDialog = (rowData) => {
//     setDialogData(rowData);
//     setOpen((prev) => ({
//       ...prev,
//       dialog: true,
//     }));
//   };
//   const columns = useMemo(() => {
//     const dat = new Date();
//     dat.setDate(dat.getDate() - 30);
//     const getClassName = (row) =>
//       new Date(row.original.in_time).getTime() < dat.getTime()
//         ? "text-red-600"
//         : "text-black";

//     return [
//       {
//         header: "Image",
//         accessorKey: "visitor_image",
//         cell: ({ row }) => (
//           <img
//             src={imageBaseUrl + row.original.visitor_image}
//             alt="Visitor"
//             className="w-12 h-12 rounded-sm"
//           />
//         ),
//       },
//       {
//         accessorKey: "name",
//         header: "Name",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>{row.original.name}</p>
//         ),
//       },
//       {
//         accessorKey: "ref_number",
//         header: "Reference No.",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>{row.original.ref_number}</p>
//         ),
//       },
//       {
//         accessorKey: "visitor_contact",
//         header: "Contact No",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>{row.original.visitor_contact}</p>
//         ),
//       },
//       {
//         accessorKey: "purpose",
//         header: "Purpose",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>{row.original.purpose}</p>
//         ),
//       },
//       {
//         accessorKey: "whome_to_meet",
//         header: "Whom to Meet",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>{row.original.whome_to_meet}</p>
//         ),
//       },
//       {
//         accessorKey: "in_time",
//         header: "Check In Time",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>
//             {getDateTime(row.original.in_time)}
//           </p>
//         ),
//       },
//       {
//         accessorKey: "out_time",
//         header: "Check Out Time",
//         cell: ({ row }) => (
//           <p className={getClassName(row)}>
//             {getDateTime(row.original.out_time)}
//           </p>
//         ),
//       },
//       {
//         id: "actions",
//         header: "Details",
//         cell: ({ row }) => (
//           <Button
//             variant="outline"
//             size="icon"
//             className="cursor-pointer shadow-md"
//             // onClick={() => handleRedirect(row.original.id, getClassName(row))}
//             onClick={() => handleOpenDialog(row.original)}
//           >
//             <ChevronRightIcon />
//           </Button>
//         ),
//       },
//     ];
//   }, [tableData]);

//   const table = useReactTable({
//     data: tableData.items,
//     columns,
//     state: { columnVisibility },
//     onColumnVisibilityChange: setColumnVisibility,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//   });

//   return (
//     <div className="p-4 space-y-4">
//       <div className="flex flex-col md:flex-row gap-3 mb-4">
//         {/* 🔍 Search */}
//         <Input
//           placeholder="Search by Name, Ref No, Contact, Whom to meet"
//           value={inputs.search}
//           onChange={(e) =>
//             setInputs((prev) => ({ ...prev, search: e.target.value }))
//           }
//         />

//         {/* 📅 Start Date */}
//         <Input
//           type="date"
//           value={inputs.startDate.toISOString().split("T")[0]}
//           onChange={(e) =>
//             setInputs((prev) => ({
//               ...prev,
//               startDate: new Date(e.target.value),
//             }))
//           }
//         />

//         {/* 📅 End Date */}
//         <Input
//           type="date"
//           value={inputs.endDate.toISOString().split("T")[0]}
//           onChange={(e) =>
//             setInputs((prev) => ({
//               ...prev,
//               endDate: new Date(e.target.value),
//             }))
//           }
//         />

//         {/* 🔎 Search Button */}
//         <Button
//           onClick={() =>
//             fetchData(1, {
//               search: inputs.search,
//               startDate: inputs.startDate,
//               endDate: inputs.endDate,
//             })
//           }
//         >
//           Search
//         </Button>

//         {/* 🔄 Reset */}
//         <Button
//           variant="outline"
//           onClick={() => {
//             const reset = {
//               search: "",
//               startDate: new Date(),
//               endDate: new Date(),
//             };
//             setInputs((prev) => ({ ...prev, ...reset }));
//             fetchData(1, reset);
//           }}
//         >
//           Reset
//         </Button>
//       </div>
//       <Table>
//         <TableHeader>
//           {table.getHeaderGroups().map((headerGroup) => (
//             <TableRow key={headerGroup.id}>
//               {headerGroup.headers.map((header) => (
//                 <TableHead
//                   key={header.id}
//                   className={header.id == "visitor_image" ? "w-24" : ""}
//                 >
//                   {flexRender(
//                     header.column.columnDef.header,
//                     header.getContext(),
//                   )}
//                 </TableHead>
//               ))}
//             </TableRow>
//           ))}
//         </TableHeader>
//         <TableBody>
//           {table.getRowModel().rows.map((row) => (
//             <TableRow key={row.id}>
//               {row.getVisibleCells().map((cell) => (
//                 <TableCell key={cell.id}>
//                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                 </TableCell>
//               ))}
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>

//       {tableData.totalPages > 1 && (
//         <div className="flex items-center justify-center gap-4">
//           <Button
//             // variant="outline"
//             className="w-20"
//             size="sm"
//             disabled={tableData.currentPage == 1}
//             onClick={() => {
//               fetchData(tableData.currentPage - 1, {
//                 startDate: inputs.startDate,
//                 endDate: inputs.endDate,
//                 search: inputs.search,
//               });
//             }}
//           >
//             Previous
//           </Button>
//           <span className="text-sm">
//             Page {tableData.currentPage} of {tableData.totalPages}
//           </span>
//           <Button
//             className="w-20"
//             size="sm"
//             onClick={() => {
//               fetchData(tableData.currentPage + 1, {
//                 startDate: inputs.startDate,
//                 endDate: inputs.endDate,
//                 search: inputs.search,
//               });
//             }}
//             disabled={tableData.currentPage >= tableData.totalPages}
//           >
//             Next
//           </Button>
//         </div>
//       )}
//       {tableData.totalItems == 0 && (
//         <p className="text-center text-gray-600 mt-10">
//           No visitors found for the selected date and search criteria.
//         </p>
//       )}

//       {/* <Dialog open={open.dialog}> */}
//       <Dialog
//         open={open.dialog}
//         onOpenChange={(val) => setOpen((prev) => ({ ...prev, dialog: val }))}
//       >
//         <DialogTitle />
//         <DialogDescription />
//         <DialogContent
//           showCloseButton={false}
//           className="w-[95vw] md:w-[600px] backdrop:blur-md bg-[#e4e5e6] max-h-full "
//           onPointerDownOutside={() =>
//             setOpen({ calendar: false, dialog: false, rejectDialog: false })
//           }
//           unbounded={true}
//         >
//           <div className="w-full flex flex-col gap-4">
//             <div className="bg-white p-2 rounded-md shadow-md">
//               <StepProgressBar
//                 currentStep={
//                   dialogData?.gate_pass_issued
//                     ? 5
//                     : dialogData?.status == "pending"
//                       ? 2
//                       : dialogData?.status == "rejected"
//                         ? 4
//                         : 4
//                 }
//                 rejected={dialogData?.status == "rejected"}
//               />
//             </div>
//             <div className="flex flex-col md:flex-row bg-white p-2 rounded-md shadow-md h-[67vh] overflow-scroll hide-scrollbar">
//               <div className="md:hidden w-full flex flex-row justify-around gap-2 p-2 items-center">
//                 <div>
//                   <p className="text-center text-gray-500 mb-2">Image</p>
//                   <img
//                     src={
//                       dialogData?.visitor_image
//                         ? imageBaseUrl + dialogData.visitor_image
//                         : "/images/placeholder.png"
//                     }
//                     alt="Visitor"
//                     className="w-28 h-28 rounded-md object-cover mb-4"
//                   />
//                 </div>
//                 <div>
//                   <p className="text-center text-gray-500 mb-2">Document</p>
//                   <img
//                     src={
//                       dialogData?.document_image
//                         ? imageBaseUrl + dialogData.document_image
//                         : imgPlaceholder
//                     }
//                     alt="document"
//                     className="w-28 h-28 rounded-md object-cover mb-4"
//                   />
//                 </div>
//               </div>
//               <table className="h-full flex-1 p-2 details-table md:border-r">
//                 <tbody>
//                   <tr>
//                     <td className="text-gray-600 m-0">Name:</td>
//                     <td className="text-black m-0">{dialogData?.name}</td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Ref No:</td>
//                     <td className="text-black m-0">{dialogData?.ref_number}</td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Card No:</td>
//                     <td className="text-black m-0">
//                       {dialogData?.rfid_num || "Not issued"}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Contact No:</td>
//                     <td className="text-black m-0 flex items-center gap-1">
//                       {dialogData?.visitor_contact}
//                       {dialogData?.mobile_verified == 1 && (
//                         <FaRegCheckCircle className="text-green-600" />
//                       )}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Email:</td>
//                     <td className="text-black m-0 flex items-center gap-1">
//                       {dialogData?.email || "Not mentioned"}
//                       {dialogData?.email_verified == 1 && (
//                         <FaRegCheckCircle className="text-green-600" />
//                       )}
//                     </td>
//                   </tr>
//                   {/* <tr>
//                     <td className="text-gray-600 m-0">Registration type:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.registation_type}
//                     </td>
//                   </tr> */}
//                   <tr>
//                     <td className="text-gray-600 m-0">Purpose:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.purpose}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Whom to meet:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.whome_to_meet}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Category:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.Visitor_category}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Address:</td>
//                     <td className="text-black m-0">
//                       {dialogData?.visitor_address}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Unit Name:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.unit_name || "Not mentioned"}
//                     </td>
//                   </tr>

//                   <tr>
//                     <td className="text-gray-600 m-0">City:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.city || "Not mentioned"}
//                     </td>
//                   </tr>

//                   <tr>
//                     <td className="text-gray-600 m-0">Designation:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.designation || "Not mentioned"}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Status:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.status}
//                     </td>
//                   </tr>
//                   {dialogData?.status != "pending" && (
//                     <tr>
//                       <td className="text-gray-600 m-0">
//                         {dialogData?.status == "rejected"
//                           ? "Rejected by:"
//                           : "Approved by:"}
//                       </td>
//                       <td className="text-black m-0">
//                         {dialogData?.approver_name || "Not done yet"}
//                       </td>
//                     </tr>
//                   )}
//                   <tr>
//                     <td className="text-gray-600 m-0">Check in:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.in_time}
//                     </td>
//                   </tr>
//                   {dialogData?.status == "approved" && (
//                     <tr>
//                       <td className="text-gray-600 m-0">Gatepass:</td>
//                       <td className="text-black m-0 capitalize">
//                         {dialogData?.gate_pass_time || "Not issued yet"}
//                       </td>
//                     </tr>
//                   )}
//                   <tr>
//                     <td className="text-gray-600 m-0">Vehicle no:</td>
//                     <td className="text-black m-0">
//                       {dialogData?.vehicle_number || "Not mentioned"}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Document type:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.document_type || "Not mentioned"}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Document no:</td>
//                     <td className="text-black m-0">
//                       {dialogData?.document_number || "Not mentioned"}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Register by:</td>
//                     <td className="text-black m-0 capitalize">
//                       {dialogData?.creator_name}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="text-gray-600 m-0">Check out:</td>
//                     <td className="text-black m-0 flex items-center gap-2">
//                       {dialogData?.out_time ? (
//                         dialogData?.out_time
//                       ) : open.checkout ? (
//                         <div className="flex items-center">
//                           <Input
//                             type="time"
//                             className="rounded-r-none border-r-0"
//                             value={inputs.outTime}
//                             onChange={(e) => {
//                               const t = e.target.value.split(":");
//                               const d = new Date();
//                               d.setHours(parseInt(t[0]), parseInt(t[1]), 0, 0);
//                               setInputs((prev) => ({
//                                 ...prev,
//                                 outTime: e.target.value,
//                                 out_time: d,
//                               }));
//                             }}
//                           />
//                           <Button
//                             variant="outline"
//                             className="rounded-l-none px-2 cursor-pointer"
//                             onClick={() => {
//                               const d = new Date();
//                               setInputs((prev) => ({
//                                 ...prev,
//                                 outTime: d.getHours() + ":" + d.getMinutes(),
//                                 out_time: d,
//                               }));
//                             }}
//                           >
//                             Now
//                           </Button>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="ms-2 text-red-600 hover:bg-red-100 hover:text-red-700 cursor-pointer"
//                             onClick={() => {
//                               setOpen((prev) => ({
//                                 ...prev,
//                                 checkout: false,
//                               }));
//                               setInputs((prev) => ({
//                                 ...prev,
//                                 outTime: "",
//                               }));
//                             }}
//                           >
//                             <MdOutlineBlock />
//                           </Button>
//                         </div>
//                       ) : (
//                         "Not checked-out yet"
//                       )}
//                       {!dialogData?.out_time &&
//                         !open.checkout &&
//                         !!dialogData.gate_pass_issued && (
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-600"
//                             onClick={() => {
//                               setOpen((prev) => ({
//                                 ...prev,
//                                 checkout: true,
//                               }));
//                             }}
//                           >
//                             <MdOutlineModeEdit />
//                           </Button>
//                         )}
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//               <div className="hidden md:flex w-32 flex-col gap-2 p-2 items-center">
//                 <div>
//                   <p className="text-center text-gray-500 mb-2">Image</p>
//                   <img
//                     src={
//                       dialogData?.visitor_image
//                         ? imageBaseUrl + dialogData.visitor_image
//                         : "/images/placeholder.png"
//                     }
//                     alt="Visitor"
//                     className="w-28 h-28 rounded-md object-cover mb-4"
//                   />
//                 </div>
//                 <div>
//                   <p className="text-center text-gray-500 mb-2">Document</p>
//                   <img
//                     src={
//                       dialogData?.document_image
//                         ? imageBaseUrl + dialogData.document_image
//                         : imgPlaceholder
//                     }
//                     alt="document"
//                     className="w-28 h-28 rounded-md object-cover mb-4"
//                   />
//                 </div>
//               </div>
//             </div>

//             {!dialogData?.out_time && inputs.outTime && (
//               <div className="flex justify-center">
//                 <Button className="cursor-pointer" onClick={handleCheckOut}>
//                   Check Out
//                 </Button>
//               </div>
//             )}

//             {(user?.role == "approver" ||
//               user?.role == "admin" ||
//               user?.role == "superuser") &&
//               dialogData?.status == "pending" && (
//                 <div className="flex w-full justify-center gap-8 items-center p-2">
//                   <Button
//                     className="cursor-pointer bg-green-600 hover:bg-green-700 w-24"
//                     onClick={() => handleApprove(dialogData.id)}
//                   >
//                     Approve
//                   </Button>
//                   <Button
//                     className="cursor-pointer bg-red-600 hover:bg-red-700 w-24"
//                     onClick={() =>
//                       setOpen((prev) => ({
//                         ...prev,
//                         dialog: false,
//                         rejectDialog: true,
//                       }))
//                     }
//                   >
//                     Reject
//                   </Button>
//                 </div>
//               )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default HistoryTable;

import { useMemo, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { imageBaseUrl } from "../utils/baseURL";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { getDateTime } from "../utils/helperFunctions";
import { Context } from "../utils/Context";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StepProgressBar from "../components/StepProgressBar";
import imgPlaceholder from "../assets/img_placeholder.jpg";

import { FaFilePdf } from "react-icons/fa";

const HistoryTable = ({ fetchData, tableData }) => {
  const { user } = useContext(Context);
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const [columnVisibility, setColumnVisibility] = useState({});

  const [open, setOpen] = useState({
    dialog: false,
    checkout: false,
    rejectDialog: false,
    startDate: false,
    endDate: false,
  });

  const [date, setDate] = useState({
    startDate: "",
    endDate: "",
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

  const formatDate = (d) => {
    if (!d) return "";
    return d.toLocaleDateString("en-GB");
  };

  const [dialogData, setDialogData] = useState({});
  const visibilityConfig = {
    lg: {},
    md: { purpose: false, whome_to_meet: false, out_time: false },
    sm: {
      visitor_contact: false,
      purpose: false,
      whome_to_meet: false,
      out_time: false,
      in_time: false,
    },
  };
  useEffect(() => {
    setColumnVisibility(visibilityConfig[breakpoint] || {});
  }, [breakpoint]);

  useEffect(() => {
    fetchData();
  }, []);
  const handleRedirect = (id, className) => {
    const visitorData = tableData.items.find((visitor) => visitor.id === id);
    if (className !== "text-red-600") {
      navigate("/add-new-visitor", {
        state: {
          visitor: {
            name: visitorData.name,
            email: visitorData.email,
            visitor_contact: visitorData.visitor_contact,
            visitor_address: visitorData.visitor_address,
          },
        },
      });
    } else {
      navigate("/add-new-visitor");
    }
  };

  const handleOpenDialog = (rowData) => {
    setDialogData(rowData);
    setOpen((prev) => ({
      ...prev,
      dialog: true,
    }));
  };
  const columns = useMemo(() => {
    const dat = new Date();
    dat.setDate(dat.getDate() - 30);
    const getClassName = (row) =>
      new Date(row.original.in_time).getTime() < dat.getTime()
        ? "text-red-600"
        : "text-black";

    return [
      {
        header: "Image",
        accessorKey: "visitor_image",
        cell: ({ row }) => (
          <img
            src={imageBaseUrl + row.original.visitor_image}
            alt="Visitor"
            className="w-12 h-12 rounded-sm"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <p className={getClassName(row)}>{row.original.name}</p>
        ),
      },
      {
        accessorKey: "ref_number",
        header: "Reference No.",
        cell: ({ row }) => (
          <p className={getClassName(row)}>{row.original.ref_number}</p>
        ),
      },
      {
        accessorKey: "visitor_contact",
        header: "Contact No",
        cell: ({ row }) => (
          <p className={getClassName(row)}>{row.original.visitor_contact}</p>
        ),
      },
      {
        accessorKey: "purpose",
        header: "Purpose",
        cell: ({ row }) => (
          <p className={getClassName(row)}>{row.original.purpose}</p>
        ),
      },
      {
        accessorKey: "whome_to_meet",
        header: "Whom to Meet",
        cell: ({ row }) => (
          <p className={getClassName(row)}>{row.original.whome_to_meet}</p>
        ),
      },
      {
        accessorKey: "in_time",
        header: "Check In Time",
        cell: ({ row }) => (
          <p className={getClassName(row)}>
            {getDateTime(row.original.in_time)}
          </p>
        ),
      },
      {
        accessorKey: "out_time",
        header: "Check Out Time",
        cell: ({ row }) => (
          <p className={getClassName(row)}>
            {getDateTime(row.original.out_time)}
          </p>
        ),
      },
      {
        id: "actions",
        header: "Details",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer shadow-md"
            // onClick={() => handleRedirect(row.original.id, getClassName(row))}
            onClick={() => {
              handleOpenDialog(row.original);
            }}
          >
            <ChevronRightIcon />
          </Button>
        ),
      },
    ];
  }, [tableData]);

  const table = useReactTable({
    data: tableData.items,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* 🔍 Search */}
        <Input
          className="mt-8"
          placeholder="Search by Name, Ref No, Contact, Whom to meet"
          value={inputs.search}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, search: e.target.value }))
          }
        />

        <div className="flex gap-4 flex-col md:flex-row">
          {/* START DATE */}
          <div className="w-full md:w-auto">
            <p className="ms-2 mb-2">Select start date</p>
            <Popover
              open={open.startDate}
              onOpenChange={(val) =>
                setOpen((prev) => ({ ...prev, startDate: val }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-44 justify-between font-normal"
                >
                  {inputs.startDate
                    ? inputs.startDate.toLocaleDateString("en-GB")
                    : new Date().toLocaleDateString("en-GB")}
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
              onOpenChange={(val) =>
                setOpen((prev) => ({ ...prev, endDate: val }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-44 justify-between font-normal"
                >
                  {inputs.endDate
                    ? inputs.endDate.toLocaleDateString("en-GB")
                    : new Date().toLocaleDateString("en-GB")}
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

        {/* 🔎 Search Button */}
        <Button
          className="mt-8"
          onClick={() =>
            fetchData(1, {
              search: inputs.search,
              startDate: inputs.startDate,
              endDate: inputs.endDate,
            })
          }
        >
          Search
        </Button>

        {/* 🔄 Reset */}
        <Button
          className="mt-8"
          variant="outline"
          onClick={() => {
            const reset = {
              search: "",
              startDate: new Date(),
              endDate: new Date(),
            };
            setInputs((prev) => ({ ...prev, ...reset }));
            fetchData(1, reset);
          }}
        >
          Reset
        </Button>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={header.id == "visitor_image" ? "w-24" : ""}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tableData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            // variant="outline"
            className="w-20"
            size="sm"
            disabled={tableData.currentPage == 1}
            onClick={() => {
              fetchData(tableData.currentPage - 1, {
                startDate: inputs.startDate,
                endDate: inputs.endDate,
                search: inputs.search,
              });
            }}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {tableData.currentPage} of {tableData.totalPages}
          </span>
          <Button
            className="w-20"
            size="sm"
            onClick={() => {
              fetchData(tableData.currentPage + 1, {
                startDate: inputs.startDate,
                endDate: inputs.endDate,
                search: inputs.search,
              });
            }}
            disabled={tableData.currentPage >= tableData.totalPages}
          >
            Next
          </Button>
        </div>
      )}
      {tableData.totalItems == 0 && (
        <p className="text-center text-gray-600 mt-10">
          No visitors found for the selected date and search criteria.
        </p>
      )}

      {/* <Dialog open={open.dialog}> */}
      <Dialog
        open={open.dialog}
        onOpenChange={(val) => setOpen((prev) => ({ ...prev, dialog: val }))}
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
                      : dialogData?.status == "rejected"
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
                                outTime: d.getHours() + ":" + d.getMinutes(),
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
    </div>
  );
};

export default HistoryTable;
