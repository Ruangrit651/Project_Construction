export type TypeSubTaskAll = {
    subtask_id: string;
    task_id: string;
    subtask_name: string;
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

export type TypeSubTask = {
    subtask_id: string;
    task_id: string;
    subtask_name: string;
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

export type SubtaskResponse = {
    success: boolean;
    message: string;
    responseObject: TypeSubTask;
    statusCode: number;
};