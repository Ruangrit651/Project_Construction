export type PayloadCreateUser = {
    username : string;
    password : string;
    role : string;
    project_id?: string | null; // เพิ่ม null เพื่อรองรับ No Project
    is_active?: boolean; // เพิ่มฟิลด์นี้เพื่อกำหนดสถานะเริ่มต้น
};

export type PayloadUpdateUser = {
    user_id : string;
    username : string;
    password? : string;
    role? : string;
    project_id?: string | null;
    is_active?: boolean; // เพิ่มฟิลด์นี้เพื่อกำหนดสถานะเริ่มต้น
}

export type PayloadDeleteUser = {
    user_id : string;
}