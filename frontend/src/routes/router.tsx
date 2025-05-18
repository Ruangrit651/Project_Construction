// Manager
import Dashboard from "@/pages/managerdashboard";
import Planning from "@/pages/managertask";
import Resource from "@/pages/managerresource";
import Report from "@/pages/managerreport";
import Tasklist from "@/pages/managertasklist";
import ProjectListManager from "@/pages/projectlistManager";
import ManagerSummary from "@/pages/ManagerSummry";

//CEO
import Summary from "@/pages/CEOSummary";
import DashboardCEO from "@/pages/CEOdashboard";
import ProjectListCEO from "@/pages/CEOprojectlist";
import CEOTimeline from "@/pages/CEOtimeline"; // เพิ่ม import
import CEOTasklist from "@/pages/CEOtasklist"; // เพิ่ม import
import CEOResource from "@/pages/CEOresouce"; // เพิ่ม import


// Admin
import AdminPage from "@/pages/admin";
import AdminProjectPage from "@/pages/project";

// Employee
import EmployeePlanning from "@/pages/employeestimeline";
import EmployeeProjectList from "@/pages/projectlistemployee"; // Add this import
import EmployeeResource from "@/pages/employeeresource";
import EmployeeTasklist from "@/pages/employeetasklist";


// Navbar Sidebar
import MainLayout from "@/components/layouts/layout.main";
import MainLayoutManager from "@/components/layouts/layout.manager";
import MainLayoutEmployee from "@/components/layouts/layout.employee";

// React
import { createBrowserRouter, RouterProvider } from "react-router-dom";

//Error
import Error404 from "@/components/layouts/layout.error404";

//templet
import CategoriesPage from "@/pages/category";

// login
import Login from "@/pages/login";
import MainLayoutCEO from "@/components/layouts/layout.ceo";


const router = createBrowserRouter([
  {
    index: true,
    path: "/",
    element: <Login />,
  },

  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/categories",
        element: <CategoriesPage />,
      },
      {
        path: "/admin",
        element: <AdminPage />
      },
      {
        path: "/adminproject",
        element: <AdminProjectPage />
      }
    ],
  },

  {
    path: "/",
    element: <MainLayoutCEO />,
    children: [
      {
        path: "/CEOProjectList",
        element: <ProjectListCEO />,
      },
      {
        path: "/CEOSummary",
        element: <Summary />,
      },
      {
        path: "/CEODashBoard",
        element: <DashboardCEO />,
      },
      {
        path: "/CEOTimeline",
        element: <CEOTimeline />,
      },
      {
        path: "/CEOTasklist", 
        element: <CEOTasklist />,
      },
      {
        path: "/CEOResource",
        element: <CEOResource />,
      },

    ],
  },

  {
    path: "/",
    element: <MainLayoutManager />,
    children: [
      {
        path: "/ManagerProjectList",
        element: <ProjectListManager />,
      },
      {
        path: "/ManagerSummry",
        element: <ManagerSummary />,
      },
      {
        path: "/ManagerDash",
        element: <Dashboard />,
      },
      {
        path: "/ManagerPlan",
        element: <Planning />,
      },
      {
        path: "/ManagerTask",
        element: <Tasklist />,
      },
      {
        path: "/ManagerResource",
        element: <Resource />,
      },
      {
        path: "/ManagerReport",
        element: <Report />,
      },
    ],
  },

  {
    path: "/",
    element: <MainLayoutEmployee />,
    children: [
      {
        path: "/employeeProjectList",
        element: <EmployeeProjectList />, // Use the new component
      },
      {
        path: "/employeePlan",
        element: <EmployeePlanning />,
      },
      {
        path: "/employeeTask",
        element: <EmployeeTasklist />,
      },
      {
        path: "/employeeResource",
        element: <EmployeeResource />,
      },
    ],
  },
  {
    path: "*",
    element: <Error404 />,
  },
])


export default function Router() {
  return <RouterProvider router={router} />;
}