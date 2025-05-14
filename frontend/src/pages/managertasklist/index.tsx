// import React, { useEffect, useState } from "react";
// import { Card, Table, Text, Flex, Button, Tooltip } from "@radix-ui/themes";
// import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
// import { getTask, getTaskProject, patchTask } from "@/services/task.service";
// import { TypeTaskAll } from "@/types/response/response.task";
// import { getSubtask, patchSubtask } from "@/services/subtask.service";
// import { TypeSubTaskAll } from "@/types/response/response.subtask";
// import { getTaskProgress, getSubtaskProgress, createProgress } from "@/services/progress.service";
// import { calculateProgress } from "@/pages/managertasklist/Function/CalProgress";
// import DialogAddTask from "./components/DialogAddTask";
// import DialogEditTask from "./components/DialogEditTask";
// import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";
// import DialogAddSubTask from "./components/DialogAddSubTask";
// import DialogEditSubtask from "./components/DialogEditSubtask";
// import AlertDialogDeleteSubtask from "./components/alertDialogDeleteSubtask";
// import ProjectProgress from "./components/ProjectProgress";
// import { getManagerProjects } from "@/services/project.service";

// // สร้าง component ProgressBar อย่างง่าย
// const ProgressBar = ({ percent }: { percent: number }) => {
//     // กำหนดสีตามเปอร์เซ็นต์
//     const getColor = () => {
//         if (percent < 25) return "#ef4444"; // แดง
//         if (percent < 50) return "#f97316"; // ส้ม 
//         if (percent < 75) return "#facc15"; // เหลือง
//         return "#22c55e"; // เขียว
//     };

//     // แสดงค่าเปอร์เซ็นต์เป็นทศนิยม 2 ตำแหน่ง
//     const formattedPercent = percent.toFixed(2);

//     return (
//         <div>
//             <div style={{ fontSize: "12px", marginBottom: "2px" }}>{formattedPercent}%</div>
//             <div
//                 style={{
//                     width: "100%",
//                     backgroundColor: "#e5e7eb",
//                     borderRadius: "4px",
//                     height: "8px",
//                 }}
//             >
//                 <div
//                     style={{
//                         width: `${percent}%`, // ยังคงใช้ค่าดั้งเดิมสำหรับความกว้างของแถบ
//                         backgroundColor: getColor(),
//                         height: "100%",
//                         borderRadius: "4px",
//                         transition: "width 0.3s ease-in-out",
//                     }}
//                 />
//             </div>
//         </div>
//     );
// };

// export default function TasklistPage() {
//     const [tasks, setTasks] = useState<TypeTaskAll[]>([]);
//     const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
//     const [subtasks, setSubtasks] = useState<Record<string, TypeSubTaskAll[]>>({});
//     const [isLoading, setIsLoading] = useState<boolean>(true);
//     // เพิ่ม state สำหรับเก็บความคืบหน้า
//     const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
//     const [subtaskProgress, setSubtaskProgress] = useState<Record<string, number>>({});
//     const [managerProject, setManagerProject] = useState<string | null>(null);
//     const [projectName, setProjectName] = useState<string>("");

//     // สำหรับการคงความเข้ากันได้กับโค้ดเดิม
//     const calculateTaskProgress = (taskId: string) => {
//         return calculateProgress(taskId, 'task', {
//             tasks,
//             subtasks,
//             taskProgress,
//             subtaskProgress,
//             useWeightedAverage: true,
//             weightBy: 'duration',
//             setTaskProgress
//         });
//     };

//     const updateTaskStatusFromSubtasks = async (taskId: string) => {
//         const taskSubtasks = subtasks[taskId] || [];

//         // ถ้าไม่มี subtask ให้ข้ามไป
//         if (taskSubtasks.length === 0) return;

//         // ค้นหา task ปัจจุบัน
//         const currentTask = tasks.find(task => task.task_id === taskId);
//         if (!currentTask) return;

//         // คำนวณความคืบหน้าโดยใช้ฟังก์ชันที่ปรับปรุงใหม่
//         const averageProgress = calculateProgress(taskId, 'task', {
//             tasks,
//             subtasks,
//             taskProgress,
//             subtaskProgress,
//             useWeightedAverage: true,
//             weightBy: 'duration',
//             updateState: false
//         });

//         // ตรวจสอบสถานะของ subtasks
//         const allCompleted = taskSubtasks.every(subtask => subtask.status === "completed");
//         const allCancelled = taskSubtasks.every(subtask => subtask.status === "cancelled");
//         const anyInProgress = taskSubtasks.some(subtask => subtask.status === "in progress");
//         const anyNotCompleted = taskSubtasks.some(subtask => subtask.status !== "completed");
//         const anyLessThan100Percent = taskSubtasks.some(subtask =>
//             (subtaskProgress[subtask.subtask_id] || 0) < 100
//         );

//         let newStatus = currentTask.status;
//         let newProgress = averageProgress;
//         let shouldUpdateProgress = false;
//         let shouldUpdateStatus = false;

//         // กรณี 1: ถ้าทุก subtask เป็น completed และ task ไม่ใช่ completed ให้อัพเดทเป็น completed
//         if (allCompleted && currentTask.status !== "completed") {
//             newStatus = "completed";
//             newProgress = 100;
//             shouldUpdateProgress = true;
//             shouldUpdateStatus = true;
//         }
//         // กรณี 2: ถ้าทุก subtask เป็น cancelled และ task ไม่ใช่ cancelled ให้อัพเดทเป็น cancelled
//         else if (allCancelled && currentTask.status !== "cancelled") {
//             newStatus = "cancelled";
//             shouldUpdateStatus = true;
//         }
//         // กรณี 3: ถ้ามีบาง subtask เป็น in progress และ task ไม่ใช่ in progress ให้อัพเดทเป็น in progress
//         else if (anyInProgress && currentTask.status !== "in progress") {
//             newStatus = "in progress";
//             shouldUpdateStatus = true;
//         }
//         // กรณี 4: ถ้า task เป็น completed แล้ว แต่มีบาง subtask ไม่ใช่ completed หรือ progress น้อยกว่า 100%
//         else if (currentTask.status === "completed" && (anyNotCompleted || anyLessThan100Percent)) {
//             newStatus = "in progress";
//             shouldUpdateStatus = true;
//             shouldUpdateProgress = true;
//         }

//         // ตรวจสอบและอัพเดต Task status ถ้าจำเป็น
//         if (shouldUpdateStatus) {
//             try {
//                 console.log(`Updating task status from ${currentTask.status} to ${newStatus}`);
//                 const response = await patchTask({
//                     task_id: taskId,
//                     status: newStatus  // ส่งสถานะเป็น string
//                 });

//                 if (response.success) {
//                     console.log(`Task status updated to ${newStatus}`);

//                     // อัพเดต tasks ในหน้าจอ
//                     setTasks(prevTasks => prevTasks.map(task =>
//                         task.task_id === taskId ? { ...task, status: newStatus } : task
//                     ));
//                 }
//             } catch (error) {
//                 console.error("Failed to update task status:", error);
//             }
//         }

//         // อัพเดต progress ถ้าจำเป็น
//         if (shouldUpdateProgress || averageProgress !== taskProgress[taskId]) {
//             try {
//                 const progressToUpdate = shouldUpdateProgress ? newProgress : averageProgress;

//                 await createProgress({
//                     task_id: taskId,
//                     percent: progressToUpdate,
//                     description: `Auto-updated from subtasks: ${progressToUpdate}%`,
//                 });

//                 // อัพเดต state
//                 setTaskProgress(prev => ({
//                     ...prev,
//                     [taskId]: progressToUpdate
//                 }));

//                 console.log(`Task progress updated to ${progressToUpdate}%`);
//             } catch (progressError) {
//                 console.error("Failed to update task progress:", progressError);
//             }
//         }
//     };

//     const fetchManagerProject = async () => {
//         try {
//             const response = await getManagerProjects();
//             if (response.success && response.responseObject.length > 0) {
//                 // Manager มีเพียง 1 Project
//                 const project = response.responseObject[0];
//                 setManagerProject(project.project_id);
//                 setProjectName(project.project_name);
//                 // เรียกฟังก์ชันดึง Tasks ของ Project นั้น
//                 await getTaskProject(project.project_id);
//             } else {
//                 // ถ้า Manager ไม่มี Project
//                 setTasks([]);
//                 console.error("No projects found for this manager");
//             }
//         } catch (error) {
//             console.error("Error fetching manager project:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const getTaskData = async () => {
//         setIsLoading(true);
//         try {
//             const res = await getTask();
//             console.log("Tasks fetched:", res);
//             setTasks(res.responseObject);

//             // ดึงความคืบหน้าของ tasks
//             for (const task of res.responseObject) {
//                 await fetchTaskProgress(task.task_id);
//             }

//             // ถ้ามี task ที่ expand อยู่ ให้ดึง subtasks มาด้วย
//             for (const taskId of expandedTasks) {
//                 await fetchSubtasks(taskId);
//             }
//         } catch (error) {
//             console.error("Error fetching tasks:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // ดึงข้อมูล subtasks สำหรับ task ที่กำหนด
//     const fetchSubtasks = async (taskId: string) => {
//         try {
//             console.log(`Fetching subtasks for task: ${taskId}`);
//             const response = await getSubtask(taskId);

//             if (response.success) {
//                 console.log(`Subtasks for task ${taskId}:`, response.responseObject);

//                 // ตรวจสอบให้แน่ใจว่า subtask ที่ได้รับเป็นของ task นี้จริง ๆ
//                 const filteredSubtasks = response.responseObject.filter(subtask =>
//                     subtask.task_id === taskId
//                 );

//                 console.log(`Filtered subtasks for task ${taskId}:`, filteredSubtasks);

//                 // อัปเดต state โดยใช้ taskId เป็น key
//                 setSubtasks(prev => ({
//                     ...prev,
//                     [taskId]: filteredSubtasks
//                 }));

//                 // ดึงความคืบหน้าของ subtasks
//                 for (const subtask of filteredSubtasks) {
//                     await fetchSubtaskProgress(subtask.subtask_id);
//                 }

//                 // หลังจากดึงข้อมูลความคืบหน้าของทุก subtask แล้ว คำนวณความคืบหน้าของ task
//                 calculateTaskProgress(taskId);
//             } else {
//                 console.error(`Failed to fetch subtasks for task ${taskId}:`, response.message);
//                 setSubtasks(prev => ({
//                     ...prev,
//                     [taskId]: []
//                 }));
//             }
//         } catch (error) {
//             console.error(`Error fetching subtasks for task ${taskId}:`, error);
//             setSubtasks(prev => ({
//                 ...prev,
//                 [taskId]: []
//             }));
//         }
//     };


//     // ดึงความคืบหน้าของ Task
//     const fetchTaskProgress = async (taskId: string) => {
//         try {
//             // ตรวจสอบว่ามี subtasks หรือไม่
//             if (subtasks[taskId] && subtasks[taskId].length > 0) {
//                 // คำนวณใหม่จาก subtasks ที่มีอยู่
//                 const calculatedProgress = calculateProgress(taskId, 'task', {
//                     tasks,
//                     subtasks,
//                     taskProgress,
//                     subtaskProgress,
//                     updateState: false
//                 });

//                 // อัพเดต state ด้วยค่าที่คำนวณได้
//                 setTaskProgress(prev => ({
//                     ...prev,
//                     [taskId]: calculatedProgress
//                 }));

//                 console.log(`Updated task ${taskId} progress to calculated value: ${calculatedProgress}%`);
//             } else {
//                 // ถ้าไม่มี subtasks ดึงจากฐานข้อมูล
//                 const response = await getTaskProgress(taskId);
//                 if (response.success && response.responseObject.length > 0) {
//                     const latestProgress = response.responseObject[0];
//                     setTaskProgress(prev => ({
//                         ...prev,
//                         [taskId]: latestProgress.percent
//                     }));
//                 }
//             }
//         } catch (error) {
//             console.error(`Error fetching progress for task ${taskId}:`, error);
//         }
//     };

//     // ดึงความคืบหน้าของ Subtask
//     const fetchSubtaskProgress = async (subtaskId: string) => {
//         try {
//             const response = await getSubtaskProgress(subtaskId);
//             if (response.success && response.responseObject.length > 0) {
//                 // Progress จะถูกเรียงตาม date_recorded ล่าสุดมาก่อน
//                 const latestProgress = response.responseObject[0];
//                 setSubtaskProgress(prev => ({
//                     ...prev,
//                     [subtaskId]: latestProgress.percent
//                 }));
//             }
//         } catch (error) {
//             console.error(`Error fetching progress for subtask ${subtaskId}:`, error);
//         }
//     };

//     // toggle การแสดง/ซ่อน subtasks
//     const toggleExpandTask = (taskId: string) => {
//         setExpandedTasks(prev => {
//             const isExpanded = prev.includes(taskId);

//             if (isExpanded) {
//                 return prev.filter(id => id !== taskId);
//             } else {
//                 // ถ้ากำลังจะเปิด ให้ดึงข้อมูลและคำนวณความคืบหน้าใหม่
//                 if (!subtasks[taskId] || subtasks[taskId]?.length === 0) {
//                     fetchSubtasks(taskId).then(() => {
//                         // หลังจากดึงข้อมูล subtasks แล้ว คำนวณและอัพเดตค่าความคืบหน้า
//                         const calculatedProgress = calculateProgress(taskId, 'task', {
//                             tasks,
//                             subtasks,
//                             taskProgress,
//                             subtaskProgress
//                         });

//                         // บันทึกค่าไว้ใน state เพื่อให้ใช้ค่าเดียวกันไม่ว่าจะกด dropdown หรือไม่
//                         setTaskProgress(prev => ({
//                             ...prev,
//                             [taskId]: calculatedProgress
//                         }));
//                     });
//                 }
//                 return [...prev, taskId];
//             }
//         });
//     };

//     useEffect(() => {
//         getTaskData();
//     }, []);

//     // Format date to display as dd/mm/yyyy
//     const formatDate = (dateString: string | undefined) => {
//         if (!dateString) return "-";
//         const date = new Date(dateString);
//         const day = date.getDate().toString().padStart(2, '0');
//         const month = (date.getMonth() + 1).toString().padStart(2, '0');
//         const year = date.getFullYear();
//         return `${day}/${month}/${year}`;
//     };

//     // Format budget to display with commas
//     const formatBudget = (budget: number | undefined) => {
//         if (!budget && budget !== 0) return "-";
//         return Number(budget).toLocaleString('en-US', {
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 0
//         });
//     };

//     // รีเฟรชข้อมูลหลังจากอัปเดตความคืบหน้าของ Subtask และ Task
//     const handleProgressUpdated = async (subtaskId: string, taskId: string) => {
//         await fetchSubtaskProgress(subtaskId);
//         await fetchTaskProgress(taskId);
//         await updateTaskStatusFromSubtasks(taskId);
//     };

//     return (
//         <div>
//             {/* เพิ่ม ProjectProgress Component ตรงนี้ */}
//             <ProjectProgress
//                 tasks={tasks}
//                 subtasks={subtasks}
//                 taskProgress={taskProgress}
//             />

//             <Card variant="surface">
//                 <Flex className="w-full" direction="row" gap="2" justify="between">
//                     <Text as="div" size="4" weight="bold">
//                         Tasks
//                     </Text>
//                     <DialogAddTask getTaskData={getTaskData} />
//                 </Flex>
//                 <div className="w-full mt-2">
//                     {isLoading ? (
//                         <Flex align="center" justify="center" py="4">
//                             <Text>Loading tasks...</Text>
//                         </Flex>
//                     ) : (
//                         <Table.Root variant="surface">
//                             <Table.Header>
//                                 <Table.Row>
//                                     <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
//                                     <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
//                                 </Table.Row>
//                             </Table.Header>
//                             <Table.Body>
//                                 {tasks.map((task: TypeTaskAll) => (
//                                     <React.Fragment key={`fragment-${task.task_id}`}>
//                                         <Table.Row key={`task-${task.task_id}`}>
//                                             <Table.Cell>
//                                                 <Button
//                                                     variant="ghost"
//                                                     size="1"
//                                                     onClick={() => toggleExpandTask(task.task_id)}
//                                                 >
//                                                     {expandedTasks.includes(task.task_id) ?
//                                                         <ChevronDownIcon /> :
//                                                         <ChevronRightIcon />}
//                                                 </Button>
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 <Text>{task.task_name}</Text>
//                                             </Table.Cell>
//                                             <Table.Cell>{formatBudget(task.budget)}</Table.Cell>
//                                             <Table.Cell>{formatDate(task.start_date)}</Table.Cell>
//                                             <Table.Cell>{formatDate(task.end_date)}</Table.Cell>
//                                             <Table.Cell>{task.status}</Table.Cell>
//                                             <Table.Cell>
//                                                 <Tooltip content={`${(expandedTasks.includes(task.task_id)
//                                                     ? calculateProgress(task.task_id, 'task', {
//                                                         tasks,
//                                                         subtasks,
//                                                         taskProgress,
//                                                         subtaskProgress,
//                                                         updateState: false
//                                                     })
//                                                     : taskProgress[task.task_id] || 0).toFixed(2)}%`}>
//                                                     <div style={{ width: '100px' }}>
//                                                         <ProgressBar
//                                                             percent={expandedTasks.includes(task.task_id)
//                                                                 ? calculateProgress(task.task_id, 'task', {
//                                                                     tasks,
//                                                                     subtasks,
//                                                                     taskProgress,
//                                                                     subtaskProgress,
//                                                                     setTaskProgress
//                                                                 })
//                                                                 : (taskProgress[task.task_id] || 0)
//                                                             }
//                                                         />
//                                                     </div>
//                                                 </Tooltip>
//                                             </Table.Cell>
//                                             <Table.Cell>
//                                                 <Flex gap="2">
//                                                     <DialogAddSubTask
//                                                         getSubtaskData={() => fetchSubtasks(task.task_id)}
//                                                         taskId={task.task_id}
//                                                         taskName={task.task_name}
//                                                         updateTaskStatus={updateTaskStatusFromSubtasks}
//                                                     />
//                                                     <DialogEditTask
//                                                         getTaskData={getTaskData}
//                                                         task_id={task.task_id}
//                                                         task_name={task.task_name}
//                                                         description={task.description}
//                                                         budget={task.budget}
//                                                         start_date={task.start_date}
//                                                         end_date={task.end_date}
//                                                         status={task.status}
//                                                         updateSubtasksOnComplete={true}
//                                                         updateTaskStatusFromSubtasks={updateTaskStatusFromSubtasks}
//                                                     />
//                                                     <AlertDialogDeleteTask
//                                                         getTaskData={getTaskData}
//                                                         task_id={task.task_id}
//                                                         task_name={task.task_name}
//                                                     />
//                                                 </Flex>
//                                             </Table.Cell>
//                                         </Table.Row>

//                                         {/* SubTasks Section */}
//                                         {expandedTasks.includes(task.task_id) && subtasks[task.task_id]?.map((subtask) => (
//                                             <Table.Row key={`subtask-${subtask.subtask_id}-${task.task_id}`} className="bg-gray-50">
//                                                 <Table.Cell>
//                                                     <div className="pl-6"></div>
//                                                 </Table.Cell>
//                                                 <Table.Cell>
//                                                     <Text size="2" className="pl-4">{subtask.subtask_name}</Text>
//                                                 </Table.Cell>
//                                                 <Table.Cell>{formatBudget(subtask.budget)}</Table.Cell>
//                                                 <Table.Cell>{formatDate(subtask.start_date)}</Table.Cell>
//                                                 <Table.Cell>{formatDate(subtask.end_date)}</Table.Cell>
//                                                 <Table.Cell>
//                                                     <Text size="2">{subtask.status}</Text>
//                                                 </Table.Cell>
//                                                 <Table.Cell>
//                                                     <Tooltip content={`${subtaskProgress[subtask.subtask_id] || 0}%`}>
//                                                         <div style={{ width: '100px' }}>
//                                                             <ProgressBar
//                                                                 percent={subtaskProgress[subtask.subtask_id] || 0}
//                                                             />
//                                                         </div>
//                                                     </Tooltip>
//                                                 </Table.Cell>
//                                                 <Table.Cell>
//                                                     <Flex gap="2">
//                                                         <div style={{ width: "51px" }}></div>
//                                                         <DialogEditSubtask
//                                                             getSubtaskData={() => {
//                                                                 fetchSubtasks(task.task_id);
//                                                                 fetchTaskProgress(task.task_id);
//                                                                 updateTaskStatusFromSubtasks(task.task_id);
//                                                             }}
//                                                             subtaskId={subtask.subtask_id}
//                                                             taskId={task.task_id}
//                                                             trigger={<Button className="cursor-pointer" size="1" variant="soft" color="orange">Edit</Button>}
//                                                             updateTaskStatus={updateTaskStatusFromSubtasks}
//                                                         />
//                                                         <AlertDialogDeleteSubtask
//                                                             getSubtaskData={() => {
//                                                                 fetchSubtasks(task.task_id);
//                                                                 fetchTaskProgress(task.task_id);
//                                                                 updateTaskStatusFromSubtasks(task.task_id);
//                                                             }}
//                                                             subtask_id={subtask.subtask_id}
//                                                             subtask_name={subtask.subtask_name}
//                                                         />
//                                                     </Flex>
//                                                 </Table.Cell>
//                                             </Table.Row>
//                                         ))}

//                                         {expandedTasks.includes(task.task_id) && (!subtasks[task.task_id] || subtasks[task.task_id]?.length === 0) && (
//                                             <Table.Row key={`empty-${task.task_id}`}>
//                                                 <Table.Cell></Table.Cell>
//                                                 <Table.Cell colSpan={7}>
//                                                     <Text size="2" color="gray">No subtasks found</Text>
//                                                 </Table.Cell>
//                                             </Table.Row>
//                                         )}
//                                     </React.Fragment>
//                                 ))}
//                             </Table.Body>
//                         </Table.Root>
//                     )}
//                 </div>
//             </Card>
//         </div>
//     );
// }

import React, { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Button, Tooltip, Heading } from "@radix-ui/themes";
import { ChevronDownIcon, ChevronRightIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { getTask, getTaskProject, patchTask } from "@/services/task.service";
import { TypeTaskAll } from "@/types/response/response.task";
import { getSubtask } from "@/services/subtask.service";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { getTaskProgress, getSubtaskProgress, createProgress } from "@/services/progress.service";
import { calculateProgress } from "@/pages/managertasklist/Function/CalProgress";
import DialogAddTask from "./components/DialogAddTask";
import DialogEditTask from "./components/DialogEditTask";
import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import DialogEditSubtask from "./components/DialogEditSubtask";
import AlertDialogDeleteSubtask from "./components/alertDialogDeleteSubtask";
import ProjectProgress from "./components/ProjectProgress";
import { useNavigate, useLocation } from 'react-router-dom';

// ProgressBar component
const ProgressBar = ({ percent }: { percent: number }) => {
    // กำหนดสีตามเปอร์เซ็นต์
    const getColor = () => {
        if (percent < 25) return "#ef4444"; // แดง
        if (percent < 50) return "#f97316"; // ส้ม 
        if (percent < 75) return "#facc15"; // เหลือง
        return "#22c55e"; // เขียว
    };

    // แสดงค่าเปอร์เซ็นต์เป็นทศนิยม 2 ตำแหน่ง
    const formattedPercent = percent.toFixed(2);

    return (
        <div>
            <div style={{ fontSize: "12px", marginBottom: "2px" }}>{formattedPercent}%</div>
            <div
                style={{
                    width: "100%",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "4px",
                    height: "8px",
                }}
            >
                <div
                    style={{
                        width: `${percent}%`,
                        backgroundColor: getColor(),
                        height: "100%",
                        borderRadius: "4px",
                        transition: "width 0.3s ease-in-out",
                    }}
                />
            </div>
        </div>
    );
};

export default function TasklistPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // ใช้ URLSearchParams เพื่อดึงค่า query parameters จาก URL
    const searchParams = new URLSearchParams(location.search);
    const project_id = searchParams.get('project_id');
    const project_name = searchParams.get('project_name');

    const [tasks, setTasks] = useState<TypeTaskAll[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [subtasks, setSubtasks] = useState<Record<string, TypeSubTaskAll[]>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
    const [subtaskProgress, setSubtaskProgress] = useState<Record<string, number>>({});
    const [projectName, setProjectName] = useState<string>("");
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    useEffect(() => {
        // จัดการกับ project_id เฉพาะเมื่อมีค่า
        if (project_id) {
            setCurrentProjectId(project_id);

            // ถ้ามีชื่อโปรเจค ใช้ชื่อนั้นเลย
            if (project_name) {
                setProjectName(project_name);
            }

            // ดึงข้อมูล Task เฉพาะของโปรเจคนี้
            getTaskByProject(project_id);
        } else {
            // ถ้าไม่มี project_id ให้ใช้การทำงานแบบเดิม (แสดงทั้งหมด)
            getTaskData();
        }
    }, [project_id, project_name]);

    // สำหรับการคงความเข้ากันได้กับโค้ดเดิม
    const calculateTaskProgress = (taskId: string) => {
        return calculateProgress(taskId, 'task', {
            tasks,
            subtasks,
            taskProgress,
            subtaskProgress,
            useWeightedAverage: true,
            weightBy: 'duration',
            setTaskProgress
        });
    };

    // ฟังก์ชั่นอัพเดตสถานะ task จาก subtasks
    const updateTaskStatusFromSubtasks = async (taskId: string) => {
        const taskSubtasks = subtasks[taskId] || [];

        // ถ้าไม่มี subtask ให้ข้ามไป
        if (taskSubtasks.length === 0) return;

        // ค้นหา task ปัจจุบัน
        const currentTask = tasks.find(task => task.task_id === taskId);
        if (!currentTask) return;

        // คำนวณความคืบหน้าโดยใช้ฟังก์ชันที่ปรับปรุงใหม่
        const averageProgress = calculateProgress(taskId, 'task', {
            tasks,
            subtasks,
            taskProgress,
            subtaskProgress,
            useWeightedAverage: true,
            weightBy: 'duration',
            updateState: false
        });

        // ตรวจสอบสถานะของ subtasks
        const allCompleted = taskSubtasks.every(subtask => subtask.status === "completed");
        const allCancelled = taskSubtasks.every(subtask => subtask.status === "cancelled");
        const anyInProgress = taskSubtasks.some(subtask => subtask.status === "in progress");
        const anyNotCompleted = taskSubtasks.some(subtask => subtask.status !== "completed");
        const anyLessThan100Percent = taskSubtasks.some(subtask =>
            (subtaskProgress[subtask.subtask_id] || 0) < 100
        );

        let newStatus = currentTask.status;
        let newProgress = averageProgress;
        let shouldUpdateProgress = false;
        let shouldUpdateStatus = false;

        // กรณี 1: ถ้าทุก subtask เป็น completed และ task ไม่ใช่ completed ให้อัพเดทเป็น completed
        if (allCompleted && currentTask.status !== "completed") {
            newStatus = "completed";
            newProgress = 100;
            shouldUpdateProgress = true;
            shouldUpdateStatus = true;
        }
        // กรณี 2: ถ้าทุก subtask เป็น cancelled และ task ไม่ใช่ cancelled ให้อัพเดทเป็น cancelled
        else if (allCancelled && currentTask.status !== "cancelled") {
            newStatus = "cancelled";
            shouldUpdateStatus = true;
        }
        // กรณี 3: ถ้ามีบาง subtask เป็น in progress และ task ไม่ใช่ in progress ให้อัพเดทเป็น in progress
        else if (anyInProgress && currentTask.status !== "in progress") {
            newStatus = "in progress";
            shouldUpdateStatus = true;
        }
        // กรณี 4: ถ้า task เป็น completed แล้ว แต่มีบาง subtask ไม่ใช่ completed หรือ progress น้อยกว่า 100%
        else if (currentTask.status === "completed" && (anyNotCompleted || anyLessThan100Percent)) {
            newStatus = "in progress";
            shouldUpdateStatus = true;
            shouldUpdateProgress = true;
        }

        // ตรวจสอบและอัพเดต Task status ถ้าจำเป็น
        if (shouldUpdateStatus) {
            try {
                console.log(`Updating task status from ${currentTask.status} to ${newStatus}`);
                const response = await patchTask({
                    task_id: taskId,
                    status: newStatus
                });

                if (response.success) {
                    console.log(`Task status updated to ${newStatus}`);

                    // อัพเดต tasks ในหน้าจอ
                    setTasks(prevTasks => prevTasks.map(task =>
                        task.task_id === taskId ? { ...task, status: newStatus } : task
                    ));
                }
            } catch (error) {
                console.error("Failed to update task status:", error);
            }
        }

        // อัพเดต progress ถ้าจำเป็น
        if (shouldUpdateProgress || averageProgress !== taskProgress[taskId]) {
            try {
                const progressToUpdate = shouldUpdateProgress ? newProgress : averageProgress;

                await createProgress({
                    task_id: taskId,
                    percent: progressToUpdate,
                    description: `Auto-updated from subtasks: ${progressToUpdate}%`,
                });

                // อัพเดต state
                setTaskProgress(prev => ({
                    ...prev,
                    [taskId]: progressToUpdate
                }));

                console.log(`Task progress updated to ${progressToUpdate}%`);
            } catch (progressError) {
                console.error("Failed to update task progress:", progressError);
            }
        }
    };

    const getTaskByProject = async (projectId: string) => {
        setIsLoading(true);
        try {
            // ใช้ getTaskProject แทน getTask เพื่อดึงเฉพาะ Task ของโปรเจคที่เลือก
            const res = await getTaskProject(projectId);
            console.log(`Tasks for project ${projectId}:`, res);

            if (res.success) {
                // ตรวจสอบว่า responseObject เป็น array หรือไม่
                if (Array.isArray(res.responseObject)) {
                    setTasks(res.responseObject);

                    // ดึงความคืบหน้าของ tasks
                    for (const task of res.responseObject) {
                        await fetchTaskProgress(task.task_id);
                    }

                    // ถ้ายังไม่มีชื่อโปรเจค ให้ดึงจากข้อมูล Task ถ้ามี project_name
                    if (!project_name && res.responseObject.length > 0 && 'project_name' in res.responseObject[0]) {
                        setProjectName(res.responseObject[0].project_name || "");
                    }
                } else if (res.responseObject) {
                    // แปลง single object เป็น array แล้วกำหนดให้ tasks
                    const taskAsArray = [res.responseObject as TypeTaskAll];
                    setTasks(taskAsArray);

                    // ดึงความคืบหน้าของ task เดียว
                    await fetchTaskProgress(res.responseObject.task_id);

                    // ถ้ายังไม่มีชื่อโปรเจค ให้ดึงจาก Task object ถ้ามี project_name
                    if (!project_name && res.responseObject && typeof res.responseObject === 'object') {
                        // Using optional chaining and type assertion to safely access project_name if it exists
                        const taskObj = res.responseObject as Record<string, any>;
                        const projectNameValue = taskObj.project_name || "";
                        setProjectName(projectNameValue);
                    }
                } else {
                    // กรณีไม่มีข้อมูล
                    setTasks([]);
                }
            } else {
                console.error("Failed to fetch tasks for this project");
                setTasks([]);
            }
        } catch (error) {
            console.error(`Error fetching tasks for project ${projectId}:`, error);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getTaskData = async () => {
        setIsLoading(true);
        try {
            const res = await getTask();
            console.log("Tasks fetched:", res);

            if (res.success) {
                // ตรวจสอบว่า responseObject เป็น array หรือไม่
                if (Array.isArray(res.responseObject)) {
                    setTasks(res.responseObject);

                    // ดึงความคืบหน้าของ tasks
                    for (const task of res.responseObject) {
                        await fetchTaskProgress(task.task_id);
                    }
                } else if (res.responseObject) {
                    // แปลง single object เป็น array แล้วกำหนดให้ tasks
                    const taskAsArray = [res.responseObject as TypeTaskAll];
                    setTasks(taskAsArray);

                    // ดึงความคืบหน้าของ task เดียว
                    await fetchTaskProgress(res.responseObject.task_id);
                } else {
                    setTasks([]);
                }
            } else {
                setTasks([]);
            }

            // ถ้ามี task ที่ expand อยู่ ให้ดึง subtasks มาด้วย
            for (const taskId of expandedTasks) {
                await fetchSubtasks(taskId);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ดึงข้อมูล subtasks สำหรับ task ที่กำหนด
    const fetchSubtasks = async (taskId: string) => {
        try {
            console.log(`Fetching subtasks for task: ${taskId}`);
            const response = await getSubtask(taskId);

            if (response.success) {
                console.log(`Subtasks for task ${taskId}:`, response.responseObject);

                // ตรวจสอบให้แน่ใจว่า subtask ที่ได้รับเป็นของ task นี้จริง ๆ
                const filteredSubtasks = response.responseObject.filter(subtask =>
                    subtask.task_id === taskId
                );

                console.log(`Filtered subtasks for task ${taskId}:`, filteredSubtasks);

                // อัปเดต state โดยใช้ taskId เป็น key
                setSubtasks(prev => ({
                    ...prev,
                    [taskId]: filteredSubtasks
                }));

                // ดึงความคืบหน้าของ subtasks
                for (const subtask of filteredSubtasks) {
                    await fetchSubtaskProgress(subtask.subtask_id);
                }

                // หลังจากดึงข้อมูลความคืบหน้าของทุก subtask แล้ว คำนวณความคืบหน้าของ task
                calculateTaskProgress(taskId);
            } else {
                console.error(`Failed to fetch subtasks for task ${taskId}:`, response.message);
                setSubtasks(prev => ({
                    ...prev,
                    [taskId]: []
                }));
            }
        } catch (error) {
            console.error(`Error fetching subtasks for task ${taskId}:`, error);
            setSubtasks(prev => ({
                ...prev,
                [taskId]: []
            }));
        }
    };

    // ดึงความคืบหน้าของ Task
    const fetchTaskProgress = async (taskId: string) => {
        try {
            // ตรวจสอบว่ามี subtasks หรือไม่
            if (subtasks[taskId] && subtasks[taskId].length > 0) {
                // คำนวณใหม่จาก subtasks ที่มีอยู่
                const calculatedProgress = calculateProgress(taskId, 'task', {
                    tasks,
                    subtasks,
                    taskProgress,
                    subtaskProgress,
                    updateState: false
                });

                // อัพเดต state ด้วยค่าที่คำนวณได้
                setTaskProgress(prev => ({
                    ...prev,
                    [taskId]: calculatedProgress
                }));

                console.log(`Updated task ${taskId} progress to calculated value: ${calculatedProgress}%`);
            } else {
                // ถ้าไม่มี subtasks ดึงจากฐานข้อมูล
                const response = await getTaskProgress(taskId);
                if (response.success && response.responseObject.length > 0) {
                    const latestProgress = response.responseObject[0];
                    setTaskProgress(prev => ({
                        ...prev,
                        [taskId]: latestProgress.percent
                    }));
                }
            }
        } catch (error) {
            console.error(`Error fetching progress for task ${taskId}:`, error);
        }
    };

    // ดึงความคืบหน้าของ Subtask
    const fetchSubtaskProgress = async (subtaskId: string) => {
        try {
            const response = await getSubtaskProgress(subtaskId);
            if (response.success && response.responseObject.length > 0) {
                // Progress จะถูกเรียงตาม date_recorded ล่าสุดมาก่อน
                const latestProgress = response.responseObject[0];
                setSubtaskProgress(prev => ({
                    ...prev,
                    [subtaskId]: latestProgress.percent
                }));
            }
        } catch (error) {
            console.error(`Error fetching progress for subtask ${subtaskId}:`, error);
        }
    };

    const toggleExpandTask = (taskId: string) => {
        setExpandedTasks(prev => {
            const isExpanded = prev.includes(taskId);

            if (isExpanded) {
                return prev.filter(id => id !== taskId);
            } else {
                // ถ้ากำลังจะเปิด ให้ดึงข้อมูลและคำนวณความคืบหน้าใหม่
                if (!subtasks[taskId] || subtasks[taskId]?.length === 0) {
                    fetchSubtasks(taskId).then(() => {
                        // หลังจากดึงข้อมูล subtasks แล้ว คำนวณและอัพเดตค่าความคืบหน้า
                        const calculatedProgress = calculateProgress(taskId, 'task', {
                            tasks,
                            subtasks,
                            taskProgress,
                            subtaskProgress
                        });

                        // บันทึกค่าไว้ใน state เพื่อให้ใช้ค่าเดียวกันไม่ว่าจะกด dropdown หรือไม่
                        setTaskProgress(prev => ({
                            ...prev,
                            [taskId]: calculatedProgress
                        }));
                    });
                }
                return [...prev, taskId];
            }
        });
    };

    // Format date to display as dd/mm/yyyy
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Format budget to display with commas
    const formatBudget = (budget: number | undefined) => {
        if (!budget && budget !== 0) return "-";
        return Number(budget).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <div className="space-y-4">
            {/* Project Header section */}
            <div>
                <Flex direction="column" gap="1">
                    <Flex align="center" gap="2">
                        <Text
                            size="2"
                            className="text-blue-500 hover:underline cursor-pointer flex items-center"
                            onClick={() => navigate('/ManagerProjectList')}
                        >
                            <ArrowLeftIcon className="mr-1" /> Project List
                        </Text>
                    </Flex>
                    <Heading size="6" className="mt-1">
                        {projectName || "All Tasks"}
                    </Heading>
                </Flex>
            </div>

            {/* Project Progress Component */}
            <ProjectProgress
                tasks={tasks}
                subtasks={subtasks}
                taskProgress={taskProgress}
            />

            {/* Tasks List */}
            <Card variant="surface">
                <Flex className="w-full" direction="row" gap="2" justify="between">
                    <Text as="div" size="4" weight="bold">
                        Tasks
                    </Text>
                    <DialogAddTask
                        getTaskData={() => currentProjectId ? getTaskByProject(currentProjectId) : getTaskData()}
                        projectId={currentProjectId}
                    />
                </Flex>
                <div className="w-full mt-2">
                    {isLoading ? (
                        <Flex align="center" justify="center" py="4">
                            <Text>Loading tasks...</Text>
                        </Flex>
                    ) : (
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {tasks.length > 0 ? (
                                    tasks.map((task: TypeTaskAll) => (
                                        <React.Fragment key={`fragment-${task.task_id}`}>
                                            <Table.Row key={`task-${task.task_id}`}>
                                                <Table.Cell>
                                                    <Button
                                                        variant="ghost"
                                                        size="1"
                                                        onClick={() => toggleExpandTask(task.task_id)}
                                                    >
                                                        {expandedTasks.includes(task.task_id) ?
                                                            <ChevronDownIcon /> :
                                                            <ChevronRightIcon />}
                                                    </Button>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text>{task.task_name}</Text>
                                                </Table.Cell>
                                                <Table.Cell>{formatBudget(task.budget)}</Table.Cell>
                                                <Table.Cell>{formatDate(task.start_date)}</Table.Cell>
                                                <Table.Cell>{formatDate(task.end_date)}</Table.Cell>
                                                <Table.Cell>{task.status}</Table.Cell>
                                                <Table.Cell>
                                                    <Tooltip content={`${(expandedTasks.includes(task.task_id)
                                                        ? calculateProgress(task.task_id, 'task', {
                                                            tasks,
                                                            subtasks,
                                                            taskProgress,
                                                            subtaskProgress,
                                                            updateState: false
                                                        })
                                                        : taskProgress[task.task_id] || 0).toFixed(2)}%`}>
                                                        <div style={{ width: '100px' }}>
                                                            <ProgressBar
                                                                percent={expandedTasks.includes(task.task_id)
                                                                    ? calculateTaskProgress(task.task_id)
                                                                    : (taskProgress[task.task_id] || 0)
                                                                }
                                                            />
                                                        </div>
                                                    </Tooltip>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Flex gap="2">
                                                        <DialogAddSubTask
                                                            getSubtaskData={() => fetchSubtasks(task.task_id)}
                                                            taskId={task.task_id}
                                                            taskName={task.task_name}
                                                            updateTaskStatus={() => updateTaskStatusFromSubtasks(task.task_id)}
                                                        />
                                                        <DialogEditTask
                                                            getTaskData={() => currentProjectId ? getTaskByProject(currentProjectId) : getTaskData()}
                                                            task_id={task.task_id}
                                                            task_name={task.task_name}
                                                            description={task.description}
                                                            budget={task.budget}
                                                            start_date={task.start_date}
                                                            end_date={task.end_date}
                                                            status={task.status}
                                                            updateSubtasksOnComplete={true}
                                                            updateTaskStatusFromSubtasks={updateTaskStatusFromSubtasks}
                                                        />
                                                        <AlertDialogDeleteTask
                                                            getTaskData={() => currentProjectId ? getTaskByProject(currentProjectId) : getTaskData()}
                                                            task_id={task.task_id}
                                                            task_name={task.task_name}
                                                        />
                                                    </Flex>
                                                </Table.Cell>
                                            </Table.Row>

                                            {/* SubTasks Section */}
                                            {expandedTasks.includes(task.task_id) && subtasks[task.task_id]?.map((subtask) => (
                                                <Table.Row key={`subtask-${subtask.subtask_id}-${task.task_id}`} className="bg-gray-50">
                                                    <Table.Cell>
                                                        <div className="pl-6"></div>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Text size="2" className="pl-4">{subtask.subtask_name}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell>{formatBudget(subtask.budget)}</Table.Cell>
                                                    <Table.Cell>{formatDate(subtask.start_date)}</Table.Cell>
                                                    <Table.Cell>{formatDate(subtask.end_date)}</Table.Cell>
                                                    <Table.Cell>
                                                        <Text size="2">{subtask.status}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Tooltip content={`${subtaskProgress[subtask.subtask_id] || 0}%`}>
                                                            <div style={{ width: '100px' }}>
                                                                <ProgressBar
                                                                    percent={subtaskProgress[subtask.subtask_id] || 0}
                                                                />
                                                            </div>
                                                        </Tooltip>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Flex gap="2">
                                                            <div style={{ width: "51px" }}></div>
                                                            <DialogEditSubtask
                                                                getSubtaskData={() => {
                                                                    fetchSubtasks(task.task_id);
                                                                    fetchTaskProgress(task.task_id);
                                                                    updateTaskStatusFromSubtasks(task.task_id);
                                                                }}
                                                                subtaskId={subtask.subtask_id}
                                                                taskId={task.task_id}
                                                                trigger={<Button className="cursor-pointer" size="1" variant="soft" color="orange">Edit</Button>}
                                                                updateTaskStatus={updateTaskStatusFromSubtasks}
                                                            />
                                                            <AlertDialogDeleteSubtask
                                                                getSubtaskData={() => {
                                                                    fetchSubtasks(task.task_id);
                                                                    fetchTaskProgress(task.task_id);
                                                                    updateTaskStatusFromSubtasks(task.task_id);
                                                                }}
                                                                subtask_id={subtask.subtask_id}
                                                                subtask_name={subtask.subtask_name}
                                                            />
                                                        </Flex>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}

                                            {expandedTasks.includes(task.task_id) && (!subtasks[task.task_id] || subtasks[task.task_id]?.length === 0) && (
                                                <Table.Row key={`empty-${task.task_id}`}>
                                                    <Table.Cell></Table.Cell>
                                                    <Table.Cell colSpan={7}>
                                                        <Text size="2" color="gray">No subtasks found</Text>
                                                    </Table.Cell>
                                                </Table.Row>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={8} className="text-center py-8">
                                            <Text size="2" color="gray">No tasks found for this project</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    )}
                </div>
            </Card>
        </div>
    );
}