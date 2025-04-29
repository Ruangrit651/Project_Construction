import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ArchiveIcon, ReaderIcon, BarChartIcon, DashboardIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { Link } from "react-router-dom";
import { useState } from 'react';

const SidebarMain = () => {
  const [planningDropdownOpen, setPlanningDropdownOpen] = useState(false);

  return (
    <NavigationMenu.Root className="w-64 bg-gray-800 text-white flex flex-col p-4 h-full sticky top-0">
      <NavigationMenu.List className="flex flex-col gap-8">
        
        <NavigationMenu.Item>
          {/* Link to AdminPage */}
          <Link 
            to="/ManagerDash" 
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-700"
          >
            <DashboardIcon /> Dashborad
          </Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item className="flex flex-col">
          {/* Project Planning dropdown */}
          <button 
            onClick={() => setPlanningDropdownOpen(!planningDropdownOpen)}
            className="flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-700 w-full"
          >
            <div className="flex items-center gap-2">
              <BarChartIcon /> Project Planning
            </div>
            <ChevronDownIcon className={`transition-transform ${planningDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {planningDropdownOpen && (
            <div className="ml-6 mt-2">
              <Link 
                to="/ManagerPlan" 
                className="flex items-center mt-4 gap-2 p-2 rounded hover:bg-gray-700"
              >
                Plan Overview
              </Link>
              <Link 
                to="/ManagerTask" 
                className="flex items-center mt-6 gap-2 p-2 rounded hover:bg-gray-700"
              >
                Task Manage
              </Link>
            </div>
          )}
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          {/* Link to AdminProjectPage */}
          <Link 
            to="/ManagerResource" 
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-700"
          >
            <ArchiveIcon /> Resource/Budget
          </Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          {/* Link to AdminProjectPage */}
          <Link 
            to="/ManagerReport" 
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