import { useEffect, useState, Fragment } from "react";
import { Card, Table, Text, Flex, Spinner, Button, Badge, Box, Heading } from "@radix-ui/themes";
import { getResource } from "@/services/resource.service";
import { getTask, getTaskProject } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import { TypeTask } from "@/types/response/response.task";
import { TypeResourceAll } from "@/types/response/response.resource";
import { TypeSubTask } from "@/types/response/response.subtask";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from "@radix-ui/react-icons";

export default function ResourcePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    // อ่าน URL parameters
    const project_id = searchParams.get('project_id');
    const project_name = searchParams.get('project_name');

    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [subTasks, setSubTasks] = useState<TypeSubTask[]>([]);
    const [resourcesBySubTask, setResourcesBySubTask] = useState<{ [subtask_id: string]: TypeResourceAll[] }>({});
    const [subTasksByTask, setSubTasksByTask] = useState<{ [task_id: string]: TypeSubTask[] }>({});
    const [expandedSubTasks, setExpandedSubTasks] = useState<{ [subtask_id: string]: boolean }>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Function to expand/collapse subtask
    const toggleSubTaskExpansion = (subtask_id: string) => {
        setExpandedSubTasks(prev => ({
            ...prev,
            [subtask_id]: !prev[subtask_id]
        }));
    };

    // Function to expand/collapse all subtasks
    const expandAllSubTasks = (expand: boolean) => {
        const newState = subTasks.reduce((acc, subtask) => {
            acc[subtask.subtask_id] = expand;
            return acc;
        }, {} as { [subtask_id: string]: boolean });

        setExpandedSubTasks(newState);
    };

    // Function to navigate to different views for the same project
    const navigateToProjectView = (view: string) => {
        if (!project_id || !project_name) return;

        switch (view) {
            case 'tasks':
                navigate(`/ManagerTask?project_id=${project_id}&project_name=${encodeURIComponent(project_name || '')}`);
                break;
            case 'resources':
                navigate(`/ManagerResource?project_id=${project_id}&project_name=${encodeURIComponent(project_name || '')}`);
                break;
            default:
                break;
        }
    };

    const getResourceData = async () => {
        setIsLoading(true);
        try {
            if (!project_id) {
                // If no project_id, show no data
                setTasks([]);
                setSubTasks([]);
                setResourcesBySubTask({});
                setSubTasksByTask({});
                setIsLoading(false);
                return;
            }

            const [resTasks, resSubTasks, resResources] = await Promise.all([
                getTaskProject(project_id),
                getSubtask(),
                getResource()
            ]);

            if (resTasks.success && resSubTasks.success && resResources.success) {
                const tasks: TypeTask[] = resTasks.responseObject;
                const allSubTasks: TypeSubTask[] = resSubTasks.responseObject;
                const resourceList: TypeResourceAll[] = resResources.responseObject;

                // Filter tasks by project_id
                const filteredTasks = tasks.filter(task =>
                    task.project_id?.toString() === project_id
                );

                // Get task IDs from the current project only
                const projectTaskIds = filteredTasks.map(task => task.task_id);

                // Filter subtasks that belong to the current project's tasks only
                const filteredSubTasks = allSubTasks.filter(subtask =>
                    projectTaskIds.includes(subtask.task_id)
                );

                // Initialize expanded state for all subtasks as collapsed
                const initialExpandedState = filteredSubTasks.reduce<{ [subtask_id: string]: boolean }>((acc, subtask) => {
                    acc[subtask.subtask_id] = false;
                    return acc;
                }, {});

                // Get subtask IDs from the current project only
                const projectSubtaskIds = filteredSubTasks.map(subtask => subtask.subtask_id);

                // Group resources by subtask (only for subtasks in the current project)
                const resourcesBySubTask = filteredSubTasks.reduce<{ [subtask_id: string]: TypeResourceAll[] }>((acc, subtask) => {
                    const filteredResources = resourceList.filter(resource =>
                        resource.subtask_id && resource.subtask_id === subtask.subtask_id
                    );

                    // เรียงลำดับตาม created_at หรือ resource_id
                    const sortedResources = [...filteredResources].sort((a, b) => {
                        if (a.created_at && b.created_at) {
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        }
                        return a.resource_id.localeCompare(b.resource_id);
                    });

                    acc[subtask.subtask_id] = sortedResources;
                    return acc;
                }, {});

                // Group subtasks by task
                const subTasksByTask = filteredTasks.reduce<{ [task_id: string]: TypeSubTask[] }>((acc, task) => {
                    const taskSubtasks = filteredSubTasks.filter(subtask =>
                        subtask.task_id === task.task_id
                    );

                    // เรียงลำดับตาม created_at เพื่อป้องกันการสลับตำแหน่ง
                    const sortedSubtasks = [...taskSubtasks].sort((a, b) => {
                        if (a.created_at && b.created_at) {
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        }
                        return a.subtask_id.localeCompare(b.subtask_id);
                    });

                    acc[task.task_id] = sortedSubtasks;
                    return acc;
                }, {});

                setTasks(filteredTasks);
                setSubTasks(filteredSubTasks);
                setResourcesBySubTask(resourcesBySubTask);
                setSubTasksByTask(subTasksByTask);
                setExpandedSubTasks(initialExpandedState);
            } else {
                console.error("Failed to fetch data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getResourceData();
    }, [project_id]);

    // Calculate total resources value for each task
    const calculateTaskTotalResources = (task_id: string): number => {
        let total = 0;
        const taskSubTasks = subTasksByTask[task_id] || [];

        taskSubTasks.forEach(subTask => {
            const resources = resourcesBySubTask[subTask.subtask_id] || [];
            resources.forEach(resource => {
                if (typeof resource.total === 'number') {
                    total += resource.total;
                } else {
                    total += Number(resource.total) || 0;
                }
            });
        });

        return total;
    };

    // Calculate total resources value for each subtask
    const calculateSubTaskTotalResources = (subtask_id: string): number => {
        let total = 0;
        const resources = resourcesBySubTask[subtask_id] || [];

        resources.forEach(resource => {
            if (typeof resource.total === 'number') {
                total += resource.total;
            } else {
                total += Number(resource.total) || 0;
            }
        });

        return total;
    };

    // Calculate grand total of all resources
    const calculateGrandTotal = (): number => {
        let total = 0;
        Object.values(resourcesBySubTask).forEach(resources => {
            resources.forEach(resource => {
                if (typeof resource.total === 'number') {
                    total += resource.total;
                } else {
                    total += Number(resource.total) || 0;
                }
            });
        });
        return total;
    };

    // Format currency for display
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <Card variant="surface" style={{ padding: '16px' }}>
            <Flex direction="column" gap="3">
                {/* Project Header section */}
                <div>
                    <Flex direction="column" gap="1">
                        <Heading size="6" className="mt-1">
                            {project_name ? `Project Resources: ${project_name}` : "All Resources"}
                        </Heading>
                    </Flex>
                </div>

                <Flex justify="between" align="center">
                    <Text size="4" weight="bold">Construction Resources</Text>
                    <Flex gap="2">
                        <Button variant="soft" size="2" onClick={() => expandAllSubTasks(true)}>
                            Expand All
                        </Button>
                        <Button variant="soft" size="2" onClick={() => expandAllSubTasks(false)}>
                            Collapse All
                        </Button>
                    </Flex>
                </Flex>

                {isLoading ? (
                    <Flex justify="center" align="center" style={{ height: "200px" }}>
                        <Spinner size="3" />
                    </Flex>
                ) : (
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root variant="surface" style={{ width: '100%' }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell style={{ width: '20%' }}>Task</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '20%' }}>SubTask</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '20%' }}>Resource</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%' }}>Type</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%', textAlign: 'right' }}>Cost</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%', textAlign: 'center' }}>Quantity</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%', textAlign: 'right' }}>Total</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {tasks.map((task) => {
                                    const taskSubTasks = subTasksByTask[task.task_id] || [];
                                    const taskTotal = calculateTaskTotalResources(task.task_id);

                                    // If no subtasks
                                    if (taskSubTasks.length === 0) {
                                        return (
                                            <Table.Row key={`task-${task.task_id}`} style={{ backgroundColor: '#f9f9f9' }}>
                                                <Table.Cell>
                                                    <Flex direction="row" align="center" gap="2">
                                                        <Text weight="bold">{task.task_name}</Text>
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell colSpan={5} style={{ color: '#888' }}>
                                                    No subtasks found
                                                </Table.Cell>
                                                <Table.Cell style={{ textAlign: 'right' }}>
                                                    <Text>{formatCurrency(taskTotal)} THB</Text>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    }

                                    return (
                                        <Fragment key={`task-${task.task_id}`}>
                                            {/* Task Row */}
                                            <Table.Row style={{
                                                backgroundColor: '#ffffff',
                                                borderTop: '2px solid #ddd',
                                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Table.Cell colSpan={6} style={{ padding: '12px 16px' }}>
                                                    <Flex direction="row" align="center" gap="2">
                                                        <Text weight="bold" size="3">{task.task_name}</Text>
                                                        <Badge variant="soft" color="blue" ml="2" radius="full">
                                                            {taskSubTasks.length} subtasks
                                                        </Badge>
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                    <Text weight="bold" size="3">{formatCurrency(taskTotal)} THB</Text>
                                                </Table.Cell>
                                            </Table.Row>

                                            {/* SubTasks */}
                                            {taskSubTasks.map((subTask) => {
                                                const resources = resourcesBySubTask[subTask.subtask_id] || [];
                                                const isExpanded = expandedSubTasks[subTask.subtask_id];
                                                const subTaskTotal = calculateSubTaskTotalResources(subTask.subtask_id);

                                                return (
                                                    <Fragment key={`subtask-${subTask.subtask_id}`}>
                                                        {/* SubTask Row with toggle button */}
                                                        <Table.Row
                                                            style={{
                                                                backgroundColor: '#ffffff',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #eee'
                                                            }}
                                                            onClick={() => toggleSubTaskExpansion(subTask.subtask_id)}
                                                        >
                                                            <Table.Cell></Table.Cell>
                                                            <Table.Cell>
                                                                <Flex direction="row" align="center" gap="2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        style={{ padding: '2px' }}
                                                                    >
                                                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                                    </Button>
                                                                    <Text weight="medium">{subTask.subtask_name}</Text>
                                                                    {resources.length > 0 && (
                                                                        <Badge variant="soft" size="1" color="green">
                                                                            {resources.length} items
                                                                        </Badge>
                                                                    )}
                                                                </Flex>
                                                            </Table.Cell>
                                                            <Table.Cell colSpan={4}></Table.Cell>
                                                            <Table.Cell style={{ textAlign: 'right' }}>
                                                                <Text weight="medium">{formatCurrency(subTaskTotal)} THB</Text>
                                                            </Table.Cell>
                                                        </Table.Row>

                                                        {/* Resources (when expanded = true) */}
                                                        {isExpanded && (
                                                            resources.length === 0 ? (
                                                                <Table.Row style={{ backgroundColor: '#fafafa' }}>
                                                                    <Table.Cell colSpan={2}></Table.Cell>
                                                                    <Table.Cell colSpan={5} style={{ color: '#888', fontStyle: 'italic', padding: '8px 16px' }}>
                                                                        No resources found
                                                                    </Table.Cell>
                                                                </Table.Row>
                                                            ) : (
                                                                resources.map((resource, resourceIndex) => (
                                                                    <Table.Row
                                                                        key={`resource-${resource.resource_id}`}
                                                                        style={{
                                                                            backgroundColor: resourceIndex % 2 === 0 ? '#ffffff' : '#fafafa',
                                                                        }}
                                                                    >
                                                                        <Table.Cell colSpan={2}></Table.Cell>
                                                                        <Table.Cell>{resource.resource_name}</Table.Cell>
                                                                        <Table.Cell>
                                                                            <Badge
                                                                                variant="surface"
                                                                                color={
                                                                                    resource.resource_type === 'equipment' ? 'amber' :
                                                                                        resource.resource_type === 'material' ? 'green' :
                                                                                            resource.resource_type === 'worker' ? 'blue' : 'gray'
                                                                                }
                                                                            >
                                                                                {resource.resource_type}
                                                                            </Badge>
                                                                        </Table.Cell>
                                                                        <Table.Cell style={{ textAlign: 'right' }}>
                                                                            {formatCurrency(resource.cost)} THB
                                                                        </Table.Cell>
                                                                        <Table.Cell style={{ textAlign: 'center' }}>
                                                                            {formatCurrency(resource.quantity)} {resource.unit}
                                                                        </Table.Cell>
                                                                        <Table.Cell style={{ textAlign: 'right' }}>
                                                                            {formatCurrency(typeof resource.total === 'number' ?
                                                                                resource.total :
                                                                                Number(resource.total))} THB
                                                                        </Table.Cell>
                                                                    </Table.Row>
                                                                ))
                                                            )
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </Fragment>
                                    );
                                })}

                                {/* Grand Total row */}
                                <Table.Row style={{ backgroundColor: '#ffffff', borderTop: '2px solid #ddd' }}>
                                    <Table.Cell colSpan={6} style={{ textAlign: 'right' }}>
                                        <Text weight="bold" size="3">Grand Total:</Text>
                                    </Table.Cell>
                                    <Table.Cell style={{ textAlign: 'right' }}>
                                        <Text weight="bold" size="3">
                                            {formatCurrency(calculateGrandTotal())} THB
                                        </Text>
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                    </Box>
                )}
            </Flex>
        </Card>
    );
}