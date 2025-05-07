export type User = {
    user_id: string;
    username: string;
    role: 'Admin' | 'RootAdmin' | 'CEO' | 'Manager' | 'Employee';
  };

export type LoginResponse = {
    success: boolean;
    message: string;
    token?: string; // ถ้ามี Token
    user?: {
        user_id: string;
        username: string;
        role: string;
    };
};
