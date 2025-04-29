import { useEffect, useState, Fragment } from "react";
import { Card, Table, Text, Flex, Spinner, Button, Badge, Box } from "@radix-ui/themes";
import { getResource } from "@/services/resource.service";
import { getTask } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import { TypeTask } from "@/types/response/response.task";
import { TypeResourceAll } from "@/types/response/response.resource";
import { TypeSubTask } from "@/types/response/response.subtask";
import DialogAddResource from "./components/DialogAddResource";
import DialogEditResource from "./components/DialogEditResource";
import AlertDialogDeleteResource from "./components/alertDialogDeleteResource";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

export default function ResourcePage() {
    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [subTasks, setSubTasks] = useState<TypeSubTask[]>([]);
    const [resourcesBySubTask, setResourcesBySubTask] = useState<{ [subtask_id: string]: TypeResourceAll[] }>({});
    const [subTasksByTask, setSubTasksByTask] = useState<{ [task_id: string]: TypeSubTask[] }>({});
    const [expandedSubTasks, setExpandedSubTasks] = useState<{ [subtask_id: string]: boolean }>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // เพิ่มฟังก์ชันสำหรับการขยาย/หุบ subtask
    const toggleSubTaskExpansion = (subtask_id: string) => {
        setExpandedSubTasks(prev => ({
            ...prev,
            [subtask_id]: !prev[subtask_id]
        }));
    };

    // เพิ่มฟังก์ชันเพื่อขยายทั้งหมด/หุบทั้งหมด
    const expandAllSubTasks = (expand: boolean) => {
        const newState = subTasks.reduce((acc, subtask) => {
            acc[subtask.subtask_id] = expand;
            return acc;
        }, {} as { [subtask_id: string]: boolean });

        setExpandedSubTasks(newState);
    };

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

                // กำหนดค่าเริ่มต้นให้ทุก subtask เป็น collapsed
                const initialExpandedState = subTasks.reduce<{ [subtask_id: string]: boolean }>((acc, subtask) => {
                    acc[subtask.subtask_id] = false;
                    return acc;
                }, {});

                // ใช้วิธีจับคู่แบบยืดหยุ่นขึ้น
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
    }, []);

    // คำนวณมูลค่า Resources ทั้งหมดในแต่ละ Task
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

    // คำนวณมูลค่า Resources ทั้งหมดในแต่ละ SubTask
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

    return (
        <Card variant="surface" style={{ padding: '16px' }}>
            <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                    <Text size="4" weight="bold">ทรัพยากรงานก่อสร้าง</Text>
                    <Flex gap="2">
                        <Button variant="soft" size="2" onClick={() => expandAllSubTasks(true)}>
                            ขยายทั้งหมด
                        </Button>
                        <Button variant="soft" size="2" onClick={() => expandAllSubTasks(false)}>
                            ยุบทั้งหมด
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
                                    <Table.ColumnHeaderCell style={{ width: '15%' }}>Resource</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%' }}>Type</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%', textAlign: 'right' }}>Cost</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%', textAlign: 'center' }}>Quantity</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '10%', textAlign: 'right' }}>Total</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell style={{ width: '15%' }}>Actions</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {tasks.map((task) => {
                                    const taskSubTasks = subTasksByTask[task.task_id] || [];
                                    const taskTotal = calculateTaskTotalResources(task.task_id);

                                    // หากไม่มี subtask
                                    if (taskSubTasks.length === 0) {
                                        return (
                                            <Table.Row key={`task-${task.task_id}`} style={{ backgroundColor: '#f9f9f9' }}>
                                                <Table.Cell>
                                                    <Flex direction="row" align="center" gap="2">
                                                        <Text weight="bold">{task.task_name}</Text>
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell colSpan={6} style={{ color: '#888' }}>
                                                    ไม่มีงานย่อย
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text>Task total: {new Intl.NumberFormat("en-US").format(taskTotal)}</Text>
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
                                                            {taskSubTasks.length} งานย่อย
                                                        </Badge>
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell style={{ textAlign: 'right', padding: '12px 16px' }}>
                                                    <Text weight="bold" size="3" >{new Intl.NumberFormat("en-US").format(taskTotal)}</Text>
                                                </Table.Cell>
                                                <Table.Cell></Table.Cell>
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
                                                                            {resources.length} รายการ
                                                                        </Badge>
                                                                    )}
                                                                </Flex>
                                                            </Table.Cell>
                                                            <Table.Cell colSpan={4}></Table.Cell>
                                                            <Table.Cell style={{ textAlign: 'right' }}>
                                                                <Text weight="medium">{new Intl.NumberFormat("en-US").format(subTaskTotal)}</Text>
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                <Flex justify="end">
                                                                    <DialogAddResource
                                                                        getResourceData={getResourceData}
                                                                        task_id={task.task_id}
                                                                        subtask_id={subTask.subtask_id}
                                                                    />
                                                                </Flex>
                                                            </Table.Cell>
                                                        </Table.Row>

                                                        {/* Resources (เมื่อ expanded = true) */}
                                                        {isExpanded && (
                                                            resources.length === 0 ? (
                                                                <Table.Row style={{ backgroundColor: '#fafafa' }}>
                                                                    <Table.Cell colSpan={2}></Table.Cell>
                                                                    <Table.Cell colSpan={5} style={{ color: '#888', fontStyle: 'italic', padding: '8px 16px' }}>
                                                                        ไม่มีทรัพยากร
                                                                    </Table.Cell>
                                                                    <Table.Cell></Table.Cell>
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
                                                                            {new Intl.NumberFormat("en-US").format(resource.cost)}
                                                                        </Table.Cell>
                                                                        <Table.Cell style={{ textAlign: 'center' }}>
                                                                            {new Intl.NumberFormat("en-US").format(resource.quantity)}
                                                                        </Table.Cell>
                                                                        <Table.Cell style={{ textAlign: 'right' }}>
                                                                            {new Intl.NumberFormat("en-US").format(resource.total)}
                                                                        </Table.Cell>
                                                                        <Table.Cell>
                                                                            <Flex gap="2" justify="end">
                                                                                <DialogEditResource
                                                                                    getResourceData={getResourceData}
                                                                                    resource={resource}
                                                                                />
                                                                                <AlertDialogDeleteResource
                                                                                    getResourceData={getResourceData}
                                                                                    resource_id={resource.resource_id}
                                                                                    task_name={task.task_name}
                                                                                    resource_name={resource.resource_name}
                                                                                />
                                                                            </Flex>
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

                                {/* แสดงรวมทั้งหมด */}
                                <Table.Row style={{ backgroundColor: '#ffffff', borderTop: '2px solid #ddd' }}>
                                    <Table.Cell colSpan={6} style={{ textAlign: 'right' }}>
                                        <Text weight="bold" size="3">Grand Total:</Text>
                                    </Table.Cell>
                                    <Table.Cell style={{ textAlign: 'right' }}>
                                        <Text weight="bold" size="3">
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
                                    <Table.Cell></Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                    </Box>
                )}
            </Flex>
        </Card>
    );
}