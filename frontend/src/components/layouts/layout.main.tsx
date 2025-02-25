import { Outlet } from "react-router-dom";
import NavbarMain from "./navbars/navbar.main";
import SidebarMain from "./sidebars/sidebar.main";

const MainLayout = () => {
  // ถ้ายังไม่ได้ล็อคอิน ให้รีหน้าไป หน้า login
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

export default MainLayout;
