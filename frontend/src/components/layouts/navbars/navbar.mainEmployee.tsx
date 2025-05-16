import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as Tabs from '@radix-ui/react-tabs';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  PersonIcon, 
  ArchiveIcon,
  ClipboardIcon,
  CalendarIcon,
  ExitIcon,
} from '@radix-ui/react-icons';
import { logoutUser } from '@/services/logout.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const NavbarEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // เก็บข้อมูลโปรเจกต์จาก URL parameters
  const [selectedProject, setSelectedProject] = useState<{
    id: string | null;
    name: string | null;
  }>({
    id: null,
    name: null
  });

  // อ่าน URL parameters เมื่อ location เปลี่ยน
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get('project_id');
    const projectName = searchParams.get('project_name');

    if (projectId && projectName) {
      setSelectedProject({
        id: projectId,
        name: projectName
      });
    }
  }, [location]);
  
  // ฟังก์ชันสำหรับ Logout
  const handleLogout = async () => {
    try {
      await logoutUser({ username: 'Myuser' }); // เรียกใช้งาน Logout Service
      navigate('/', { state: { logoutSuccess: true } }); // ส่ง state ไปที่หน้า Login
    } catch (err) {
      console.error('Logout failed', err);
      navigate('/', { state: { logoutFailed: true } }); // ส่ง state ไปที่หน้า Login ในกรณีที่เกิดข้อผิดพลาด
    }
  };

  // คำนวณว่า path ปัจจุบันเป็นของ tab ใด
 const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/employeePlan')) return 'timeline';
    if (path.includes('/employeeTask')) return 'tasklist';
    if (path.includes('/employeeResource')) return 'resource';
    if (path.includes('/employeeReport')) return 'report';
    if (path.includes('/employeeProjectList')) return 'projectlist';
    return 'projectlist'; // Default ให้เป็น projectlist
  };

  const handleTabChange = (value: string) => {
    // ถ้าเปลี่ยนไปหน้า ProjectList ให้เคลียร์ค่าโปรเจกต์ที่เลือก
    if (value === 'projectlist') {
      navigate('/employeeProjectList');
      return;
    }

    // ถ้ามีโปรเจกต์ที่เลือกอยู่แล้ว ก็นำทางไปยังหน้านั้นพร้อมข้อมูลโปรเจกต์ที่เลือก
    if (selectedProject.id && selectedProject.name) {
      // ตรวจสอบค่า value และกำหนด path ที่ถูกต้อง
      let pagePath = "";
      switch (value) {
        case 'timeline':
          pagePath = "/employeePlan";
          break;
        case 'tasklist':
          pagePath = "/employeeTask";
          break;
        case 'resource':
          pagePath = "/employeeResource";
          break;
        case 'report':
          pagePath = "/employeeReport";
          break;
        default:
          pagePath = `/employee${value.charAt(0).toUpperCase() + value.slice(1)}`;
      }

      navigate(`${pagePath}?project_id=${selectedProject.id}&project_name=${encodeURIComponent(selectedProject.name)}`);
    } else {
      // ถ้ายังไม่มีโปรเจกต์ที่เลือก ให้ไปยังหน้าโปรเจกต์ลิสต์
      navigate('/employeeProjectList');
    }
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
          {selectedProject.id && (
            <span className="ml-4 px-3 py-1 bg-blue-600 rounded-full text-sm">
              โปรเจกต์: {selectedProject.name}
            </span>
          )}
        </div>
        
        <NavigationMenu.List className="flex gap-6">
          <NavigationMenu.Item>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-full transition-all duration-200 ease-in-out">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <PersonIcon className="h-5 w-5" />
                </div>
                <span className="font-medium">Employee</span>
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
        <Tabs.List className="flex max-w-screen-lg">
          
          <Tabs.Trigger 
            value="projectlist" 
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${
              getActiveTab() === 'projectlist' 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent hover:bg-gray-700'
            }`}
          >
            <ArchiveIcon className={`${getActiveTab() === 'projectlist' ? 'text-blue-400' : ''}`} />
            Project List
          </Tabs.Trigger>
          
          <Tabs.Trigger 
            value="timeline" 
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${
              getActiveTab() === 'timeline' 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent hover:bg-gray-700'
            }`}
            disabled={!selectedProject.id}
          >
            <CalendarIcon className={`${getActiveTab() === 'timeline' ? 'text-blue-400' : ''}`} />
            Timeline
          </Tabs.Trigger>

          <Tabs.Trigger 
            value="tasklist" 
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${
              getActiveTab() === 'tasklist' 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent hover:bg-gray-700'
            }`}
            disabled={!selectedProject.id}
          >
            <ClipboardIcon className={`${getActiveTab() === 'tasklist' ? 'text-blue-400' : ''}`} />
            Tasklist
          </Tabs.Trigger>

          <Tabs.Trigger 
            value="resource" 
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${
              getActiveTab() === 'resource' 
                ? 'border-blue-500 text-blue-400 font-medium' 
                : 'border-transparent hover:bg-gray-700'
            }`}
            disabled={!selectedProject.id}
          >
            <ArchiveIcon className={`${getActiveTab() === 'resource' ? 'text-blue-400' : ''}`} />
            Resource/Budget
          </Tabs.Trigger>
          
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
};

export default NavbarEmployee;