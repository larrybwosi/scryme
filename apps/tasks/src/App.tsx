import React from "react";
import { Routes, Route, Navigate } from "react-router";
import AuthGuard from "./components/AuthGuard";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import TimeTrackerPage from "./pages/TimeTrackerPage";
import GenericModulePage from "./pages/GenericModulePage";

export default function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="time-tracker" element={<TimeTrackerPage />} />
          <Route path="*" element={<GenericModulePage />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
}
