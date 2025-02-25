export type TypeProjectAll = {
    project_id : string;
    project_name : string;
    actual : number;
    budget : number;
    status : boolean;
    start_date : string;
    end_date : string;
    created_at : string;
    created_by : string;
    updated_at : string;
    updated_by : string;
    
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