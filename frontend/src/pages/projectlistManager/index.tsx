// import React, { useState, useEffect } from 'react';
// import { Table } from '@radix-ui/themes';
// import { getProjectAvailable } from '@/services/project.service';

// const ProjectListManager: React.FC = () => {
//     const [projects, setProjects] = useState<any[]>([]);
//     const [loading, setLoading] = useState<boolean>(false);


//     // Format budget to display with commas
//     const formatBudget = (budget: number | undefined) => {
//         if (!budget && budget !== 0) return "-";
//         return Number(budget).toLocaleString('en-US', {
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 0
//         });
//     };

//     // Format date to display in dd/mm/yyyy format
//     const formatDate = (dateString: string | undefined) => {
//         if (!dateString || dateString === "-") return "-";
        
//         try {
//             const date = new Date(dateString);
            
//             // Check if date is valid
//             if (isNaN(date.getTime())) return "-";
            
//             // Format as dd/mm/yyyy
//             return date.toLocaleDateString('th-TH', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric'
//             });
//         } catch (error) {
//             console.error("Error formatting date:", error);
//             return "-";
//         }
//     };

//     // Fetch available projects for the current user (using token)
//     useEffect(() => {
//         fetchProject();
//     }, []);

//     const fetchProject = async () => {
//         try {
//             setLoading(true);
//             const response = await getProjectAvailable();
//             console.log("Project data:", response.responseObject);

//             // แปลงโครงสร้างข้อมูลให้ตรงกับที่ต้องการใช้ในการแสดงผล
//             const formattedProjects = Array.isArray(response.responseObject)
//                 ? response.responseObject.map((item: {
//                     project?: {
//                         project_id?: number;
//                         project_name?: string;
//                         description?: string;
//                         status?: string;
//                         budget?: number;
//                         actual?: number;
//                         start_date?: string;
//                         end_date?: string;
//                         created_at?: string;
//                         owner?: {
//                             username?: string;
//                         };
//                     };
//                     project_id?: number;
//                     status?: string;
//                 }) => {
//                     console.log("Processing item:", item); // ใส่ log เพื่อตรวจสอบข้อมูลที่ได้รับ

//                     return {
//                         id: item.project?.project_id || item.project_id,
//                         name: item.project?.project_name || "No Name",
//                         status: item.project?.status || "Unknown",
//                         budget: item.project?.budget || 0,
//                         actual: item.project?.actual || 0,
//                         startDate: item.project?.start_date || "-",
//                         endDate: item.project?.end_date || "-",
//                     };
//                 })
//                 : [];

//             console.log("Formatted projects:", formattedProjects); // ใส่ log เพื่อตรวจสอบข้อมูลที่แปลงแล้ว
//             setProjects(formattedProjects);

//             if (!response.success) {
//                 console.error("Failed to fetch projects");
//             }
//         } catch (error) {
//             console.error("Error fetching projects:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="container mx-auto px-4 py-8">
//             <h1 className="text-2xl font-bold mb-6">Projects</h1>

//             {loading ? (
//                 <div className="flex justify-center items-center h-40">
//                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//                 </div>
//             ) : (
//                 <div className="overflow-x-auto">
//                     <Table.Root variant="surface">
//                         <Table.Header>
//                             <Table.Row>
//                                 <Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Actual</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
//                                 <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
//                             </Table.Row>
//                         </Table.Header>
//                         <Table.Body>
//                             {projects.length > 0 ? (
//                                 projects.map((project, index) => (
//                                     <Table.Row key={project.id || `project-${index}`}>
//                                         <Table.Cell>{project.name}</Table.Cell>
//                                         <Table.Cell>{formatBudget(project.budget)}</Table.Cell>
//                                         <Table.Cell>{formatBudget(project.actual)}</Table.Cell>
//                                         <Table.Cell>{formatDate(project.startDate)}</Table.Cell>
//                                         <Table.Cell>{formatDate(project.endDate)}</Table.Cell>
//                                         <Table.Cell>{project.status}</Table.Cell>
//                                     </Table.Row>
//                                 ))
//                             ) : (
//                                 <Table.Row>
//                                     <Table.Cell colSpan={8} className="text-center py-8">
//                                         No projects available
//                                     </Table.Cell>
//                                 </Table.Row>
//                             )}
//                         </Table.Body>
//                     </Table.Root>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ProjectListManager;

import React, { useState, useEffect } from 'react';
import { Table, Text } from '@radix-ui/themes';
import { getProjectAvailable } from '@/services/project.service';
import { useNavigate } from 'react-router-dom';

const ProjectListManager: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // Format budget to display with commas
    const formatBudget = (budget: number | undefined) => {
        if (!budget && budget !== 0) return "-";
        return Number(budget).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Fetch available projects for the current user (using token)
    useEffect(() => {
        fetchProject();
    }, []);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await getProjectAvailable();
            console.log("Project data:", response.responseObject);

            // แปลงโครงสร้างข้อมูลให้ตรงกับที่ต้องการใช้ในการแสดงผล
            const formattedProjects = Array.isArray(response.responseObject)
                ? response.responseObject.map((item: {
                    project?: {
                        project_id?: number;
                        project_name?: string;
                        description?: string;
                        status?: string;
                        budget?: number;
                        actual?: number;
                        start_date?: string;
                        end_date?: string;
                        created_at?: string;
                        owner?: {
                            username?: string;
                        };
                    };
                    project_id?: number;
                    status?: string;
                }) => {
                    console.log("Processing item:", item);

                    return {
                        id: item.project?.project_id || item.project_id,
                        name: item.project?.project_name || "No Name",
                        status: item.project?.status || "Unknown",
                        budget: item.project?.budget || 0,
                        actual: item.project?.actual || 0,
                        startDate: item.project?.start_date || "-",
                        endDate: item.project?.end_date || "-",
                    };
                })
                : [];

            console.log("Formatted projects:", formattedProjects);
            setProjects(formattedProjects);

            if (!response.success) {
                console.error("Failed to fetch projects");
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    // Function to navigate to the task list page with project ID using React Router
    const goToTaskList = (projectId: number, projectName: string) => {
        navigate(`/ManagerTask?project_id=${projectId}&project_name=${encodeURIComponent(projectName)}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Projects</h1>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table.Root variant="surface">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Actual</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {projects.length > 0 ? (
                                projects.map((project, index) => (
                                    <Table.Row key={project.id || `project-${index}`}>
                                        <Table.Cell>
                                            <Text 
                                                className="text-blue-600 cursor-pointer hover:underline"
                                                onClick={() => goToTaskList(project.id, project.name)}
                                            >
                                                {project.name}
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell>{formatBudget(project.budget)}</Table.Cell>
                                        <Table.Cell>{formatBudget(project.actual)}</Table.Cell>
                                        <Table.Cell>{formatDate(project.startDate)}</Table.Cell>
                                        <Table.Cell>{formatDate(project.endDate)}</Table.Cell>
                                        <Table.Cell>{project.status}</Table.Cell>
                                    </Table.Row>
                                ))
                            ) : (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8">
                                        No projects available
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Root>
                </div>
            )}
        </div>
    );
};

export default ProjectListManager;