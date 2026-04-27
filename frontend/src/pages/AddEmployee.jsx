import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Statustoggle from "../components/Statustoggle";

import { Button } from "@/components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import EmployeeTable from "../components/EmployeeTable";
import baseURL from "../utils/baseURL";
import toaster from "../utils/toaster";
import { Context } from "../utils/Context";

const ViewEmployees = () => {
  const { config, user } = useContext(Context);
  const [open, setOpen] = useState(false);

  const [inputs, setInputs] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    designation: "",
    search: "",
    status: 1,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [tableData, setTableData] = useState({
    data: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // 🔥 FETCH EMPLOYEES
  const fetchData = async (page = 1) => {
    try {
      const res = await axios.get(
        `${baseURL}/api/v1/employee?page=${page}&size=8&search=${inputs.search || ""}`,
        { withCredentials: true },
      );

      const data = res.data.data;

      setTableData({
        data: data.items,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
      });
    } catch (error) {
      toaster("error", "Failed to fetch employees");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData(1);
    }, 400); // debounce

    return () => clearTimeout(delay);
  }, [inputs.search]);

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setInputs({
      name: emp.name,
      contact: emp.contact,
      email: emp.email,
      address: emp.address,
      designation: emp.designation,
      status: emp.status,
    });
    setEditOpen(true);
  };

  const handleStatusToggle = () => {
    setInputs((prev) => ({
      ...prev,
      status: prev.status === 1 ? 0 : 1,
    }));
  };

  const handleDelete = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${baseURL}/api/v1/employee/${employeeToDelete.id}`, {
        withCredentials: true,
      });

      toaster("success", "Employee deleted");

      setDeleteOpen(false);
      setEmployeeToDelete(null);

      fetchData();
    } catch (err) {
      toaster("error", err.response?.data?.message || "Delete failed");
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `${baseURL}/api/v1/employee/${selectedEmployee.id}`,
        inputs,
        { withCredentials: true },
      );

      toaster("success", "Employee updated");

      setEditOpen(false);
      setSelectedEmployee(null);

      fetchData();
    } catch (err) {
      toaster("error", err.response?.data?.message || "Update failed");
    }
  };
  // 🔥 HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // 🔥 ADD EMPLOYEE
  const handleSubmit = async () => {
    if (
      !inputs.name || !inputs.designation
    ) {
      toaster("error", "Fill all required fields");
      return;
    }

    try {
      await axios.post(`${baseURL}/api/v1/employee/add`, inputs, {
        withCredentials: true,
      });

      toaster("success", "Employee added");

      setOpen(false);

      setInputs({
        name: "",
        contact: "",
        email: "",
        address: "",
        designation: "",
        status: 1,
      });

      fetchData(); // 🔥 refresh table
    } catch (error) {
      toaster("error", error.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-md shadow">
      {/* 🔥 HEADER */}
      <div className="w-full flex flex-col md:flex-row bg-white rounded-md gap-2 p-2 shadow-md">
        <Input
          placeholder="Search by name, contact, email or designation"
          value={inputs.search}
          name="search"
          autoComplete={false}
          onChange={(e) =>
            setInputs((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
        />

        <Button
          onClick={() => fetchData(1)} // always start from page 1
          className="shadow-md cursor-pointer"
        >
          Search
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Employees</h2>
        {/* {user.role == "admin" && ( */}
        {(user.role === "admin" || user.role === "superuser") && (
          <Button
            className="cursor-pointer"
            onClick={() => {
              setInputs({
                name: "",
                contact: "",
                email: "",
                address: "",
                designation: "",
                status: 1,
              });
              setOpen(true);
            }}
          >
            + Add Employee
          </Button>
        )}
      </div>

      {/* 🔥 TABLE */}
      <EmployeeTable
        tableData={tableData}
        fetchData={fetchData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        role={user.role}
      />

      {/* 🔥 DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add Employee</DialogTitle>

          <div className="flex flex-col gap-3 mt-2">
            <label>
              Name<span className="text-red-500"> *</span>
            </label>
            <Input
              name="name"
              placeholder="Name"
              value={inputs.name}
              onChange={handleChange}
            />
            <label>
              Designation<span className="text-red-500"> *</span>
            </label>
            <Input
              name="designation"
              placeholder="Designation"
              value={inputs.designation}
              onChange={handleChange}
            />
            <label>Contact</label>
            <Input
              type="tel"
              name="contact"
              placeholder="Contact"
              value={inputs.contact}
              onChange={handleChange}
            />
            <label>Address</label>
            <Input
              name="address"
              placeholder="Address"
              value={inputs.address}
              onChange={handleChange}
            />
            <label>Email</label>
            <Input
              name="email"
              placeholder="Email"
              value={inputs.email}
              onChange={handleChange}
            />
            <label>Status</label>
            <Statustoggle
              status={inputs.status === 1 ? "active" : "inactive"}
              onToggle={handleStatusToggle}
            />

            <Button className="cursor-pointer" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editOpen}
        onOpenChange={(val) => {
          setEditOpen(val);

          if (!val) {
            setSelectedEmployee(null);
            setInputs({
              name: "",
              contact: "",
              email: "",
              address: "",
              designation: "",
              status: 1,
            });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>Edit Employee</DialogTitle>

          <div className="flex flex-col gap-3 mt-2">
            <label>
              Name<span className="text-red-500"> *</span>
            </label>
            <Input
              name="name"
              value={inputs.name}
              onChange={handleChange}
              placeholder="Name"
            />
            <label>
              Designation<span className="text-red-500"> *</span>
            </label>
            <Input
              name="designation"
              value={inputs.designation}
              onChange={handleChange}
              placeholder="Designation"
            />
            <label>Contact</label>
            <Input
              name="contact"
              value={inputs.contact}
              onChange={handleChange}
              placeholder="Contact"
            />
            <label>Address</label>
            <Input
              name="address"
              value={inputs.address}
              onChange={handleChange}
              placeholder="Address"
            />
            <label>Email</label>
            <Input
              name="email"
              value={inputs.email}
              onChange={handleChange}
              placeholder="Email"
            />
            <label>Status</label>
            <Statustoggle
              status={inputs.status === 1 ? "active" : "inactive"}
              onToggle={handleStatusToggle}
            />

            <Button className="cursor-pointer" onClick={handleUpdate}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Confirm Delete</DialogTitle>

          <div className="mt-3 text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{employeeToDelete?.name}</span>?
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setEmployeeToDelete(null);
              }}
            >
              Cancel
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewEmployees;
