// import React, { useState, useEffect } from "react";
// import { Table, Text } from "@radix-ui/themes";
// import { getTask, updateStartDateTask, updateEndDateTask } from "@/services/task.service";
// import DialogEditTask from "./components/DialogEditTask";
// import DialogEditSubTask from "./components/DialogEditSubtask";
// import DialogAddSubTask from "./components/DialogAddSubTask";
// import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";

// // Interfaces
// interface Task {
//     taskId: string;
//     taskName: string;
//     description: string;
//     budget: number;
//     startDate: string;
//     endDate: string;
//     status: string;
//     startCol?: number;
//     span?: number;
//     subtasks?: Subtask[];
// }

// interface Subtask {
//     subtaskId: string;
//     subtaskName: string;
//     description: string;
//     budget: number;
//     startDate: string;
//     endDate: string;
//     status: string;
//     startCol?: number;
//     span?: number;
// }

// interface DateTableProps {
//     year: number;
//     tasks: Task[];
//     fetchTasks: () => void;
//     fetchSubtasks: () => void;
// }

// // Utility Functions
// const parseDate = (dateString: string) => {
//     const [day, month, year] = dateString.split("/").map(Number);
//     return new Date(year + 2000, month - 1, day); // เพิ่ม 2000 เพื่อให้เป็นปี 2025
// };




// const calculateStartColAndSpan = (startDate: string, endDate: string, year: number) => {
//     const start = parseDate(startDate);
//     const end = parseDate(endDate);

//     if (start.getFullYear() !== year && end.getFullYear() !== year) {
//         return { startCol: 0, span: 0 };
//     }

//     const startCol = Math.max(
//         1,
//         Math.floor((start.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
//     );

//     const endCol = Math.min(
//         365,
//         Math.floor((end.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
//     );

//     const span = endCol - startCol + 1;

//     return { startCol, span };
// };

// const formatDate = (dateString: string) => {
//     const [day, month, year] = dateString.split("/").map(Number);
//     return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year + 2000}`;
// };

// // Main Component
// const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks }) => {
//     const [expandedTask, setExpandedTask] = useState<string | null>(null);
//     const [expandedTasks, setExpandedTasks] = useState<string[]>([]);


//     useEffect(() => {
//         const fetchTasks = async () => {
//             const response = await getTask();
//             const mappedTasks = response.responseObject.map((task: any) => ({
//                 taskId: task.task_id,
//                 taskName: task.task_name,
//                 description: task.description,
//                 budget: Number(task.budget),
//                 startDate: task.start_date,
//                 endDate: task.end_date,
//                 status: task.status,
//                 subtasks: task.subtasks || [],
//             }));
//         };

//         fetchTasks();
//     }, []);


//     const toggleSubtasks = (taskId: string) => {
//         setExpandedTasks((prev) =>
//             prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
//         );
//     };

//     const months = Array.from({ length: 12 }, (_, index) => ({
//         name: new Date(year, index).toLocaleString("default", { month: "short" }),
//         days: new Date(year, index + 1, 0).getDate(),
//     }));

//     const handleDragStart = (e: React.MouseEvent, task: Task) => {
//         const target = e.currentTarget as HTMLElement; // แปลงประเภทเป็น HTMLElement
//         target.dataset.dragging = "true";
//         target.dataset.startX = e.clientX.toString();
//         target.dataset.taskId = task.taskId;
//     };

//     const handleDragMove = (e: React.MouseEvent) => {
//         const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement; // แปลงประเภทเป็น HTMLElement
//         if (!draggingElement) return;

//         const startX = parseInt(draggingElement.dataset.startX || "0", 10);
//         const deltaX = e.clientX - startX;

//         // คำนวณจำนวนวันที่เลื่อน
//         const daysMoved = Math.round(deltaX / 20); // สมมติว่า 20px = 1 วัน
//         const taskId = draggingElement.dataset.taskId;

//         if (taskId) {
//             const task = tasks.find((t) => t.taskId === taskId);
//             if (task) {
//                 const newStartDate = new Date(parseDate(task.startDate));
//                 const newEndDate = new Date(parseDate(task.endDate));

//                 newStartDate.setDate(newStartDate.getDate() + daysMoved);
//                 newEndDate.setDate(newEndDate.getDate() + daysMoved);

//                 // อัปเดตวันที่ใหม่ใน UI (ถ้าจำเป็น)
//                 draggingElement.style.transform = `translateX(${deltaX}px)`;
//             }
//         }
//     };

//     const handleDragEnd = async (e: React.MouseEvent) => {
//         const draggingElement = document.querySelector("[data-dragging='true']") as HTMLElement; // แปลงประเภทเป็น HTMLElement
//         if (!draggingElement) return;

//         const taskId = draggingElement.dataset.taskId;
//         const deltaX = parseInt(draggingElement.style.transform.replace("translateX(", "").replace("px)", ""), 10);
//         const daysMoved = Math.round(deltaX / 20);

//         if (taskId) {
//             const task = tasks.find((t) => t.taskId === taskId);
//             if (task) {
//                 const newStartDate = new Date(parseDate(task.startDate));
//                 const newEndDate = new Date(parseDate(task.endDate));

//                 newStartDate.setDate(newStartDate.getDate() + daysMoved);
//                 newEndDate.setDate(newEndDate.getDate() + daysMoved);

//                 try {
//                     // เรียก API เพื่ออัปเดตวันที่
//                     console.log("Payload:", { task_id: taskId, start_date: newStartDate.toISOString().split("T")[0] });
//                     await updateStartDateTask({ task_id: taskId, start_date: newStartDate.toISOString().split("T")[0] });
//                     await updateEndDateTask({ task_id: taskId, end_date: newEndDate.toISOString().split("T")[0] });

//                     // รีเฟรชข้อมูล Task
//                     fetchTasks();
//                 } catch (error) {
//                     console.error("Failed to update task dates:", error);
//                 }
//             }
//         }

//         // รีเซ็ตสถานะการลาก
//         draggingElement.dataset.dragging = "false";
//         draggingElement.style.transform = "";
//     };

//     const handleResizeStart = (e: React.MouseEvent, task: Task, direction: "start" | "end") => {
//         const target = e.currentTarget as HTMLElement;
//         target.dataset.resizing = direction;
//         target.dataset.startX = e.clientX.toString();
//         target.dataset.taskId = task.taskId;
//     };

//     const handleResizeMove = (e: React.MouseEvent) => {
//         const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
//         if (!resizingElement) return;

//         const startX = parseInt(resizingElement.dataset.startX || "0", 10);
//         const deltaX = e.clientX - startX;
//         const daysMoved = Math.round(deltaX / 20); // สมมติว่า 20px = 1 วัน
//         const taskId = resizingElement.dataset.taskId;
//         const direction = resizingElement.dataset.resizing as "start" | "end";

//         if (taskId && direction) {
//             const task = tasks.find((t) => t.taskId === taskId);
//             if (task) {
//                 const newStartDate = new Date(parseDate(task.startDate));
//                 const newEndDate = new Date(parseDate(task.endDate));

//                 if (direction === "start") {
//                     newStartDate.setDate(newStartDate.getDate() + daysMoved);
//                 } else if (direction === "end") {
//                     newEndDate.setDate(newEndDate.getDate() + daysMoved);
//                 }

//                 // อัปเดตวันที่ใหม่ใน UI (ถ้าจำเป็น)
//                 resizingElement.style.transform = `translateX(${deltaX}px)`;
//             }
//         }
//     };

//     const handleResizeEnd = async (e: React.MouseEvent) => {
//         const resizingElement = document.querySelector("[data-resizing]") as HTMLElement;
//         if (!resizingElement) return;

//         const taskId = resizingElement.dataset.taskId;
//         const deltaX = parseInt(resizingElement.style.transform.replace("translateX(", "").replace("px)", ""), 10);
//         const daysMoved = Math.round(deltaX / 20);
//         const direction = resizingElement.dataset.resizing as "start" | "end";

//         if (taskId && direction) {
//             const task = tasks.find((t) => t.taskId === taskId);
//             if (task) {
//                 const newStartDate = new Date(parseDate(task.startDate));
//                 const newEndDate = new Date(parseDate(task.endDate));

//                 if (direction === "start") {
//                     newStartDate.setDate(newStartDate.getDate() + daysMoved);
//                 } else if (direction === "end") {
//                     newEndDate.setDate(newEndDate.getDate() + daysMoved);
//                 }

//                 try {
//                     // เรียก API เพื่ออัปเดตวันที่
//                     if (direction === "start") {
//                         await updateStartDateTask({ task_id: taskId, start_date: newStartDate.toISOString().split("T")[0] });
//                     } else if (direction === "end") {
//                         await updateEndDateTask({ task_id: taskId, end_date: newEndDate.toISOString().split("T")[0] });
//                     }

//                     // รีเฟรชข้อมูล Task
//                     fetchTasks();
//                 } catch (error) {
//                     console.error("Failed to update task dates:", error);
//                 }
//             }
//         }

//         // รีเซ็ตสถานะการปรับขนาด
//         resizingElement.dataset.resizing = "";
//         resizingElement.style.transform = "";
//     };

//     return (
//         <div className=" relative w-screen overflow-hidden ">
//         {/* Fixed left columns container */}
//         <div className="absolute left-0 top-0 z-10  overflow-hidden">
//           <Table.Root variant="surface" className="w-auto ">
//             <Table.Header className=" h-[88px]">
//               <Table.Row>
//                 <Table.ColumnHeaderCell rowSpan={2} className="w-[50px] bg-yellow-200 text-left align-middle">
//                   Task Name
//                 </Table.ColumnHeaderCell>
//                 <Table.ColumnHeaderCell rowSpan={2} className="w-[100px] bg-yellow-200 text-center align-middle">
//                   Start Date
//                 </Table.ColumnHeaderCell>
//                 <Table.ColumnHeaderCell rowSpan={2} className="w-[100px] bg-yellow-200 text-center align-middle">
//                   End Date
//                 </Table.ColumnHeaderCell>
//                 <Table.ColumnHeaderCell rowSpan={2} className="w-[100px] bg-yellow-200 text-center align-middle border-r-2 border-gray-300">
//                   Status
//                 </Table.ColumnHeaderCell>
//               </Table.Row>
//               <Table.Row></Table.Row> {/* Empty row for alignment */}
//             </Table.Header>
            
//             <Table.Body>
//               {tasks.map((task, taskIndex) => (
//                 <React.Fragment key={taskIndex}>
//                   <Table.Row>
//                     <Table.Cell className="w-[350px] bg-yellow-200 flex items-center">
//                       {/* Your task name cell content */}
//                       <button onClick={() => toggleSubtasks(task.taskId)} className="mr-2 focus:outline-none">
//                         {expandedTasks.includes(task.taskId) ? (
//                           <ChevronDownIcon className="w-4 h-4" />
//                         ) : (
//                           <ChevronRightIcon className="w-4 h-4" />
//                         )}
//                       </button>
//                       <DialogEditTask
//                         getTaskData={fetchTasks}
//                         taskId={task.taskId}
//                         trigger={
//                           <Text className="cursor-pointer hover:text-blue-600 hover:underline">
//                             {task.taskName}
//                           </Text>
//                         }
//                       />
//                       <div className="ml-4 flex items-center">
//                         <DialogAddSubTask
//                           getSubtaskData={fetchSubtasks}
//                           taskId={task.taskId}
//                           taskName={task.taskName}
//                         />
//                       </div>
//                     </Table.Cell>
//                     <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(task.startDate)}</Table.Cell>
//                     <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(task.endDate)}</Table.Cell>
//                     <Table.Cell className="w-[100px] bg-yellow-200 border-r-2 border-gray-300">{task.status}</Table.Cell>
//                   </Table.Row>
                  
//                   {expandedTasks.includes(task.taskId) &&
//                     task.subtasks?.map((subtask, subtaskIndex) => (
//                       <Table.Row key={subtaskIndex} className="bg-gray-50">
//                         <Table.Cell className="pl-8 w-[250px] bg-yellow-200">
//                           <DialogEditSubTask
//                             getSubtaskData={fetchSubtasks}
//                             subtaskId={subtask.subtaskId}
//                             trigger={
//                               <Text className="cursor-pointer hover:text-blue-600 hover:underline">
//                                 {subtask.subtaskName}
//                               </Text>
//                             }
//                           />
//                         </Table.Cell>
//                         <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(subtask.startDate)}</Table.Cell>
//                         <Table.Cell className="w-[100px] bg-yellow-200">{formatDate(subtask.endDate)}</Table.Cell>
//                         <Table.Cell className="w-[100px] bg-yellow-200 border-r-2 border-gray-300">
//                           {subtask.status}
//                         </Table.Cell>
//                       </Table.Row>
//                     ))}
//                 </React.Fragment>
//               ))}
//             </Table.Body>
//           </Table.Root>
//         </div>
        
//         {/* Scrollable right columns container */}
//         <div className="ml-[650px] overflow-x-auto">
//           <Table.Root variant="surface" className="w-auto">
//             <Table.Header>
//               <Table.Row>
//                 {months.map((month, index) => (
//                   <Table.ColumnHeaderCell
//                     key={index}
//                     colSpan={month.days}
//                     className={`text-center ${index < months.length - 1 ? "border-r border-gray-300" : ""}`}
//                   >
//                     <Text size="2">{month.name}</Text>
//                   </Table.ColumnHeaderCell>
//                 ))}
//               </Table.Row>
//               <Table.Row>
//                 {months.map((month, index) =>
//                   Array.from({ length: month.days }, (_, dayIndex) => (
//                     <Table.ColumnHeaderCell
//                       key={`${index}-${dayIndex}`}
//                       className={`text-center bg-gray-50 ${
//                         dayIndex === month.days - 1 && index < months.length - 1
//                           ? "border-r border-gray-300"
//                           : ""
//                       }`}
//                     >
//                       <Text size="1">{dayIndex + 1}</Text>
//                     </Table.ColumnHeaderCell>
//                   ))
//                 )}
//               </Table.Row>
//             </Table.Header>
            
//             <Table.Body>
//               {tasks.map((task, taskIndex) => {
//                 const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
//                 return (
//                   <React.Fragment key={taskIndex}>
//                     <Table.Row>
//                       {Array.from({ length: 365 }).map((_, dayIndex) => {
//                         const isStart = dayIndex + 1 === startCol;
//                         return (
//                           <Table.Cell key={dayIndex} className="relative group">
//                             {isStart && span > 0 && (
//                               <div
//                                 className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
//                                 style={{
//                                   left: 0,
//                                   width: `calc(${span} * 100%)`,
//                                 }}
//                               >
//                                 {/* Your tooltip and resize handles */}
//                               </div>
//                             )}
//                           </Table.Cell>
//                         );
//                       })}
//                     </Table.Row>
                    
//                     {expandedTasks.includes(task.taskId) &&
//                       task.subtasks?.map((subtask, subtaskIndex) => {
//                         const { startCol, span } = calculateStartColAndSpan(
//                           subtask.startDate,
//                           subtask.endDate,
//                           year
//                         );
//                         return (
//                           <Table.Row key={subtaskIndex} className="bg-gray-50">
//                             {Array.from({ length: 365 }).map((_, dayIndex) => {
//                               const isStart = dayIndex + 1 === startCol;
//                               return (
//                                 <Table.Cell key={dayIndex} className="relative group">
//                                   {isStart && (
//                                     <div
//                                       className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-green-500 group-hover:bg-green-600 transition-all duration-300"
//                                       style={{
//                                         left: 0,
//                                         width: `calc(${span} * 100%)`,
//                                       }}
//                                     >
//                                       {/* Your subtask tooltip */}
//                                     </div>
//                                   )}
//                                 </Table.Cell>
//                               );
//                             })}
//                           </Table.Row>
//                         );
//                       })}
//                   </React.Fragment>
//                 );
//               })}
//             </Table.Body>
//           </Table.Root>
//         </div>
//       </div>
//     );
// };

// export default DateTable;