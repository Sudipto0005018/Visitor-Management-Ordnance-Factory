import { useMemo, useEffect, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Chip from "./Chip";
import { ChevronRightIcon } from "lucide-react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { imageBaseUrl } from "../utils/baseURL";
import PreviewDialog from "./PreviewDialog";

const AppointmentPaginatedTable = ({ fetchData, tableData, isView, setOpen, setDialogData }) => {
    const breakpoint = useBreakpoint();
    const [columnVisibility, setColumnVisibility] = useState({});
    const visibilityConfig = {
        lg: {}, // show all columns
        md: { purpose: false, whome_to_meet: false, approved_at: false },
        sm: {
            ref_number: false,
            visitor_contact: false,
            purpose: false,
            whome_to_meet: false,
            approved_by: false,
            approved_at: false,
        },
    };
    useEffect(() => {
        setColumnVisibility(visibilityConfig[breakpoint] || {});
    }, [breakpoint]);
    useEffect(() => {
        if (isView) {
            fetchData(0, true);
        }
    }, []);
    const handleShowMore = (id) => {
        setOpen((prev) => {
            return { ...prev, dialog: true };
        });
        const visitorData = tableData.data.find((visitor) => visitor.id === id);
        setDialogData(visitorData);
    };
    const columns = useMemo(
      () => [
        {
          accessorKey: "Document",
          header: "Document",
          cell: ({ row }) => {
            return (
              <div className="w-16 h-16 overflow-hidden rounded-md flex items-center justify-center border-black">
                {row.original.document_image ? (
                  <PreviewDialog
                    imageName={row.original.document_image}
                    className="w-16 h-16"
                  />
                ) : (
                  <div className="w-full rounded-md h-full border overflow-hidden border-black">
                    <img
                      className="object-contain w-full h-full"
                      src={"/placeholder.svg"}
                      alt={"placeholder"}
                    />
                  </div>
                )}
              </div>
            );
          },
        },
        {
          accessorKey: "name",
          header: "Name",
        },
        {
          accessorKey: "ref_number",
          header: "Reference No.",
        },
       {
  accessorKey: "ref_date",
  header: "Reference Date",
  cell: ({ row }) => {
    const value = row.original.ref_date;

    if (!value) return "--";

    const date = new Date(value);

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return <p>{`${day}-${month}-${year}`}</p>;
  },
},
        {
          accessorKey: "visitor_contact",
          header: "Contact No.",
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => {
            return (
              <Chip varient={row.original.status} text={row.original.status} />
            );
          },
        },
        {
          accessorKey: "purpose",
          header: "Purpose",
        },
        {
          accessorKey: "whome_to_meet",
          header: "Whom to Meet",
          cell: ({ row }) => (
            <p className="capitalize">{row.original.whome_to_meet}</p>
          ),
        },
      {
  accessorKey: "appoint_time",
  header: "Appointment Date",
  cell: ({ row }) => {
    const value = row.original.appoint_time;

    if (!value) return "--";

    const date = new Date(value);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return <p>{`${day}-${month}-${year}`}</p>;
  },
},
        {
          accessorKey: "approved_by",
          header: "Action By",
          cell: ({ row }) => {
            const approvedBy = row.original.approved_by || "--";
            return <p className="text-sm text-gray-700">{approvedBy}</p>;
          },
        },
        {
          accessorKey: "approved_at",
          header: "Action At",
          cell: ({ row }) => {
            const approvedAt = row.original.approved_at || "--";
            return <p className="text-sm text-gray-700">{approvedAt}</p>;
          },
        },
        {
          accessorKey: "created_at",
          header: "More",
          cell: ({ row }) => {
            return (
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer shadow-md"
                onClick={() => handleShowMore(row.original.id)}
              >
                <ChevronRightIcon />
              </Button>
            );
          },
        },
      ],
      [tableData],
    );

    const table = useReactTable({
        data: tableData.data || [],
        columns,
        state: { columnVisibility },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-4 space-y-4">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
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
                        onClick={() => fetchData(tableData.currentPage - 1, isView)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {tableData.currentPage} of {tableData.totalPages}
                    </span>
                    <Button
                        className="w-20"
                        size="sm"
                        onClick={() => fetchData(tableData.currentPage + 1, isView)}
                        disabled={tableData.currentPage >= tableData.totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
            {tableData.totalItems == 0 && (
                <p className="text-center text-gray-600 mt-10">No appointment found.</p>
            )}
        </div>
    );
};

export default AppointmentPaginatedTable;
