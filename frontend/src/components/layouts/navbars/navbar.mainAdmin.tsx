import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as Tabs from '@radix-ui/react-tabs';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  PersonIcon, 
  ArchiveIcon,
  ExitIcon
} from '@radix-ui/react-icons';
import { logoutUser } from '@/services/logout.service';
import { useNavigate, useLocation } from 'react-router-dom';

const NavbarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ฟังก์ชันสำหรับ Logout
  const handleLogout = async () => {
    try {
      await logoutUser({ username: 'Admin' }); // เรียกใช้งาน Logout Service
      navigate('/', { state: { logoutSuccess: true } }); // ส่ง state ไปที่หน้า Login
    } catch (err) {
      console.error('Logout failed', err);
      navigate('/', { state: { logoutFailed: true } }); // ส่ง state ไปที่หน้า Login ในกรณีที่เกิดข้อผิดพลาด
    }
  };

  // คำนวณว่า path ปัจจุบันเป็นของ tab ใด
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/admin') && !path.includes('/adminproject')) return 'members';
    if (path.includes('/adminproject')) return 'projects';
    return 'members'; // Default ให้เป็น members
  };

  const handleTabChange = (value: string) => {
    if (value === 'members') navigate('/admin');
    else if (value === 'projects') navigate('/adminproject');
  };

  return (
    <div className="flex flex-col">
      {/* Main Navbar */}
      <NavigationMenu.Root className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="font-bold">C</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
            CITE Construction
          </h2>
        </div>
        
        <NavigationMenu.List className="flex gap-6">
          <NavigationMenu.Item>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-full transition-all duration-200 ease-in-out">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <PersonIcon className="h-5 w-5" />
                </div>
                <span className="font-medium">Admin</span>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-gray-800 text-white p-1 rounded-lg shadow-xl border border-gray-700" sideOffset={5}>
                  <DropdownMenu.Item
                    className="cursor-pointer p-2 flex items-center gap-2 hover:bg-gray-700 rounded transition-colors duration-150 ease-in-out"
                    onClick={handleLogout}
                  >
                    <ExitIcon className="text-red-400" />
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>

      {/* Tabs Navigation */}
      <Tabs.Root 
        className="w-full bg-gray-800 text-white shadow-md" 
        value={getActiveTab()} 
        onValueChange={handleTabChange}
      >
        <Tabs.List className="flex max-w-screen-lg ">
          <Tabs.Trigger 
            value="members" 
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${
              getActiveTab() === 'members' 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent hover:bg-gray-700'
            }`}
          >
            <PersonIcon className={`${getActiveTab() === 'members' ? 'text-blue-400' : ''}`} />
            Member
          </Tabs.Trigger>

          <Tabs.Trigger 
            value="projects" 
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${
              getActiveTab() === 'projects' 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent hover:bg-gray-700'
            }`}
          >
            <ArchiveIcon className={`${getActiveTab() === 'projects' ? 'text-blue-400' : ''}`} />
            Project
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
};

export default NavbarAdmin;