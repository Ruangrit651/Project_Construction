export type PayloadCreateTask = {
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
};

export type PayloadUpdateTask = {
    task_id: string; 
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
}

export type PayloadDeleteTask = {
    task_id : string;
}