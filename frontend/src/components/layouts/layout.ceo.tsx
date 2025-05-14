import { Outlet } from "react-router-dom";
import NavbarCEO from "./navbars/navbar.mainCEO";

const MainLayoutCEO = () => {
  return (
    <div className="h-screen flex flex-col">
      <NavbarCEO />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayoutCEO;