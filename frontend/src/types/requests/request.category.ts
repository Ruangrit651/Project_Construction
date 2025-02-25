export type PayloadCreateCategory = {
    category_name: string;
};

export type PayloadUpdateCategory = {
    id: string;
    category_name:string;
}

export type PayloadDeleteCategory = {
    id: string;
}