// import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { HomeIcon, DashboardIcon, GearIcon } from '@radix-ui/react-icons';

function Sidebar() {
  return (
    <NavigationMenu.Root className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-6">My Sidebar</h2>
      <NavigationMenu.List className="flex flex-col gap-4">
        <NavigationMenu.Item>
          <NavigationMenu.Link className="flex items-center gap-2 p-2 rounded hover:bg-gray-700">
            <HomeIcon /> Home
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link className="flex items-center gap-2 p-2 rounded hover:bg-gray-700">
            <DashboardIcon /> Dashboard
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link className="flex items-center gap-2 p-2 rounded hover:bg-gray-700">
            <GearIcon /> Settings
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default Sidebar;
