import React, { useState, useEffect } from 'react';
import { Table, Text } from '@radix-ui/themes';
import { getAllProjects } from '@/services/project.service';
import { getProjectUsers } from '@/services/project.service'; // Import from relation.service
import { useNavigate } from 'react-router-dom';
import { TypeRelation } from '@/types/response/response.relation';

const CEOProjectList: React.FC = () => {
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

    // Calculate budget usage percentage
    const calculateBudgetUsage = (budget: number, actual: number) => {
        if (!budget || budget === 0) return "0%";
        const percentage = (actual / budget) * 100;
        return `${percentage.toFixed(1)}%`;
    };

    // Fetch all projects
    useEffect(() => {
        fetchAllProjects();
    }, []);

    const fetchAllProjects = async () => {
        try {
            setLoading(true);
            const response = await getAllProjects();
            console.log("Initial API response:", response);

            // Format project data
            let formattedProjects = Array.isArray(response.responseObject)
                ? response.responseObject.map((item: any) => {
                    return {
                        id: item.project_id,
                        name: item.project_name || "No Name",
                        status: item.status || "Unknown",
                        budget: item.budget || 0,
                        actual: item.actual || 0, // ค่า actual จากฐานข้อมูลที่คำนวณจากทรัพยากร
                        startDate: item.start_date || "-",
                        endDate: item.end_date || "-",
                        manager: null, // Will be filled later
                    };
                })
                : [];

            console.log("Formatted projects before getting managers:", formattedProjects);

            // Fetch manager information for each project
            for (let i = 0; i < formattedProjects.length; i++) {
                if (formattedProjects[i].id) {
                    try {
                        console.log(`Fetching users for project ${formattedProjects[i].id}...`);

                        // Use getProjectUsers from relation.service
                        const usersResponse = await getProjectUsers(formattedProjects[i].id);
                        console.log("Raw API response:", JSON.stringify(usersResponse, null, 2));

                        if (usersResponse && usersResponse.responseObject) {
                            const relations = Array.isArray(usersResponse.responseObject)
                                ? usersResponse.responseObject
                                : [usersResponse.responseObject];

                            // ลองตรวจสอบโครงสร้างข้อมูลจริง
                            console.log("Relations full data:", JSON.stringify(relations, null, 2));

                            // หา Manager ด้วยเงื่อนไขที่หลากหลายขึ้น
                            const managerRelation = relations.find(relation => {
                                const userRole = relation.user?.role?.toLowerCase();
                                const directRole = relation.role?.toLowerCase();
                                const userRoleField = relation.user_role?.toLowerCase();

                                return userRole === 'manager' || directRole === 'manager' || userRoleField === 'manager';
                            });

                            console.log(`Project ${formattedProjects[i].id} manager relation:`, managerRelation);

                            if (managerRelation && managerRelation.user) {
                                console.log(`Found manager for project ${formattedProjects[i].id}:`, managerRelation.user);
                                // Set manager name from the user object
                                formattedProjects[i].manager = managerRelation.user.username;
                            } else {
                                console.log(`No manager relation found for project ${formattedProjects[i].id}`);
                            }
                        } else {
                            console.log(`No users found for project ${formattedProjects[i].id}`);
                        }
                    } catch (err) {
                        console.error(`Failed to get members for project ${formattedProjects[i].id}:`, err);
                    }
                }

                // If still no manager found, use "Not Assigned"
                if (!formattedProjects[i].manager) {
                    console.log(`Setting manager to "Not Assigned" for project ${formattedProjects[i].id}`);
                    formattedProjects[i].manager = "Not Assigned";
                }
            }

            console.log("Final projects with managers:", formattedProjects);
            setProjects(formattedProjects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle project click to navigate to dashboard with project parameters
    const handleProjectClick = (projectId: string, projectName: string) => {
        // Navigate to the dashboard page with project parameters
        navigate(`/CEODashBoard?project_id=${projectId}&project_name=${encodeURIComponent(projectName)}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">All Company Projects</h1>

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
                                <Table.ColumnHeaderCell>Project Manager</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Actual</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Budget Usage</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {projects.length > 0 ? (
                                projects.map((project) => (
                                    <Table.Row
                                        key={project.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <Table.Cell>
                                            <Text
                                                className="text-blue-600 cursor-pointer hover:underline"
                                                onClick={() => handleProjectClick(project.id, project.name)}
                                            >
                                                {project.name}
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell>{project.manager}</Table.Cell>
                                        <Table.Cell>{formatBudget(project.budget)}</Table.Cell>
                                        <Table.Cell>{formatBudget(project.actual)}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                                    <div
                                                        className={`h-2.5 rounded-full ${(project.actual / project.budget) > 1
                                                            ? 'bg-red-500'
                                                            : (project.actual / project.budget) > 0.8
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min((project.actual / project.budget) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                {calculateBudgetUsage(project.budget, project.actual)}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>{formatDate(project.startDate)}</Table.Cell>
                                        <Table.Cell>{formatDate(project.endDate)}</Table.Cell>
                                        <Table.Cell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                    project.status === 'Delayed' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </Table.Cell>
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

export default CEOProjectList;