export type PayloadCreateRelation = {
    project_id: string;
    user_id: string;
  };
  
  export type PayloadDeleteRelation = {
    relation_id: string;
  };
  
  export type PayloadDeleteRelationByProjectUser = {
    project_id: string;
    user_id: string;
  };