export type PayloadCreateSubtask = {
    task_id?: string | null;
    subtask_name: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status: string;
};

export type PayloadUpdateSubtask = {
    subtask_id: string;
    task_id?: string | null;
    subtask_name?: string;
    description?: string;
    budget?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
};

export type PayloadDeleteSubtask = {
    subtask_id: string;
};