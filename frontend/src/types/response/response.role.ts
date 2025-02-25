export type TypeRoleAll = {
  role_id: string;
  name: string;
};

export type TypeRole = {
    role_id : string;
    name : string;
}

export type RoleResponse = {
    success: boolean;
    message: string;
    responseObject: TypeRoleAll[];
    statusCode: number;
  };