import { Outlet } from "react-router-dom";
import NavbarEmployee from "./navbars/navbar.mainEmployee";

const MainLayoutEmployee = () => {
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarEmployee />
        <div className="flex-grow p-4 overflow-x-auto">
          <Outlet />
        </div>
      </div>
  );
};

export default MainLayoutEmployee;