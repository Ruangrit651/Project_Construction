// Manager
import Dashboard from "@/pages/managerdashboard";
import Planning from "@/pages/managertask";
import Resource from "@/pages/managerresource";
import Report from "@/pages/managerreport";

// Admin
import AdminPage from "@/pages/admin";
import AdminProjectPage from "@/pages/project";

// Employee
import EmployeePlanning from "@/pages/employeestask";
import EmployeeResource from "@/pages/employeeresource";
import EmployeeReprot from "@/pages/employeereport";


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
          element: <AdminPage/>
        },
        {
          path: "/adminproject",
          element: <AdminProjectPage/>
        }
      ],
  },

  {
    path: "/",
    element: <MainLayoutManager />,
    children: [
      {
        path: "/ManagerDash",
        element: <Dashboard />,
      },
      {
        path: "/ManagerPlan",
        element: <Planning />,
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
      path: "/employeePlan",
      element: <EmployeePlanning />,
    },
    {
      path: "/employeeReport",
      element: <EmployeeReprot />,
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