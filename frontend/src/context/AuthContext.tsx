import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/response/response.login';
import { logoutUser } from '@/services/logout.service';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // ตรวจสอบว่ามีข้อมูลผู้ใช้ใน localStorage หรือไม่เมื่อโหลดแอพ
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // บันทึกหรือลบข้อมูลผู้ใช้ใน localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // ตรวจสอบว่าผู้ใช้มี role ตามที่กำหนดหรือไม่
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const roleArray = typeof roles === 'string' ? [roles] : roles;
    return roleArray.includes(user.role);
  };

  // ฟังก์ชันสำหรับออกจากระบบ
  const logout = async () => {
    try {
      if (user) {
        // เรียก API logout ถ้ามี user
        await logoutUser({ user_id: user.user_id });
      }
      // ล้างข้อมูลผู้ใช้ไม่ว่าการเรียก API จะสำเร็จหรือไม่ก็ตาม
      setUser(null);
      localStorage.removeItem('user');
      return Promise.resolve();
    } catch (error) {
      console.error('Logout failed:', error);
      return Promise.reject(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};