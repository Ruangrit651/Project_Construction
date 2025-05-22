import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Label from '@radix-ui/react-label';
import { loginUser } from '@/services/login.service';
import { verifyUser } from '@/services/verify.service';
import * as Toast from '@radix-ui/react-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // เพิ่ม state สำหรับแสดงสถานะกำลังโหลด
  const navigate = useNavigate();
  const location = useLocation();

  // State สำหรับ Toast Notification
  const timerRef = React.useRef(0);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);

  // ฟังก์ชันสำหรับนำทางตาม role
  const navigateByRole = (role: string) => {
    if (role === 'RootAdmin' || role === 'Admin') {
      navigate('/admin');
    } else if (role === 'CEO') {
      navigate('/CEOProjectList');
    } else if (role === 'Manager') {
      navigate('/ManagerProjectList');
    } else if (role === 'Employee') {
      navigate('/employeeProjectList');
    } else {
      navigate('/admin'); // เส้นทางสำรอง
    }
  };

  // ตรวจสอบ Token เมื่อโหลดหน้า
  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await verifyUser();

        if (response.success && response.responseObject) {
          // ถ้า Token ยังใช้งานได้ และมีข้อมูลผู้ใช้
          const userRole = response.responseObject.role;
          navigateByRole(userRole);
        }
      } catch (error) {
        // Token ไม่ถูกต้องหรือหมดอายุ ให้แสดงหน้า login ตามปกติ
        console.log('Token verification failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  // จัดการการ login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginUser({ username, password, role: '', token: '' });

      if (response.success) {
        if (response.responseObject) {
          const userRole = response.responseObject.role;
          navigateByRole(userRole);
        } else {
          // ถ้าไม่มีข้อมูลผู้ใช้ ให้ไปที่หน้าเริ่มต้น
          navigate('/admin');
        }
      } else {
        setError(response.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
    }
  };

  // จัดการข้อมูลจาก location state (สำหรับการแสดง toast หลัง logout)
  useEffect(() => {
    if (location.state?.logoutSuccess) {
      setOpenSuccess(true);
      timerRef.current = window.setTimeout(() => {
        setOpenSuccess(false);
      }, 3000);
      return () => clearTimeout(timerRef.current);
    } else if (location.state?.logoutFailed) {
      setOpenError(true);
      timerRef.current = window.setTimeout(() => {
        setOpenError(false);
      }, 3000);
      return () => clearTimeout(timerRef.current);
    }
  }, [location.state]);

  // แสดงตัวโหลดขณะตรวจสอบ token
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking your login status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="mb-4">
          <Label.Root htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </Label.Root>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="mb-4">
          <Label.Root htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </Label.Root>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Login
        </button>
      </form>

      {/* Toast Notification */}
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-md bg-white p-[15px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] "
          open={openSuccess}
          onOpenChange={setOpenSuccess}
        >
          <Toast.Title className="mb-[5px] text-[15px] font-medium text-slate12 [grid-area:_title]">
            Logout successful 🎉
          </Toast.Title>
          <Toast.Action
            className="[grid-area:_action]"
            asChild
            altText="Goto schedule to undo"
          >
          </Toast.Action>
        </Toast.Root>

        <Toast.Root
          className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-md bg-white p-[15px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] "
          open={openError}
          onOpenChange={setOpenError}
        >
          <Toast.Title className="mb-[5px] text-[15px] font-medium text-red-500 [grid-area:_title]">
            เกิดข้อผิดพลาดในการออกจากระบบ
          </Toast.Title>
          <Toast.Action
            className="[grid-area:_action]"
            asChild
            altText="Dismiss"
          >
          </Toast.Action>
        </Toast.Root>

        <Toast.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[250px] max-w-[100vw] list-none flex-col gap-2.5 p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]" />
      </Toast.Provider>
    </div>
  );
};

export default Login;
