import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as Tabs from '@radix-ui/react-tabs';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  PersonIcon,
  DashboardIcon,
  ArchiveIcon,
  ClipboardIcon,
  CalendarIcon,
  ExitIcon,
  BarChartIcon
} from '@radix-ui/react-icons';
import { logoutUser } from '@/services/logout.service';
import { getCurrentUser } from '@/services/user.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const NavbarMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState({ username: 'User' });

  // เก็บข้อมูลโปรเจกต์จาก URL parameters
  const [selectedProject, setSelectedProject] = useState<{
    id: string | null;
    name: string | null;
  }>({
    id: null,
    name: null
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser();
        console.log('User data received:', userData);

        // Update this line to access the responseObject property
        setCurrentUser(userData.responseObject);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchUserData();
  }, []);

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
      await logoutUser({ username: currentUser.username });
      navigate('/', { state: { logoutSuccess: true } });
    } catch (err) {
      console.error('Logout failed', err);
      navigate('/', { state: { logoutFailed: true } });
    }
  };

  /// คำนวณว่า path ปัจจุบันเป็นของ tab ใด
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/ManagerDash')) return 'dashboard';
    if (path.includes('/ManagerPlan')) return 'timeline';
    if (path.includes('/ManagerTask')) return 'tasklist';
    if (path.includes('/ManagerResource')) return 'resource';
    if (path.includes('/ManagerProjectList')) return 'projectlist';
    if (path.includes('/ManagerSummry')) return 'summary';
    return 'dashboard';
  };

  const handleTabChange = (value: string) => {
    // ถ้าเปลี่ยนไปหน้า ProjectList ให้เคลียร์ค่าโปรเจกต์ที่เลือก
    if (value === 'projectlist') {
      navigate('/ManagerProjectList');
      return;
    }

    // ถ้าเปลี่ยนไปหน้า Summary ไม่ต้องส่งค่า project_id
    if (value === 'summary') {
      navigate('/ManagerSummry');
      return;
    }

    // ถ้ามีโปรเจกต์ที่เลือกอยู่แล้ว ก็นำทางไปยังหน้านั้นพร้อมข้อมูลโปรเจกต์ที่เลือก
    if (selectedProject.id && selectedProject.name) {
      // ตรวจสอบค่า value และกำหนด path ที่ถูกต้อง
      let pagePath = "";
      switch (value) {
        case 'dashboard':
          pagePath = "/ManagerDash";
          break;
        case 'tasklist':
          pagePath = "/ManagerTask";
          break;
        case 'timeline':
          pagePath = "/ManagerPlan";
          break;
        case 'resource':
          pagePath = "/ManagerResource";
          break;
        default:
          pagePath = `/Manager${value.charAt(0).toUpperCase() + value.slice(1)}`;
      }

      navigate(`${pagePath}?project_id=${selectedProject.id}&project_name=${encodeURIComponent(selectedProject.name)}`);
    } else {
      // ถ้ายังไม่มีโปรเจกต์ที่เลือกและไม่ใช่หน้า summary หรือ projectlist ให้แจ้งเตือนผู้ใช้
      if (value !== 'summary' && value !== 'projectlist') {
        alert('โปรดเลือกโปรเจกต์ก่อนเข้าใช้งานส่วนนี้');
      }
      navigate('/ManagerProjectList');
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
              Project Selected: {selectedProject.name}
            </span>
          )}
        </div>

        <NavigationMenu.List className="flex gap-6">
          <NavigationMenu.Item>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-lg transition-all duration-200 ease-in-out">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <PersonIcon className="h-5 w-5" />
                </div>
                <span className="font-medium text-white px-3 py-1 min-w-[120px] max-w-[200px] truncate">
                  {currentUser?.username || 'User'}
                </span>
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
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${getActiveTab() === 'projectlist'
              ? 'border-blue-500 text-blue-400 font-medium'
              : 'border-transparent hover:bg-gray-700'
              }`}
          >
            <ArchiveIcon className={`${getActiveTab() === 'projectlist' ? 'text-blue-400' : ''}`} />
            Project List
          </Tabs.Trigger>

          <Tabs.Trigger
            value="summary"
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${getActiveTab() === 'summary'
              ? 'border-blue-500 text-blue-400 font-medium'
              : 'border-transparent hover:bg-gray-700'
              }`}
          >
            <BarChartIcon className={`${getActiveTab() === 'summary' ? 'text-blue-400' : ''}`} />
            Summary
          </Tabs.Trigger>

          <Tabs.Trigger
            value="dashboard"
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 
    ${getActiveTab() === 'dashboard' ? 'border-blue-500 text-blue-400 font-medium' : 'border-transparent hover:bg-gray-700'}
    ${!selectedProject.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedProject.id}
            title={!selectedProject.id ? 'โปรดเลือกโปรเจกต์ก่อน' : 'แดชบอร์ด'}
          >
            <DashboardIcon className={`${getActiveTab() === 'dashboard' ? 'text-blue-400' : ''}`} />
            Dashboard
          </Tabs.Trigger>

          <Tabs.Trigger
            value="tasklist"
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${getActiveTab() === 'tasklist'
              ? 'border-blue-500 text-blue-400 font-medium'
              : 'border-transparent hover:bg-gray-700'
              }
    ${!selectedProject.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedProject.id}
            title={!selectedProject.id ? 'โปรดเลือกโปรเจกต์ก่อน' : 'รายการงาน'}
          >
            <ClipboardIcon className={`${getActiveTab() === 'tasklist' ? 'text-blue-400' : ''}`} />
            Tasklist
          </Tabs.Trigger>

          <Tabs.Trigger
            value="timeline"
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${getActiveTab() === 'timeline'
              ? 'border-blue-500 text-blue-400 font-medium'
              : 'border-transparent hover:bg-gray-700'
              }
    ${!selectedProject.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedProject.id}
            title={!selectedProject.id ? 'โปรดเลือกโปรเจกต์ก่อน' : 'ไทม์ไลน์'}
          >
            <CalendarIcon className={`${getActiveTab() === 'timeline' ? 'text-blue-400' : ''}`} />
            Timeline
          </Tabs.Trigger>

          <Tabs.Trigger
            value="resource"
            className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all duration-200 ${getActiveTab() === 'resource'
              ? 'border-blue-500 text-blue-400 font-medium'
              : 'border-transparent hover:bg-gray-700'
              }
    ${!selectedProject.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedProject.id}
            title={!selectedProject.id ? 'โปรดเลือกโปรเจกต์ก่อน' : 'ทรัพยากร/งบประมาณ'}
          >
            <ArchiveIcon className={`${getActiveTab() === 'resource' ? 'text-blue-400' : ''}`} />
            Resource/Budget
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
};

export default NavbarMain;