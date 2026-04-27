import { useEffect, useState, useContext } from "react";
import { getSqlTimeStamp } from "../utils/helperFunctions";
import baseUrl from "../utils/baseURL";
import axios from "axios";
import toaster from "../utils/toaster";
import GatePassPaginatedTable from "../components/GatePassPaginatedTable";
import { useLocation } from "react-router";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { Context } from "../utils/Context";

const IssueGatePass = () => {
  const { config, user } = useContext(Context);
  const breakpoint = useBreakpoint();
  const [tableData, setTableData] = useState({});
  const location = useLocation();
  const [qrRoute, setQrRoute] = useState(false);
  useEffect(() => {
    if (location.pathname == "/issue-qr") {
      setQrRoute(true);
    }
  }, [location.pathname]);

  // const [filters, setFilters] = useState({
  //   date: new Date(),
  //   search: "",
  // });

  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    search: "",
  });

  async function fetchData(pageNumber) {
    //    const d = new Date(filters.date);
    //     d.setHours(0, 0, 0, 0);
    //     const startDate = getSqlTimeStamp(d);
    //     d.setDate(d.getDate() + 1);
    //     const endDate = getSqlTimeStamp(d);

    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    const startDate = getSqlTimeStamp(start);
    const endDate = getSqlTimeStamp(end);

    try {
      const size = breakpoint === "sm" ? 20 : breakpoint === "md" ? 10 : 5;

      const res = await axios.post(
        pageNumber
          ? `${baseUrl}/api/v1/visitor/get-approved-users?page=${pageNumber}&size=${size}`
          : `${baseUrl}/api/v1/visitor/get-approved-users?size=${size}`,
        { startDate, endDate, search: filters.search || "" },
        // { startDate: "2025-01-01 00:00:00", endDate: "2025-09-10 00:00:00" },
        { withCredentials: true },
      );
      console.log(res.data, startDate, endDate);

      if (res.data.success) {
        setTableData(res.data.data);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toaster("error", errMsg || "Failed to fetch visitors");
    }
  }

  useEffect(() => {
    fetchData();
  }, [breakpoint]);
  return (
    <div>
      <p className="w-full text-center mb-4 font-semibold">
        Issue {qrRoute ? "QR code" : "Gate Pass"}
      </p>
      <GatePassPaginatedTable
        fetchData={fetchData}
        tableData={tableData}
        filters={filters}
        setFilters={setFilters}
        qr={qrRoute}
        role={user.role}
      />
    </div>
  );
};

export default IssueGatePass;
