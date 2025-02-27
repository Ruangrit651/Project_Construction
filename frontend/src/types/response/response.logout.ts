export type LogoutResponse = {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        user_id: string;
        username: string;
        role: string;
    };
};