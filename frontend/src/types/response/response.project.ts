export type User = {
    user_id: string;
    username: string;
}

export type TypeProjectAll = {
    project_id : string;
    project_name : string;
    actual : number;
    budget : number;
    status : string;
    start_date : string;
    end_date : string;
    created_at : string;
    created_by : string;
    updated_at : string;
    updated_by : string;
    user_id : string;
    owner?: User; // ข้อมูลผู้ใช้ที่สร้างโปรเจกต์
}

export type TypeProject = {
    project_id : string;
    project_name : string;
    actual : number;
    budget : number;
    status : string;
    start_date : string;
    end_date : string;
    created_at : string;
    created_by : string;
    updated_at : string;
    updated_by : string;
}

export type ProjectResponse = {
    success: boolean;
    message: string;
    responseObject: TypeProject;
    statusCode:number;
};