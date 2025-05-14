import { Outlet } from "react-router-dom";
import NavbarAdmin from "./navbars/navbar.mainAdmin";

const MainLayout = () => {
  // ถ้ายังไม่ได้ล็อคอิน ให้รีหน้าไป หน้า login
  return (
    <div className=" h-screen">
      <NavbarAdmin />
       <div className="flex-grow p-6 overflow-x-auto">
        <Outlet />
      </div>
     
    </div>
  );
};

export default MainLayout;
