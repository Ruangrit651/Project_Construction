// category
export const GET_CATEGORY_ALL = "/v1/category/get";
export const CREATE_CATEGORY = "/v1/category/create";
export const UPDATE_CATEGORY = "/v1/category/update";
export const DELETE_CATEGORY = "/v1/category/delete";

// user
export const GET_USER_ALL = "/v1/user/get";
export const CREATE_USER = "/v1/user/create";
export const UPDATE_USER = "/v1/user/update";
export const DELETE_USER = "/v1/user/delete";
export const TOGGLE_USER_STATUS = "/v1/user/toggle-status";

// project
export const GET_PROJECT_ALL = "/v1/project/get";
export const CREATE_PROJECT = "/v1/project/create";
export const UPDATE_PROJECT = "/v1/project/update";
export const DELETE_PROJECT = "/v1/project/delete";
export const GET_MANAGER_PROJECTS = "/v1/project/manager";
export const GET_PROJECT_ALL_AVAILABLE = "/v1/project/available";

// roles
export const GET_ROLE_ALL = "/v1/role/get";
export const CREATE_ROLE = "/v1/role/create";
export const UPDATE_ROLE = "/v1/role/update";
export const DELETE_ROLE = "/v1/role/delete";

//task
export const GET_TASK_ALL = "/v1/task/get";
export const CREATE_TASK = "/v1/task/create";
export const UPDATE_TASK = "/v1/task/update";
export const DELETE_TASK = "/v1/task/delete";
export const UPDATE_START_DATE_TASK = "/v1/task/updatestartdate";
export const UPDATE_END_DATE_TASK = "/v1/task/updateenddate";
export const GET_TASK_PROJECT = "/v1/task/project";


//subtask
export const GET_SUBTASK_ALL = "/v1/subtask/get";
export const CREATE_SUBTASK = "/v1/subtask/create";
export const UPDATE_SUBTASK = "/v1/subtask/update";
export const DELETE_SUBTASK = "/v1/subtask/delete";

//resource
export const GET_RESOURCE_ALL = "/v1/resource/get"
export const CREATE_RESOURCE = "/v1/resource/create"
export const UPDATE_RESOURCE = "/v1/resource/update"
export const DELETE_RESOURCE = "/v1/resource/delete"

// login
export const LOGIN = "/v1/auth/login";
export const LOGOUT = "/v1/auth/logout";

// dashboard
export const GET_DASHBOARD = "/v1/dashboard/get";

// progress
export const GET_PROGRESS_ALL = "/v1/progress/get";
export const CREATE_PROGRESS = "/v1/progress/create";
export const UPDATE_PROGRESS = "/v1/progress/update";
export const DELETE_PROGRESS = "/v1/progress/delete";

// relations
export const GET_ALL_RELATIONS = "/v1/relations/get";
export const GET_PROJECT_RELATIONS = "/v1/relations/project";
export const GET_USER_RELATIONS = "/v1/relations/user";
export const CREATE_RELATION = "/v1/relations/create";
export const DELETE_RELATION = "/v1/relations/delete";
export const DELETE_RELATION_BY_PROJECT_USER = "/v1/relations/remove";

// project users management (alternative API for relation management)
export const GET_PROJECT_USERS = "/v1/project/users";
export const ADD_USER_TO_PROJECT = "/v1/project/users";
export const REMOVE_USER_FROM_PROJECT = "/v1/project/users";

// user projects management
export const GET_USER_PROJECTS = "/v1/user/projects";