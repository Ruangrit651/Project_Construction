import React from "react";
import { Table } from "@radix-ui/themes";

interface TaskRowProps {
    taskName: string;
    startDate: string | undefined;
    endDate: string | undefined;
    status: string;
    startCol: number;
    span: number;
}

const TaskRow: React.FC<TaskRowProps> = ({ taskName, startDate, endDate, status, startCol, span }) => {
    return (
        <>
            <Table.Cell className="border-r-2 border-gray-300">{status}</Table.Cell>
            {Array.from({ length: 12 }).map((_, monthIndex) => {
                const isStart = monthIndex + 1 === startCol;
                return (
                    <Table.Cell key={monthIndex} className="relative group">
                        {isStart && (
                            <div
                                className="absolute h-4 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
                                style={{
                                    left: 0,
                                    width: `calc(${span} * 100%)`,
                                }}
                            >
                                {/* Hover Tooltip */}
                                <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
                                    {taskName}
                                    <br />
                                    {startDate} - {endDate}
                                    <br />
                                    Status: {status}
                                </div>
                            </div>
                        )}
                    </Table.Cell>
                );
            })}
        </>
    );
};

export default TaskRow;

// import React, { useState } from "react";
// import { Table } from "@radix-ui/themes";
// import { patchTask } from "@/services/task.service";

// interface TaskRowProps {
//     taskId: string;
//     taskName: string;
//     startDate: string;
//     endDate: string;
//     status: string;
//     startCol: number;
//     span: number;
//     fetchTasks: () => void; // Function to reload tasks
// }

// const TaskRow: React.FC<TaskRowProps> = ({ taskId, taskName, startDate, endDate, status, startCol, span, fetchTasks }) => {
//     const [currentStartCol, setCurrentStartCol] = useState(startCol);
//     const [currentSpan, setCurrentSpan] = useState(span);
//     const [isDragging, setIsDragging] = useState(false);
//     const [daysChanged, setDaysChanged] = useState(0); // จำนวนวันที่เพิ่มหรือลด

//     // คำนวณวันที่ใหม่จากตำแหน่งคอลัมน์
//     const calculateDateFromColumn = (col: number): string => {
//         const baseDate = new Date(startDate); // Assume startDate is the base
//         baseDate.setDate(baseDate.getDate() + (col - startCol) * 30); // Example: 1 column = 30 days
//         return baseDate.toISOString().split("T")[0];
//     };

//     // เริ่มการลาก
//     const handleMouseDown = (e: React.MouseEvent) => {
//         setIsDragging(true);
//         e.preventDefault();
//     };

//     // คำนวณตำแหน่งใหม่ระหว่างการลาก
//     const handleMouseMove = (e: MouseEvent) => {
//         if (!isDragging) return;

//         const deltaX = e.movementX; // ระยะที่ลากในแนวนอน
//         const newStartCol = Math.max(1, currentStartCol + Math.round(deltaX / 50)); // 50px = 1 column
//         const daysDelta = (newStartCol - startCol) * 30; // คำนวณจำนวนวันที่เปลี่ยนแปลง
//         setCurrentStartCol(newStartCol);
//         setDaysChanged(daysDelta); // อัปเดตจำนวนวันที่เปลี่ยนแปลง
//     };

//     // หยุดการลากและอัปเดตข้อมูล
//     const handleMouseUp = async () => {
//         if (!isDragging) return;

//         setIsDragging(false);
//         setDaysChanged(0); // รีเซ็ตจำนวนวันที่เปลี่ยนแปลง
//         const newStartDate = calculateDateFromColumn(currentStartCol);
//         const newEndDate = calculateDateFromColumn(currentStartCol + currentSpan);

//         try {
//             await patchTask({
//                 task_id: taskId,
//                 task_name: taskName,
//                 status: status,
//                 start_date: newStartDate,
//                 end_date: newEndDate,
//             });
//             fetchTasks(); // Reload tasks after update
//         } catch (error) {
//             console.error("Failed to update task:", error);
//         }
//     };

//     // เพิ่ม Event Listeners สำหรับการลาก
//     React.useEffect(() => {
//         if (isDragging) {
//             window.addEventListener("mousemove", handleMouseMove);
//             window.addEventListener("mouseup", handleMouseUp);
//         } else {
//             window.removeEventListener("mousemove", handleMouseMove);
//             window.removeEventListener("mouseup", handleMouseUp);
//         }

//         return () => {
//             window.removeEventListener("mousemove", handleMouseMove);
//             window.removeEventListener("mouseup", handleMouseUp);
//         };
//     }, [isDragging]);

//     return (
//         <>
//             <Table.Cell className="border-r-2 border-gray-300">{status}</Table.Cell>
//             {Array.from({ length: 12 }).map((_, monthIndex) => {
//                 const isStart = monthIndex + 1 === currentStartCol;
//                 return (
//                     <Table.Cell
//                         key={monthIndex}
//                         className={`relative group ${isDragging ? "bg-gray-200" : ""}`}
//                         onMouseDown={isStart ? handleMouseDown : undefined}
//                     >
//                         {isStart && (
//                             <div
//                                 className="absolute h-4 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
//                                 style={{
//                                     left: 0,
//                                     width: `calc(${currentSpan} * 100%)`,
//                                 }}
//                             >
//                                 {/* Hover Tooltip */}
//                                 <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
//                                     {taskName}
//                                     <br />
//                                     {startDate} - {endDate}
//                                     <br />
//                                     Status: {status}
//                                     <br />
//                                     {isDragging && (
//                                         <span>
//                                             {daysChanged > 0
//                                                 ? `+${daysChanged} days`
//                                                 : `${daysChanged} days`}
//                                         </span>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </Table.Cell>
//                 );
//             })}
//         </>
//     );
// };

// export default TaskRow;

// import React, { useState } from "react";
// import { useDrag, useDrop } from "react-dnd";
// import { Table } from "@radix-ui/themes";
// import { patchTask } from "@/services/task.service";

// interface TaskRowProps {
//     taskId: string;
//     taskName: string;
//     startDate: string; 
//     endDate: string;
//     status: string;
//     startCol: number;
//     span: number;
//     fetchTasks: () => void; // Function to reload tasks
// }

// const TaskRow: React.FC<TaskRowProps> = ({ taskId, taskName, startDate, endDate, status, startCol, span, fetchTasks }) => {
//     const [currentStartCol, setCurrentStartCol] = useState(startCol);
//     const [currentSpan, setCurrentSpan] = useState(span);

//     // Drag Handle for Start
//     const [{ isDraggingStart }, dragStart] = useDrag(() => ({
//         type: "TASK_START",
//         item: { taskId, currentStartCol, currentSpan },
//         collect: (monitor) => ({
//             isDraggingStart: monitor.isDragging(),
//         }),
//     }));

//     // Drag Handle for End
//     const [{ isDraggingEnd }, dragEnd] = useDrag(() => ({
//         type: "TASK_END",
//         item: { taskId, currentStartCol, currentSpan },
//         collect: (monitor) => ({
//             isDraggingEnd: monitor.isDragging(),
//         }),
//     }));

//     const [, drop] = useDrop(() => ({
//         accept: ["TASK_START", "TASK_END"],
//         hover: (item: any, monitor) => {
//             const delta = monitor.getDifferenceFromInitialOffset();
//             if (delta) {
//                 if (monitor.getItemType() === "TASK_START") {
//                     const newStartCol = Math.max(1, currentStartCol + Math.round(delta.x / 50)); // Adjust based on grid size
//                     const newSpan = currentSpan - (newStartCol - currentStartCol);
//                     if (newSpan > 0) {
//                         setCurrentStartCol(newStartCol);
//                         setCurrentSpan(newSpan);
//                     }
//                 } else if (monitor.getItemType() === "TASK_END") {
//                     const newSpan = Math.max(1, currentSpan + Math.round(delta.x / 50)); // Adjust based on grid size
//                     setCurrentSpan(newSpan);
//                 }
//             }
//         },
//         drop: async (item: any, monitor) => {
//             const newStartDate = calculateDateFromColumn(currentStartCol);
//             const newEndDate = calculateDateFromColumn(currentStartCol + currentSpan);

//             try {
//                 await patchTask({
//                     task_id: taskId,
//                     task_name: taskName,
//                     status: status,
//                     start_date: newStartDate,
//                     end_date: newEndDate,
//                 });
//                 fetchTasks(); // Reload tasks after update
//             } catch (error) {
//                 console.error("Failed to update task:", error);
//             }
//         },
//     }));

//     // Helper function to calculate date from column
//     const calculateDateFromColumn = (col: number): string => {
//         const baseDate = new Date(startDate); // Assume startDate is the base
//         baseDate.setDate(baseDate.getDate() + (col - startCol) * 30); // Example: 1 column = 30 days
//         return baseDate.toISOString().split("T")[0];
//     };

//     return (
//         <>
//             <Table.Cell className="border-r-2 border-gray-300">{status}</Table.Cell>
//             {Array.from({ length: 12 }).map((_, monthIndex) => {
//                 const isStart = monthIndex + 1 === currentStartCol;
//                 const isEnd = monthIndex + 1 === currentStartCol + currentSpan - 1;
//                 return (
//                     <Table.Cell
//                         key={monthIndex}
//                         className={`relative group ${isDraggingStart || isDraggingEnd ? "bg-gray-200" : ""}`}
//                         ref={drop}
//                     >
//                         {isStart && (
//                             <div
//                                 ref={dragStart}
//                                 className="absolute h-4 w-4 top-1/2 left-0 transform -translate-y-1/2 bg-blue-500 rounded-full cursor-ew-resize"
//                             />
//                         )}
//                         {isEnd && (
//                             <div
//                                 ref={dragEnd}
//                                 className="absolute h-4 w-4 top-1/2 right-0 transform -translate-y-1/2 bg-red-500 rounded-full cursor-ew-resize"
//                             />
//                         )}
//                         {isStart && (
//                             <div
//                                 className="absolute h-4 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
//                                 style={{
//                                     left: 0,
//                                     width: `calc(${currentSpan} * 100%)`,
//                                 }}
//                             >
//                                 {/* Hover Tooltip */}
//                                 <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
//                                     {taskName}
//                                     <br />
//                                     {startDate} - {endDate}
//                                     <br />
//                                     Status: {status}
//                                 </div>
//                             </div>
//                         )}
//                     </Table.Cell>
//                 );
//             })}
//         </>
//     );
// };

// export default TaskRow;