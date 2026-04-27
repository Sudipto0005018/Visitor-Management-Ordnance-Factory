import { useState, useEffect, useContext } from "react";
import { MdModeEditOutline } from "react-icons/md";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import SpinnerButton from "../components/ui/spinner-button";
import axios from "axios";
import Statustoggle from "../components/Statustoggle";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

import PaginationTable from "../components/PaginationTable";
import Spinner from "../components/Spinner";
import toaster from "../utils/toaster";
import { Context } from "../utils/Context";
import baseUrl from "../utils/baseURL";

const Users = () => {
  const { config, user } = useContext(Context);

  const columns = [
    { key: "name", header: "Name" },
    { key: "user_name", header: "Username" },
    { key: "mobile", header: "Mobile" },
    { key: "role", header: "Role" },
    { key: "status", header: "Status" },
    ...(user.role == "superuser" ? [{ key: "edit", header: "Edit" }] : []),
  ];

  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [fetchedData, setFetchedData] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });

  const [inputs, setInputs] = useState({
    name: "",
    user_name: "",
    mobile: "",
    password: "",
    role: "user",
    status: 1,
    tenantId: user?.tenant_id,
    search: "",
  });

  const [selectedRow, setSelectedRow] = useState({});
  const [isOpen, setIsOpen] = useState({ add: false, edit: false });
  const [isLoading, setIsLoading] = useState({ table: false, search: false });

  //FETCH USERS
  const fetchUsers = async (page = currentPage) => {
    setIsLoading((prev) => ({ ...prev, table: true }));

    try {
      const res = await axios.get(baseUrl + "/api/v1/user/list", {
        params: {
          page,
          size: 8,
          search: inputs.search || "",
        },
        withCredentials: true,
      });
      console.log(res);

      if (res.data?.success) {
        setFetchedData(res.data.data);
      }
    } catch (error) {
      toaster("error", "Failed to fetch users");
      console.log(error);
    } finally {
      setIsLoading((prev) => ({ ...prev, table: false }));
    }
  };

  // SEARCH
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1);
  };

  // REFRESH
  const handleRefresh = () => {
    setInputs((prev) => ({ ...prev, search: "" }));
    setCurrentPage(1);
    fetchUsers(1);
  };

  // ADD
  const handleAdd = async () => {
    try {
      const res = await axios.post(
        baseUrl + "/api/v1/user/signup",
        {
          ...inputs,
          tenantId: user?.tenant_id,
        },
        { withCredentials: true },
      );

      if (res.data?.success) {
        toaster("success", "User added");
        fetchUsers();
        setIsOpen((p) => ({ ...p, add: false }));
      }
    } catch (err) {
      toaster("error", err?.response?.data?.message || "Add failed");
    }
  };

  // EDIT
  const handleEdit = (row) => {
    setSelectedRow({ ...row });
    setIsOpen((p) => ({ ...p, edit: true }));
  };

  // UPDATE
  const handleUpdate = async () => {
    try {
      const res = await axios.post(
        baseUrl + `/api/v1/user/update/${selectedRow.id}`,
        selectedRow,
        { withCredentials: true },
      );

      if (res.data?.success) {
        toaster("success", "Updated");
        fetchUsers();
        setIsOpen((p) => ({ ...p, edit: false }));
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Update failed";

      toaster("error", errMsg);
    }
  };

  // EFFECT
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // MAP DATA
  useEffect(() => {
    const roleMap = {
      admin: "Admin",
      user: "User",
      superuser: "Super Admin",
    };

    const mapped = (fetchedData?.items || []).map((row) => ({
      ...row,
      role: roleMap[row.role] || row.role,
      status: (
        <Statustoggle
          status={row.status === 1 ? "Active" : "Inactive"}
          onToggle={async () => {
            if (user.role != "superuser") return;
            try {
              const updatedStatus = row.status === 1 ? 0 : 1;

              await axios.post(
                baseUrl + `/api/v1/user/update/${row.id}`,
                {
                  ...row,
                  status: updatedStatus,
                },
                { withCredentials: true },
              );

              toaster("success", "Status updated");
              fetchUsers(currentPage); // refresh table
            } catch (err) {
              toaster("error", "Failed to update status");
            }
          }}
        />
      ),
      edit: (
        <Button variant="ghost" onClick={() => handleEdit(row)}>
          <MdModeEditOutline />
        </Button>
      ),
    }));

    setTableData(mapped);
  }, [fetchedData]);

  return (
    <div className="h-full px-2">
      {/* SEARCH */}
      <div className="flex gap-3 mb-4">
        <Input
          value={inputs.search}
          placeholder="Search by name, username or mobile"
          onChange={(e) => setInputs((p) => ({ ...p, search: e.target.value }))}
        />

        <SpinnerButton onClick={handleSearch} loading={isLoading.search}>
          <FaMagnifyingGlass /> Search
        </SpinnerButton>

        <Button onClick={handleRefresh}>
          <IoMdRefresh /> Reset
        </Button>

        {user.role == "superuser" && (
          <Button onClick={() => setIsOpen({ ...isOpen, add: true })}>
            <FaPlus /> Add
          </Button>
        )}
      </div>

      {/* TABLE */}
      {isLoading.table ? (
        <Spinner />
      ) : (
        <PaginationTable
          data={tableData}
          columns={columns}
          currentPage={fetchedData?.currentPage || 1}
          pageSize={fetchedData?.items?.length || 0}
          totalPages={fetchedData?.totalPages || 1}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ADD */}
      <Dialog
        open={isOpen.add}
        onOpenChange={(val) => setIsOpen((p) => ({ ...p, add: val }))}
      >
        <DialogContent>
          <DialogTitle>Add User</DialogTitle>

          <label>
            Name<span className="text-red-500"> *</span>
          </label>
          <Input
            placeholder="Name"
            onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
          />

          <label>
            Username<span className="text-red-500"> *</span>
          </label>
          <Input
            placeholder="Username"
            onChange={(e) =>
              setInputs({ ...inputs, user_name: e.target.value })
            }
          />

          <label>Mobile</label>
          <Input
            placeholder="Mobile"
            onChange={(e) => setInputs({ ...inputs, mobile: e.target.value })}
          />

          <label>
            Password<span className="text-red-500"> *</span>
          </label>
          <Input
            placeholder="Password"
            type="password"
            onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
          />

          <label>
            Role<span className="text-red-500"> *</span>
          </label>
          <select
            value={inputs.role}
            onChange={(e) => setInputs({ ...inputs, role: e.target.value })}
          >
            <option value="superuser">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <label>
            Status<span className="text-red-500"> *</span>
          </label>
          <Statustoggle
            status={inputs.status === 1 ? "Active" : "Inactive"}
            onToggle={() =>
              setInputs((prev) => ({
                ...prev,
                status: prev.status === 1 ? 0 : 1,
              }))
            }
          />

          <DialogFooter>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog
        open={isOpen.edit}
        onOpenChange={(val) => setIsOpen((p) => ({ ...p, edit: val }))}
      >
        <DialogContent>
          <DialogTitle>Edit User</DialogTitle>

          <label>
            Name<span className="text-red-500"> *</span>
          </label>
          <Input
            value={selectedRow.name || ""}
            onChange={(e) =>
              setSelectedRow({ ...selectedRow, name: e.target.value })
            }
          />

          <label>
            Username<span className="text-red-500"> *</span>
          </label>
          <Input
            value={selectedRow.user_name || ""}
            onChange={(e) =>
              setSelectedRow({ ...selectedRow, user_name: e.target.value })
            }
          />

          <label>Mobile</label>
          <Input
            value={selectedRow.mobile || ""}
            onChange={(e) =>
              setSelectedRow({ ...selectedRow, mobile: e.target.value })
            }
          />

          <label>
            Password<span className="text-red-500"> *</span>
          </label>
          <Input
            value={selectedRow.password || ""}
            onChange={(e) =>
              setSelectedRow({ ...selectedRow, password: e.target.value })
            }
          />

          <label>
            Role<span className="text-red-500"> *</span>
          </label>
          <select
            value={selectedRow.role || "user"}
            onChange={(e) =>
              setSelectedRow({ ...selectedRow, role: e.target.value })
            }
          >
            <option value="superuser">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <label>
            Status<span className="text-red-500"> *</span>
          </label>
          <Statustoggle
            status={selectedRow.status === 1 ? "Active" : "Inactive"}
            onToggle={() =>
              setSelectedRow((prev) => ({
                ...prev,
                status: prev.status === 1 ? 0 : 1,
              }))
            }
          />

          <DialogFooter>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
