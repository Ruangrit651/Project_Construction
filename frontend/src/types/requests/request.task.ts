export type PayloadCreateTask = {
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: boolean;
};

export type PayloadUpdateTask = {
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: boolean;
}

export type PayloadDeleteTask = {
    task_id : string;
}