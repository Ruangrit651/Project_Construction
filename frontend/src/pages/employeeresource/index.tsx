// import { useEffect, useState, Fragment } from "react";
// import { Card, Table, Text, Flex, Spinner } from "@radix-ui/themes";
// import { getResource } from "@/services/resource.service";
// import { getTask } from "@/services/task.service";
// import { TypeTask } from "@/types/response/response.task";
// import { TypeResourceAll } from "@/types/response/response.resource";
// import DialogAddResource from "./components/DialogAddResource";
// import DialogEditResource from "./components/DialogEditResource";
// import AlertDialogDeleteResource from "./components/alertDialogDeleteResource";

// export default function ResourcePage() {
//     const [groupedResources, setGroupedResources] = useState<{ [task_id: string]: TypeResourceAll[] }>({});
//     const [tasks, setTasks] = useState<TypeTask[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(true);

//     const getResourceData = async () => {
//         setIsLoading(true);
//         try {
//             const [resTasks, resResources] = await Promise.all([getTask(), getResource()]);

//             if (resTasks.success && resResources.success) {
//                 const tasks: TypeTask[] = resTasks.responseObject;
//                 const resourceList: TypeResourceAll[] = resResources.responseObject;

//                 const grouped = tasks.reduce<{ [task_id: string]: TypeResourceAll[] }>((acc, task) => {
//                     acc[task.task_id] = resourceList.filter(resource => resource.task_id === task.task_id);
//                     return acc;
//                 }, {});

//                 setTasks(tasks);
//                 setGroupedResources(grouped);
//             } else {
//                 console.error("Failed to fetch tasks or resources");
//             }
//         } catch (error) {
//             console.error("Error fetching tasks or resources:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         getResourceData();
//     }, []);

//     return (
//         <Card variant="surface">
//             <Text size="4" weight="bold">Resources</Text>
//             {isLoading ? (
//                 <Flex justify="center" align="center" style={{ height: "200px" }}>
//                     <Spinner size="3" />
//                 </Flex>
//             ) : (
//                 <Table.Root variant="surface">
//                     <Table.Header>
//                         <Table.Row>
//                             {/* <Table.ColumnHeaderCell>Task ID</Table.ColumnHeaderCell> */}
//                             <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Resource Name</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Resource Type</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Cost</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Quantity</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
//                         </Table.Row>
//                     </Table.Header>
//                     <Table.Body>
//                         {Object.entries(groupedResources).map(([task_id, taskResources]) => {
//                             const task = tasks.find(t => t.task_id === task_id);
//                             return (
//                                 <Fragment key={task_id}>
//                                     {taskResources.length > 0 ? (
//                                         taskResources.map((resource, index) => (
//                                             <Table.Row key={resource.resource_id}>
//                                                 {index === 0 && (
//                                                     <>
//                                                         {/* <Table.Cell rowSpan={taskResources.length}>{task_id}</Table.Cell> */}
//                                                         <Table.Cell rowSpan={taskResources.length}>
//                                                             <Flex direction="row" align="center" gap="2">
//                                                                 <Text>{task?.task_name}</Text>
//                                                             </Flex>
//                                                         </Table.Cell>
//                                                     </>
//                                                 )}
//                                                 <Table.Cell>{resource.resource_name}</Table.Cell>
//                                                 <Table.Cell>{resource.resource_type}</Table.Cell>
//                                                 <Table.Cell className="align-left">{new Intl.NumberFormat("en-US").format(resource.cost)}</Table.Cell>
//                                                 <Table.Cell className="align-center">{new Intl.NumberFormat("en-US").format(resource.quantity)}</Table.Cell>
//                                                 <Table.Cell className="align-left">{new Intl.NumberFormat("en-US").format(resource.total)}</Table.Cell>
//                                                 <Table.Cell colSpan={2}>
//                                                     <Flex gap="2" align="center">
//                                                         <div className="w-[72px] h-[36px] flex items-center justify-center">
//                                                             {index === 0 && (
//                                                             <DialogAddResource getResourceData={getResourceData} task_id={task_id} />
//                                                             )}
//                                                         </div>

//                                                         <DialogEditResource getResourceData={getResourceData} resource={resource} />
//                                                         <AlertDialogDeleteResource
//                                                             getResourceData={getResourceData}
//                                                             resource_id={resource.resource_id}
//                                                             task_name={resource.tasks.task_name}
//                                                             resource_name={resource.resource_name}
//                                                         />
//                                                     </Flex>
//                                                 </Table.Cell>
//                                             </Table.Row>
//                                         ))
//                                     ) : (
//                                         <Table.Row>
//                                             {/* <Table.Cell>{task_id}</Table.Cell> */}
//                                             <Table.Cell>
//                                                 <Flex direction="row" align="center" gap="2">
//                                                     <Text>{task?.task_name}</Text>
//                                                 </Flex>
//                                             </Table.Cell>
//                                             <Table.Cell colSpan={5}>No resources</Table.Cell> 
//                                             <Table.Cell>
//                                                 <Flex gap="2">
//                                                     <DialogAddResource getResourceData={getResourceData} task_id={task_id} />
//                                                 </Flex>
//                                             </Table.Cell>
//                                         </Table.Row>
//                                     )}
//                                 </Fragment>
//                             );
//                         })}
//                     </Table.Body>
//                 </Table.Root>
//             )}
//         </Card>
//     );
// };

import { useEffect, useState, Fragment } from "react";
import { Card, Table, Text, Flex, Spinner } from "@radix-ui/themes";
import { getResource } from "@/services/resource.service";
import { getTask } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service"; // เพิ่ม import service สำหรับ subtask
import { TypeTask } from "@/types/response/response.task";
import { TypeResourceAll } from "@/types/response/response.resource";
import { TypeSubTask } from "@/types/response/response.subtask"; // เพิ่ม type สำหรับ subtask
import DialogAddResource from "./components/DialogAddResource";
import DialogEditResource from "./components/DialogEditResource";
import AlertDialogDeleteResource from "./components/alertDialogDeleteResource";

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

            // เพิ่ม debugging เพื่อตรวจสอบข้อมูล
            console.log("Tasks:", resTasks.responseObject);
            console.log("SubTasks:", resSubTasks.responseObject);
            console.log("Resources:", resResources.responseObject);

            if (resTasks.success && resSubTasks.success && resResources.success) {
                const tasks: TypeTask[] = resTasks.responseObject;
                const subTasks: TypeSubTask[] = resSubTasks.responseObject;
                const resourceList: TypeResourceAll[] = resResources.responseObject;

                // แสดงรายละเอียดเพื่อ debug
                console.log("First subtask:", subTasks[0]);
                console.log("First resource:", resourceList[0]);

                // ใช้วิธีจับคู่แบบยืดหยุ่นขึ้น
                const resourcesBySubTask = subTasks.reduce<{ [subtask_id: string]: TypeResourceAll[] }>((acc, subtask) => {
                    // ตรวจสอบด้วยการแสดงจำนวนข้อมูลที่กรองได้
                    const filteredResources = resourceList.filter(resource =>
                        resource.subtask_id && resource.subtask_id === subtask.subtask_id
                    );
                    console.log(`SubTask ${subtask.subtask_id} has ${filteredResources.length} resources`);

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

    // คำนวณมูลค่า Resources ทั้งหมดในแต่ละ Task
    const calculateTaskTotalResources = (task_id: string): number => {
        let total = 0;
        const taskSubTasks = subTasksByTask[task_id] || [];

        taskSubTasks.forEach(subTask => {
            const resources = resourcesBySubTask[subTask.subtask_id] || [];
            resources.forEach(resource => {
                // เพิ่ม console.log เพื่อ debug ค่า total ของแต่ละ resource
                console.log(`Adding resource ${resource.resource_name} with total: ${resource.total}`);
                // ตรวจสอบว่า resource.total เป็นตัวเลขหรือไม่
                if (typeof resource.total === 'number') {
                    total += resource.total;
                } else {
                    // หากไม่ใช่ตัวเลข ให้แปลงเป็นตัวเลขก่อน
                    total += Number(resource.total) || 0;
                }
            });
        });

        console.log(`Total for task ${task_id}: ${total}`);
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
                            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tasks.map((task) => {
                            const taskSubTasks = subTasksByTask[task.task_id] || [];
                            const taskTotal = calculateTaskTotalResources(task.task_id);

                            // หากไม่มี subtask
                            if (taskSubTasks.length === 0) {
                                return (
                                    <Table.Row key={`task-${task.task_id}`}>
                                        <Table.Cell>
                                            <Flex direction="row" align="center" gap="2">
                                                <Text>{task.task_name}</Text>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell colSpan={6}>No subtasks available</Table.Cell>
                                        <Table.Cell>
                                            <Text>Task total: {new Intl.NumberFormat("en-US").format(taskTotal)}</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            }

                            // มี subtasks
                            return taskSubTasks.map((subTask, subTaskIndex) => {
                                const resources = resourcesBySubTask[subTask.subtask_id] || [];

                                // หากไม่มี resources ใน subtask นี้
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
                                            <Table.Cell>
                                                <Flex gap="2">
                                                    <DialogAddResource
                                                        getResourceData={getResourceData}
                                                        task_id={task.task_id}
                                                        subtask_id={subTask.subtask_id}
                                                    />
                                                </Flex>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                }

                                // แสดง resources ภายใต้ subtask
                                return resources.map((resource, resourceIndex) => (
                                    <Table.Row key={`resource-${resource.resource_id}`}>
                                        {/* Task cell - แสดงเฉพาะในแถวแรกของแต่ละ task */}
                                        {subTaskIndex === 0 && resourceIndex === 0 && (
                                            <Table.Cell rowSpan={taskSubTasks.reduce((acc, st) => {
                                                return acc + Math.max(1, (resourcesBySubTask[st.subtask_id] || []).length);
                                            }, 0)}>
                                                <Flex direction="row" align="center" gap="2">
                                                    <Text>{task.task_name}</Text>
                                                </Flex>
                                            </Table.Cell>
                                        )}

                                        {/* SubTask cell - แสดงเฉพาะในแถวแรกของแต่ละ subtask */}
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
                                        <Table.Cell>
                                            <Flex gap="2" align="center">
                                                {resourceIndex === 0 && (
                                                    <DialogAddResource
                                                        getResourceData={getResourceData}
                                                        task_id={task.task_id}
                                                        subtask_id={subTask.subtask_id}
                                                    />
                                                )}
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
                                ));
                            });
                        })}

                        {/* แสดงรวมทั้งหมด */}
                        <Table.Row>
                            <Table.Cell colSpan={6} className="text-right">
                                <Text weight="bold">Grand Total:</Text>
                            </Table.Cell>
                            <Table.Cell colSpan={2}>
                                <Text weight="bold">
                                    {(() => {
                                        // คำนวณรวมโดยตรงจาก resources ทั้งหมด
                                        let allResourcesTotal = 0;

                                        // วนลูปทุก subtask และรวมค่า total ของทุก resource
                                        Object.values(resourcesBySubTask).forEach(resources => {
                                            resources.forEach(resource => {
                                                // แน่ใจว่า total เป็นตัวเลข
                                                const resourceTotal = typeof resource.total === 'number'
                                                    ? resource.total
                                                    : Number(resource.total) || 0;

                                                console.log(`Adding resource ${resource.resource_name}: ${resourceTotal}`);
                                                allResourcesTotal += resourceTotal;
                                            });
                                        });

                                        console.log(`Final Grand Total (direct calculation): ${allResourcesTotal}`);
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