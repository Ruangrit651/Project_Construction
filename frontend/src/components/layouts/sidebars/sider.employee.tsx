import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ArchiveIcon, ReaderIcon, BarChartIcon } from '@radix-ui/react-icons';
import { Link } from "react-router-dom";

const SidebarMain = () => {
  return (
    <NavigationMenu.Root className="w-64 bg-gray-800 text-white flex flex-col p-4 h-full sticky top-0">
      <NavigationMenu.List className="flex flex-col gap-8">
        
        <NavigationMenu.Item>
          {/* Link to AdminProjectPage */}
          <Link 
            to="/employeePlan" 
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-700"
          >
            <BarChartIcon /> Project Planning
          </Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          {/* Link to AdminProjectPage */}
          <Link 
            to="/employeeResource" 
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-700"
          >
            <ArchiveIcon /> Resource/Budget
          </Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          {/* Link to AdminProjectPage */}
          <Link 
            to="/employeeReport" 
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-700"
          >
            <ReaderIcon /> Document Report
          </Link>
        </NavigationMenu.Item>

      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
};

export default SidebarMain;