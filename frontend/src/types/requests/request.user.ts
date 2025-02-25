export type PayloadCreateUser = {
    username : string;
    password : string;
    role : string;
    project_id?: string | null; // เพิ่ม null เพื่อรองรับ No Project
};

export type PayloadUpdateUser = {
    user_id : string;
    username : string;
    password? : string;
    role? : string;
    project_id?: string | null;
}

export type PayloadDeleteUser = {
    user_id : string;
}