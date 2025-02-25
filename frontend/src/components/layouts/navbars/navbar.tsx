// import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { HomeIcon, DashboardIcon, GearIcon } from '@radix-ui/react-icons';

function Navbar() {
  return (
    <NavigationMenu.Root className="w-full bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
      <h2 className="text-xl font-bold"> CITE Construction</h2>
      <NavigationMenu.List className="flex gap-6">
        <NavigationMenu.Item>
          <NavigationMenu.Link className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded">
            <HomeIcon /> Home
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded">
            <DashboardIcon /> Dashboard
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded">
            <GearIcon /> Settings
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default Navbar;
