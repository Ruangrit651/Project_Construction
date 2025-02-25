import { Outlet } from "react-router-dom";
import NavbarMain from "./navbars/navbar.main";
import SidebarMain from "./sidebars/sider.employee";

const MainLayoutEmployee = () => {
  
  return (
    <div className=" h-screen">
      <NavbarMain />
      <div className="flex">
        <SidebarMain />
        <div className=" container p-4 ">
        <Outlet />
        </div>
      </div>
     
    </div>
  );
};

export default MainLayoutEmployee;
