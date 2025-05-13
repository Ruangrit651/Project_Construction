export type TypeUserAll = {
    user_id: string;
    project_id: string;
    role: string;
    username: string;
    password: string;
    is_active: boolean;  // เพิ่มฟิลด์นี้
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
    projects: {
        project_id: string;
        project_name: string;
        budget: string;
        start_date: string;
        end_date: string;
        status: string;
        project_image: string | null;
        created_at: string;
        created_by: string | null;
        updated_at: string;
        updated_by: string | null;
    };
};


export type TypeUser = {
    user_id : string;
    project_name : string;
    role : string;
    username : string;
    password : string;
    created_at : string;
    created_by : string;
    updated_at : string;
    updated_by : string;
}

export type UserResponse = {
    success: boolean;
    message: string;
    responseObject: TypeUser;
    statusCode:number;
};