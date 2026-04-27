import { Routes, Route, useLocation } from "react-router";
import { useContext } from "react";
import { Context } from "./Context";

import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import HomeLayout from "../components/HomeLayout";
import AddNewVisitor from "../pages/AddNewVisitor";
import AddAppointmentVisitor from "../pages/AddAppointmentVisitor";
import IssueGatePass from "../pages/IssueGatePass";
import ViewAppointment from "../pages/ViewAppointment";
import ViewVisitors from "../pages/ViewVisitors";
import ApproverDashboard from "../pages/ApproverDashboard";
import AddAppointment from "../pages/AddAppointment";
import ChangePassword from "../pages/ChangePassword";
import VisitorsMovement from "../pages/VisitorsMovement";
import History from "../pages/History";
import Settings from "../pages/Settings";
import AddEmployee from "../pages/AddEmployee";
import Users from "../pages/Users";

const Router = () => {
    const { user } = useContext(Context);
    const location = useLocation();
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />
          <Route element={<HomeLayout />}>
            <Route
              path="dashboard"
              element={
                user?.role == "superuser" ? (
                  <ProtectedRoute>
                    <ApproverDashboard />
                  </ProtectedRoute>
                ) : (
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                )
              }
            />
            <Route
              path="add-new-visitor"
              element={
                <ProtectedRoute>
                  <AddNewVisitor />
                </ProtectedRoute>
              }
            />
            <Route
              path="add-appointment-visitor"
              element={
                <ProtectedRoute>
                  <AddAppointmentVisitor />
                </ProtectedRoute>
              }
            />
            <Route
              path="issue-gate-pass"
              element={
                <ProtectedRoute>
                  <IssueGatePass key={location.pathname} />
                </ProtectedRoute>
              }
            />
            <Route
              path="issue-qr"
              element={
                <ProtectedRoute>
                  <IssueGatePass key={location.pathname} />
                </ProtectedRoute>
              }
            />
            <Route
              path="view-visitors"
              element={
                <ProtectedRoute>
                  <ViewVisitors />
                </ProtectedRoute>
              }
            />
            <Route
              path="add-appointment"
              element={
                <ProtectedRoute>
                  <AddAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="view-appointments"
              element={
                <ProtectedRoute>
                  <ViewAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="visitors-movement"
              element={
                <ProtectedRoute>
                  <VisitorsMovement />
                </ProtectedRoute>
              }
            />
            <Route
              path="add-employee"
              element={
                <ProtectedRoute>
                  <AddEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    );
};

export default Router;
