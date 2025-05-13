import { Outlet } from "react-router-dom";
import NavbarMain from "./navbars/navbar.main";

const MainLayoutManager = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarMain />
      <div className="flex-grow p-6 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayoutManager;