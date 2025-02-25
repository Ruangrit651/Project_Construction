export type TypeResourceAll = {
    resource_id: string,
    resource_name: string,
    resource_type: string,
    cost: number,
    total: number,
    quantity: number,
    task_id: string, 
    // created_at?: string,
    // created_by?: string,
    // updated_at?: string,
    // updated_by?: string,
    tasks: {
        task_name: string
    }

}


export type TypeResource = {
    resource_id: string,
    resource_name: string,
    resource_type: string,
    cost: number,
    total: number,
    quantity: number,
    task_id: string, 
    // created_at?: string,
    // created_by?: string,
    // updated_at?: string,
    // updated_by?: string,
}

export type ResourceResponse = {
    success: boolean;
    message: string;
    responseObject: TypeResource;
    statusCode:number;
};