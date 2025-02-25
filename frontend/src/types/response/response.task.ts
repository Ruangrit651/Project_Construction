export type TypeTaskAll = {
    task_id: string;
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: boolean;
    // created_at?: string;
    // created_by?: string;
    // updated_at?: string;
    // updated_by?: string;
}


export type TypeTask = {
    task_id: string;
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: boolean;
    // created_at?: string;
    // created_by?: string;
    // updated_at?: string;
    // updated_by?: string;
}

export type TaskResponse = {
    success: boolean;
    message: string;
    responseObject: TypeTask;
    statusCode:number;
};