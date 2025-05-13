import { Outlet } from "react-router-dom";
import NavbarCEO from "./navbars/navbar.mainCEO";

const MainLayoutCEO = () => {
  
  return (
    <div className=" h-screen">
      <NavbarCEO />
      <div className="flex">
        <div className=" container p-4 ">
        <Outlet />
        </div>
      </div>
     
    </div>
  );
};

export default MainLayoutCEO;
