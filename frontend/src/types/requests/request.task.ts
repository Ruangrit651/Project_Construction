export type PayloadCreateTask = {
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
    dependencies?: string[]; // Make dependencies optional
};

export type PayloadUpdateTask = {
    task_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
    dependencies?: string[]; // Make dependencies optional here as well
}

export type PayloadDeleteTask = {
    task_id : string;
}