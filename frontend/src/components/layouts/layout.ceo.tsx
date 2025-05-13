import { Outlet } from "react-router-dom";
import NavbarCEO from "./navbars/navbar.mainCEO";

const MainLayoutCEO = () => {
  
  return (
    <div className=" h-screen flex flex-col">
      <NavbarCEO />
      <div className="flex">
        <div className=" container p-4 overflow-x-auto">
        <Outlet />
        </div>
      </div>
     
    </div>
  );
};

export default MainLayoutCEO;
