// import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PersonIcon } from '@radix-ui/react-icons';

const NavbarMain = () => {
  return (
    <NavigationMenu.Root className="w-full bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
      <h2 className="text-xl font-bold">CITE Construction</h2>
      <NavigationMenu.List className="flex gap-6">
        <NavigationMenu.Item>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded">
              <PersonIcon />
              Myuser
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-gray-700 text-white p-2 rounded shadow-lg"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="cursor-pointer p-2 hover:bg-gray-600 rounded"
                  onClick={() => {
                    alert('Logged out!');
                    // Add logout logic here
                  }}
                >
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
};

export default NavbarMain;
