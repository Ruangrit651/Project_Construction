import React, { useState , useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Label from '@radix-ui/react-label';
import { loginUser } from '@/services/login.service';
import * as Toast from '@radix-ui/react-toast';


const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // State สำหรับ Toast Notification
  const timerRef = React.useRef(0);

  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await loginUser({ username, password, role:'', token: '' });
  
      if (response.success) {
  
        if (response.responseObject) { // เปลี่ยนจาก response.user เป็น response.responseObject
          const userRole = response.responseObject.role; // เปลี่ยนจาก response.user.role เป็น response.responseObject.role
            
          if (userRole === 'RootAdmin' || userRole === 'Admin') {
            navigate('/admin');
          } else if (userRole === 'CEO') {
            navigate('/CEODashBoard');
          } else if (userRole === 'Manager') {
            navigate('/ManagerDash');
          } else if (userRole === 'Employee') {
            navigate('/employeePlan');
          } else {
            navigate('/admin'); // Fallback route
          }
        } else {
          // If user object isn't available, redirect to a default page
          navigate('/admin');
        }
      } else {
        setError(response.message || 'Invalid login credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  useEffect(() => {
    if (location.state?.logoutSuccess) {
      setOpenSuccess(true);
      return () => clearTimeout(timerRef.current);
    } else if (location.state?.logoutFailed) {
      setOpenError(true);
    }
  }, [location.state]);

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
      {/* Toast เอาไปไว้ในหน้้า login พร้อม ส่ง props ไปที่หน้า Login ด้วย */}
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-md bg-white p-[15px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] "
          open={openSuccess}
          onOpenChange = {setOpenSuccess}
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
        <Toast.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[250px] max-w-[100vw] list-none flex-col gap-2.5 p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]" />
      </Toast.Provider>
    </div>
  );
};

export default Login;
