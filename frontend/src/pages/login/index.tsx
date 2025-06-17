// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import * as Label from '@radix-ui/react-label';
// import { loginUser } from '@/services/login.service';
// import { verifyUser } from '@/services/verify.service';
// import * as Toast from '@radix-ui/react-toast';

// const Login: React.FC = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true); // เพิ่ม state สำหรับแสดงสถานะกำลังโหลด
//   const navigate = useNavigate();
//   const location = useLocation();

//   // State สำหรับ Toast Notification
//   const timerRef = React.useRef(0);
//   const [openSuccess, setOpenSuccess] = useState(false);
//   const [openError, setOpenError] = useState(false);

//   // ฟังก์ชันสำหรับนำทางตาม role
//   const navigateByRole = (role: string) => {
//     if (role === 'RootAdmin' || role === 'Admin') {
//       navigate('/admin');
//     } else if (role === 'CEO') {
//       navigate('/CEOProjectList');
//     } else if (role === 'Manager') {
//       navigate('/ManagerProjectList');
//     } else if (role === 'Employee') {
//       navigate('/employeeProjectList');
//     } else {
//       navigate('/admin'); // เส้นทางสำรอง
//     }
//   };

//   // ตรวจสอบ Token เมื่อโหลดหน้า
//   useEffect(() => {
//     const checkToken = async () => {
//       try {
//         const response = await verifyUser();

//         if (response.success && response.responseObject) {
//           // ถ้า Token ยังใช้งานได้ และมีข้อมูลผู้ใช้
//           const userRole = response.responseObject.role;
//           navigateByRole(userRole);
//         }
//       } catch (error) {
//         // Token ไม่ถูกต้องหรือหมดอายุ ให้แสดงหน้า login ตามปกติ
//         console.log('Token verification failed:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     checkToken();
//   }, []);

//   // จัดการการ login
//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     try {
//       const response = await loginUser({ username, password, role: '', token: '' });

//       if (response.success) {
//         if (response.responseObject) {
//           const userRole = response.responseObject.role;
//           navigateByRole(userRole);
//         } else {
//           // ถ้าไม่มีข้อมูลผู้ใช้ ให้ไปที่หน้าเริ่มต้น
//           navigate('/admin');
//         }
//       } else {
//         setError(response.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
//       }
//     } catch (err) {
//       setError('เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
//     }
//   };

//   // จัดการข้อมูลจาก location state (สำหรับการแสดง toast หลัง logout)
//   useEffect(() => {
//     if (location.state?.logoutSuccess) {
//       setOpenSuccess(true);
//       timerRef.current = window.setTimeout(() => {
//         setOpenSuccess(false);
//       }, 3000);
//       return () => clearTimeout(timerRef.current);
//     } else if (location.state?.logoutFailed) {
//       setOpenError(true);
//       timerRef.current = window.setTimeout(() => {
//         setOpenError(false);
//       }, 3000);
//       return () => clearTimeout(timerRef.current);
//     }
//   }, [location.state]);

//   // แสดงตัวโหลดขณะตรวจสอบ token
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-100">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
//             <p className="mt-4 text-gray-600">Checking your login status...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleLogin}>
//         <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

//         {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

//         <div className="mb-4">
//           <Label.Root htmlFor="username" className="block text-sm font-medium text-gray-700">
//             Username
//           </Label.Root>
//           <input
//             id="username"
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//           />
//         </div>

//         <div className="mb-4">
//           <Label.Root htmlFor="password" className="block text-sm font-medium text-gray-700">
//             Password
//           </Label.Root>
//           <input
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//           />
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//         >
//           Login
//         </button>
//       </form>

//       {/* Toast Notification */}
//       <Toast.Provider swipeDirection="right">
//         <Toast.Root
//           className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-md bg-white p-[15px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] "
//           open={openSuccess}
//           onOpenChange={setOpenSuccess}
//         >
//           <Toast.Title className="mb-[5px] text-[15px] font-medium text-slate12 [grid-area:_title]">
//             Logout successful 🎉
//           </Toast.Title>
//           <Toast.Action
//             className="[grid-area:_action]"
//             asChild
//             altText="Goto schedule to undo"
//           >
//           </Toast.Action>
//         </Toast.Root>

//         <Toast.Root
//           className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-md bg-white p-[15px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] "
//           open={openError}
//           onOpenChange={setOpenError}
//         >
//           <Toast.Title className="mb-[5px] text-[15px] font-medium text-red-500 [grid-area:_title]">
//             เกิดข้อผิดพลาดในการออกจากระบบ
//           </Toast.Title>
//           <Toast.Action
//             className="[grid-area:_action]"
//             asChild
//             altText="Dismiss"
//           >
//           </Toast.Action>
//         </Toast.Root>

//         <Toast.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[250px] max-w-[100vw] list-none flex-col gap-2.5 p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]" />
//       </Toast.Provider>
//     </div>
//   );
// };

// export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Label from '@radix-ui/react-label';
import { loginUser } from '@/services/login.service';
import { verifyUser } from '@/services/verify.service';
import * as Toast from '@radix-ui/react-toast';
import { FaUserAlt, FaLock, FaBuilding, FaSignInAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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

  // จัดการข้อมูลจาก location state
  useEffect(() => {
    if (location.state?.logoutSuccess) {
      setOpenSuccess(true);
      timerRef.current = window.setTimeout(() => {
        setOpenSuccess(false);

        // ล้าง state หลังจากแสดง toast เพื่อป้องกันการแสดงซ้ำเมื่อรีเฟรชหน้า
        navigate(location.pathname, { replace: true, state: {} });
      }, 3000);

      return () => clearTimeout(timerRef.current);
    } else if (location.state?.logoutFailed) {
      setOpenError(true);
      timerRef.current = window.setTimeout(() => {
        setOpenError(false);

        // ล้าง state หลังจากแสดง toast เพื่อป้องกันการแสดงซ้ำเมื่อรีเฟรชหน้า
        navigate(location.pathname, { replace: true, state: {} });
      }, 3000);

      return () => clearTimeout(timerRef.current);
    }
  }, [location.state, navigate, location.pathname]);

  // แสดงตัวโหลดขณะตรวจสอบ token
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-100 to-indigo-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white p-14 rounded-xl shadow-2xl"
        >
          <div className="flex flex-col items-center">
            <FaBuilding className="text-6xl text-blue-600 mb-6" />
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mb-6"></div>
            <p className="text-xl text-gray-700 font-medium">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-6 md:p-10">
      {/* ส่วนซ้าย - รูปภาพและข้อความ */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:block w-full max-w-2xl p-10 text-center"
      >
        <div className="mb-10">
          <FaBuilding className="text-blue-700 text-9xl mx-auto mb-8" />
          <h1 className="text-5xl font-bold text-blue-800 mb-6">CITE Construction Management System</h1>
          <p className="text-2xl text-gray-600">ระบบบริหารจัดการโครงการก่อสร้างครบวงจร</p>
        </div>

        <div className="bg-white/30 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-semibold text-blue-900 mb-6">ยินดีต้อนรับเข้าสู่ระบบ</h2>
          <p className="text-xl text-blue-800 mb-6">
            กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันการจัดการโครงการก่อสร้าง
            การติดตามความคืบหน้า และการบริหารทรัพยากรต่างๆ
          </p>
          <p className="text-lg text-blue-700">
            หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </motion.div>

      {/* ส่วนขวา - ฟอร์ม Login */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full max-w-xl px-4 lg:px-0"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-700 py-8 px-10">
            <div className="flex justify-center items-center mb-4">
              <FaBuilding className="text-white text-6xl" />
            </div>
            <h2 className="text-3xl font-bold text-center text-white mb-2">CITE Construction</h2>
            <p className="text-blue-100 text-center text-lg">กรอกข้อมูลเพื่อเริ่มใช้งานระบบ</p>
          </div>

          <form className="p-10" onSubmit={handleLogin}>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 p-5 rounded-lg mb-8 text-base border-l-4 border-red-500 flex items-start"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            <div className="mb-8">
              <Label.Root htmlFor="username" className="block text-lg font-medium text-gray-700 mb-2">
                Username
              </Label.Root>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUserAlt className="text-blue-600 text-xl" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 block w-full text-lg border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter Username"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <Label.Root htmlFor="password" className="block text-lg font-medium text-gray-700">
                  Password
                </Label.Root>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-blue-600 text-xl" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 block w-full text-lg border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter Password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-4 px-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex justify-center items-center space-x-3"
            >
              <FaSignInAlt className="text-xl" />
              <span>Login</span>
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-xl bg-white p-6 shadow-lg [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] border-l-8 border-green-500"
          open={openSuccess}
          onOpenChange={setOpenSuccess}
        >
          <Toast.Title className="text-lg font-medium text-gray-800 [grid-area:_title]">
            ออกจากระบบสำเร็จ 🎉
          </Toast.Title>
          <Toast.Action
            className="[grid-area:_action]"
            asChild
            altText="Close"
          >
            <button className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
              </svg>
            </button>
          </Toast.Action>
        </Toast.Root>

        <Toast.Root
          className="grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-xl bg-white p-6 shadow-lg [grid-template-areas:_'title_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-hide data-[state=open]:animate-slideIn data-[swipe=end]:animate-swipeOut data-[swipe=cancel]:transition-[transform_200ms_ease-out] border-l-8 border-red-500"
          open={openError}
          onOpenChange={setOpenError}
        >
          <Toast.Title className="text-lg font-medium text-red-600 [grid-area:_title]">
            เกิดข้อผิดพลาดในการออกจากระบบ
          </Toast.Title>
          <Toast.Action
            className="[grid-area:_action]"
            asChild
            altText="Close"
          >
            <button className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
              </svg>
            </button>
          </Toast.Action>
        </Toast.Root>

        <Toast.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[420px] max-w-[100vw] list-none flex-col gap-2.5 p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]" />
      </Toast.Provider>
    </div>
  );
};

export default Login;
