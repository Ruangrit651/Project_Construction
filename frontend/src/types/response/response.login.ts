export type User = {
    user_id: string;
    username: string;
    role: string;
    
};

// export type LoginResponse = {
//     success: boolean;
//     message: string;
//     token?: string; // ถ้ามี Token
//     user?: {
//         user_id: string;
//         username: string;
//         role: string;
//     };
// };

export interface LoginResponse {
    success: boolean;
    message?: string;
    responseObject?: {
        role: string;
        // other properties of responseObject
    };
}