import { useMemo, useEffect, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";
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
import { imageBaseUrl } from "../utils/baseURL";
import { useBreakpoint } from "../hooks/useBreakpoint";

const PaginatedTable = ({ isOpen, setIsOpen, setDialogData, fetchData, tableData }) => {
    const breakpoint = useBreakpoint();
    const [columnVisibility, setColumnVisibility] = useState({});
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
    const handleShowMore = (id) => {
        setIsOpen({
            ...isOpen,
            dialog: true,
        });
        const visitorData = tableData.data.find((visitor) => visitor.id === id);
        setDialogData(visitorData);
    };
    const columns = useMemo(
        () => [
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
            },
            {
                accessorKey: "visitor_contact",
                header: "Contact No",
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => (
                    <Chip varient={row.original.status} text={row.original.status} />
                ),
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
                accessorKey: "in_time",
                header: "Check In Time",
            },
            {
                accessorKey: "out_time",
                header: "Check Out Time",
            },
            {
                id: "actions",
                header: "Details",
                cell: ({ row }) => (
                    <Button
                        variant="outline"
                        size="icon"
                        className="cursor-pointer shadow-md"
                        onClick={() => handleShowMore(row.original.id)}
                    >
                        <ChevronRightIcon />
                    </Button>
                ),
            },
        ],
        [tableData]
    );

    const table = useReactTable({
        data: tableData.data,
        columns,
        state: { columnVisibility },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="p-4 space-y-4">
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
                        onClick={() => fetchData(tableData.currentPage - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {tableData.currentPage} of {tableData.totalPages}
                    </span>
                    <Button
                        className="w-20"
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
                    No visitors found for the selected date and search criteria.
                </p>
            )}
        </div>
    );
};

export default PaginatedTable;
