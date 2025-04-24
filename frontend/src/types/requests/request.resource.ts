export type PayloadCreateResource = {
    task_id: string;
    subtask_id?: string; // Optional subtask_id
    resource_name: string;
    resource_type: string;
    cost: number;
    total: number;
    quantity: number;
    
};

export type PayloadUpdateResource = {
    resource_id: string;
    task_id: string;
    resource_name: string;
    resource_type: string;
    cost: number;
    total: number;
    quantity: number;
}

export type PayloadDeleteResource = {
    resource_id: string;
}