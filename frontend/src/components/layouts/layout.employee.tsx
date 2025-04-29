import { Outlet } from "react-router-dom";
import NavbarMain from "./navbars/navbar.main";
import SidebarMain from "./sidebars/sider.employee";

const MainLayoutEmployee = () => {
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarMain />
      <div className="flex flex-1 relative">
        <div className="w-64 flex-shrink-0">
          <SidebarMain />
        </div>
        <div className="flex-grow p-4 overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayoutEmployee;