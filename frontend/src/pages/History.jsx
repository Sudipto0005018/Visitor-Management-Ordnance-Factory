import { useEffect, useState } from "react";
import axios from "axios";
import baseUrl from "../utils/baseURL";
import { getSqlTimeStamp } from "../utils/helperFunctions";
import HistoryTable from "../components/HistoryTable";

const History = () => {
  const [visitors, setVisitors] = useState([]);
  const [fetchedData, setFetchedData] = useState({
    items: [],
    pageSize: 5,
    currentPage: 0,
    totalItems: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState({
    table: false,
  });

  async function getHistory(page = 1, filters = {}) {
    try {
      let startDate, endDate;
      if (!filters.startDate) {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 0);
      } else {
        filters.startDate.setHours(0, 0, 0, 0);
        startDate = filters.startDate;
        filters.endDate.setHours(23, 59, 59, 0);
        endDate = filters.endDate;
      }

      const response = await axios.post(
        baseUrl + "/api/v1/visitor/get-history?page=" + page,
        {
          current_time: getSqlTimeStamp(new Date()),
          search: filters.search || "",
          startDate: getSqlTimeStamp(startDate),
          endDate: getSqlTimeStamp(endDate),
        },
        {
          withCredentials: true,
        },
      );

      setFetchedData(response.data.data);
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <div>
      <HistoryTable fetchData={getHistory} tableData={fetchedData} />
    </div>
  );
};

export default History;
