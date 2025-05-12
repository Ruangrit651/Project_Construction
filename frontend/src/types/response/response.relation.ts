export type TypeRelation = {
    relation_id: string;
    project_id: string;
    user_id: string;
    created_at: string;
    project?: {
      project_id: string;
      project_name: string;
    };
    user?: {
      user_id: string;
      username: string;
      role: string;
    };
  };
  
  export type RelationResponse = {
    success: boolean;
    message: string;
    responseObject: TypeRelation | TypeRelation[];
    statusCode: number;
  };