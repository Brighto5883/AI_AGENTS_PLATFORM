import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styling/Sidebar.css";

export default function AuthenticatedLayout() {

  return (

    <div className="dashboard-layout">

      <Sidebar />

      <div className="dashboard-content">

        <Outlet />

      </div>

    </div>

  );

}
