import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import Statustoggle from "../components/Statustoggle";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MdEdit } from "react-icons/md";
import { IoTrashSharp } from "react-icons/io5";

const EmployeeTable = ({
  tableData,
  fetchData,
  onEdit,
  onDelete,
  onToggle,
  role,
}) => {
  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "name", header: "Name" },
      // { accessorKey: "employee_id", header: "Employee ID" },
      { accessorKey: "designation", header: "Designation" },
      { accessorKey: "contact", header: "Contact" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "email", header: "Email" },
      {
        header: "Status",
        cell: ({ row }) => {
          const emp = row.original;

          return (
            <Statustoggle
              status={emp.status === 1 ? "active" : "inactive"}
              onToggle={() => onToggle(emp)}
            />
          );
        },
      },
    ];

    if (role === "admin" || role === "superuser") {
      baseColumns.push({
        header: "Actions",
        cell: ({ row }) => {
          const emp = row.original;

          return (
            <div className="flex gap-3">
              <MdEdit
                className="cursor-pointer text-blue-600"
                onClick={() => onEdit(emp)}
              />
            </div>
          );
        },
      });
    }
    return baseColumns;
  },[onEdit, onDelete, onToggle, role],
  );

  const table = useReactTable({
    data: tableData.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
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
        <div className="flex justify-center gap-4">
          <Button
            className="cursor-pointer"
            disabled={tableData.currentPage === 1}
            onClick={() => fetchData(tableData.currentPage - 1)}
          >
            Previous
          </Button>

          <span>
            Page {tableData.currentPage} of {tableData.totalPages}
          </span>

          <Button
            className="cursor-pointer"
            disabled={tableData.currentPage >= tableData.totalPages}
            onClick={() => fetchData(tableData.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {tableData.totalItems === 0 && (
        <p className="text-center text-gray-500">No employees found</p>
      )}
    </div>
  );
};

export default EmployeeTable;
