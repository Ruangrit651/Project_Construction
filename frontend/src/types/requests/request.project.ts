export type PayloadCreateProject = {
    project_name : string;
    user_id? : string; // UUID ของผู้ใช้ที่สร้างโปรเจกต์
    actual : number;
    budget : number;
    status : string;
    start_date : string;
    end_date : string;
};

export type PayloadUpdateProject = {
    project_id : string;
    project_name : string;
    user_id? : string; // UUID ของผู้ใช้ที่สร้างโปรเจกต์
    actual : number;
    budget : number;
    status : string;
    start_date : string;
    end_date : string;
}

export type PayloadDeleteProject = {
    project_id : string;
}