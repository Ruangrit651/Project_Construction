import { useEffect, useState, Fragment } from "react";
import { Card, Table, Text, Flex, Spinner } from "@radix-ui/themes";
import { getResource } from "@/services/resource.service";
import { getTask } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import { TypeTask } from "@/types/response/response.task";
import { TypeResourceAll } from "@/types/response/response.resource";
import { TypeSubTask } from "@/types/response/response.subtask";

export default function ResourcePage() {
    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [subTasks, setSubTasks] = useState<TypeSubTask[]>([]);
    const [resourcesBySubTask, setResourcesBySubTask] = useState<{ [subtask_id: string]: TypeResourceAll[] }>({});
    const [subTasksByTask, setSubTasksByTask] = useState<{ [task_id: string]: TypeSubTask[] }>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getResourceData = async () => {
        setIsLoading(true);
        try {
            const [resTasks, resSubTasks, resResources] = await Promise.all([
                getTask(),
                getSubtask(),
                getResource()
            ]);

            if (resTasks.success && resSubTasks.success && resResources.success) {
                const tasks: TypeTask[] = resTasks.responseObject;
                const subTasks: TypeSubTask[] = resSubTasks.responseObject;
                const resourceList: TypeResourceAll[] = resResources.responseObject;

                // Group resources by subtask
                const resourcesBySubTask = subTasks.reduce<{ [subtask_id: string]: TypeResourceAll[] }>((acc, subtask) => {
                    const filteredResources = resourceList.filter(resource =>
                        resource.subtask_id && resource.subtask_id === subtask.subtask_id
                    );
                    acc[subtask.subtask_id] = filteredResources;
                    return acc;
                }, {});

                // Group subtasks by task
                const subTasksByTask = tasks.reduce<{ [task_id: string]: TypeSubTask[] }>((acc, task) => {
                    acc[task.task_id] = subTasks.filter(subtask =>
                        subtask.task_id === task.task_id
                    );
                    return acc;
                }, {});

                setTasks(tasks);
                setSubTasks(subTasks);
                setResourcesBySubTask(resourcesBySubTask);
                setSubTasksByTask(subTasksByTask);
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
    }, []);

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

    return (
        <Card variant="surface">
            <Text size="4" weight="bold">Resources</Text>
            {isLoading ? (
                <Flex justify="center" align="center" style={{ height: "200px" }}>
                    <Spinner size="3" />
                </Flex>
            ) : (
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>SubTask Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Resource Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Resource Type</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Cost</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Quantity</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tasks.map((task) => {
                            const taskSubTasks = subTasksByTask[task.task_id] || [];
                            const taskTotal = calculateTaskTotalResources(task.task_id);

                            // If no subtasks
                            if (taskSubTasks.length === 0) {
                                return (
                                    <Table.Row key={`task-${task.task_id}`}>
                                        <Table.Cell>
                                            <Flex direction="row" align="center" gap="2">
                                                <Text>{task.task_name}</Text>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell colSpan={6}>No subtasks available</Table.Cell>
                                    </Table.Row>
                                );
                            }

                            // With subtasks
                            return taskSubTasks.map((subTask, subTaskIndex) => {
                                const resources = resourcesBySubTask[subTask.subtask_id] || [];

                                // If no resources in this subtask
                                if (resources.length === 0) {
                                    return (
                                        <Table.Row key={`subtask-${subTask.subtask_id}`}>
                                            {subTaskIndex === 0 && (
                                                <Table.Cell rowSpan={taskSubTasks.length}>
                                                    <Flex direction="row" align="center" gap="2">
                                                        <Text>{task.task_name}</Text>
                                                    </Flex>
                                                </Table.Cell>
                                            )}
                                            <Table.Cell>
                                                <Text>{subTask.subtask_name}</Text>
                                            </Table.Cell>
                                            <Table.Cell colSpan={5}>No resources</Table.Cell>
                                        </Table.Row>
                                    );
                                }

                                // Show resources under subtask
                                return resources.map((resource, resourceIndex) => (
                                    <Table.Row key={`resource-${resource.resource_id}`}>
                                        {/* Task cell - show only in first row of each task */}
                                        {subTaskIndex === 0 && resourceIndex === 0 && (
                                            <Table.Cell rowSpan={taskSubTasks.reduce((acc, st) => {
                                                return acc + Math.max(1, (resourcesBySubTask[st.subtask_id] || []).length);
                                            }, 0)}>
                                                <Flex direction="row" align="center" gap="2">
                                                    <Text>{task.task_name}</Text>
                                                </Flex>
                                            </Table.Cell>
                                        )}

                                        {/* SubTask cell - show only in first row of each subtask */}
                                        {resourceIndex === 0 && (
                                            <Table.Cell rowSpan={resources.length}>
                                                <Text>{subTask.subtask_name}</Text>
                                            </Table.Cell>
                                        )}

                                        <Table.Cell>{resource.resource_name}</Table.Cell>
                                        <Table.Cell>{resource.resource_type}</Table.Cell>
                                        <Table.Cell className="align-left">
                                            {new Intl.NumberFormat("en-US").format(resource.cost)}
                                        </Table.Cell>
                                        <Table.Cell className="align-center">
                                            {new Intl.NumberFormat("en-US").format(resource.quantity)}
                                        </Table.Cell>
                                        <Table.Cell className="align-left">
                                            {new Intl.NumberFormat("en-US").format(resource.total)}
                                        </Table.Cell>
                                    </Table.Row>
                                ));
                            });
                        })}

                        {/* Grand total row */}
                        <Table.Row>
                            <Table.Cell colSpan={6} className="text-right">
                                <Text weight="bold">Grand Total:</Text>
                            </Table.Cell>
                            <Table.Cell>
                                <Text weight="bold">
                                    {(() => {
                                        let allResourcesTotal = 0;
                                        
                                        Object.values(resourcesBySubTask).forEach(resources => {
                                            resources.forEach(resource => {
                                                const resourceTotal = typeof resource.total === 'number'
                                                    ? resource.total
                                                    : Number(resource.total) || 0;
                                                
                                                allResourcesTotal += resourceTotal;
                                            });
                                        });
                                        
                                        return new Intl.NumberFormat("en-US").format(allResourcesTotal);
                                    })()}
                                </Text>
                            </Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table.Root>
            )}
        </Card>
    );
}