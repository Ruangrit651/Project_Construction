import React, { useState } from "react";
import { Table, Text } from "@radix-ui/themes";
import DialogEditTask from "./components/DialogEditTask";
import DialogEditSubTask from "./components/DialogEditSubtask";
import DialogAddSubTask from "./components/DialogAddSubTask";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface Task {
    taskId: string;
    taskName: string;
    startDate: string;
    endDate: string;
    status: string;
    startCol?: number;
    span?: number;
    subtasks?: Subtask[];
}

interface Subtask {
    subtaskId: string;
    subtaskName: string;
    startDate: string;
    endDate: string;
    status: string;
    startCol?: number;
    span?: number;
}

interface DateTableProps {
    year: number;
    tasks: Task[];
    fetchTasks: () => void;
    fetchSubtasks: () => void;
}

const DateTable: React.FC<DateTableProps> = ({ year, tasks, fetchTasks, fetchSubtasks }) => {
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    const toggleSubtasks = (taskId: string) => {
        setExpandedTask(expandedTask === taskId ? null : taskId);
    };

    const months = Array.from({ length: 12 }, (_, index) => ({
        name: new Date(year, index).toLocaleString("default", { month: "short" }),
        days: new Date(year, index + 1, 0).getDate(),
    }));

    const parseDate = (dateString: string) => {
        const [day, month, year] = dateString.split("/").map(Number);
        return new Date(year + 2000, month - 1, day); // เพิ่ม 2000 เพื่อให้เป็นปี 2025
    };

    const calculateStartColAndSpan = (startDate: string, endDate: string, year: number) => {
        const start = parseDate(startDate);
        const end = parseDate(endDate);

        if (start.getFullYear() !== year && end.getFullYear() !== year) {
            return { startCol: 0, span: 0 };
        }

        const startCol = Math.max(
            1,
            Math.floor((start.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

        const endCol = Math.min(
            365,
            Math.floor((end.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
        );

        const span = endCol - startCol + 1;

        return { startCol, span };
    };

    return (
        <Table.Root variant="surface" className="min-w-[1400px]">
            <Table.Header>
                <Table.Row>
                    {/* คอลัมน์สำหรับ Task Name, Start Date, End Date, Status */}
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[200px] text-center align-middle">
                        Task Name
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[120px] text-center align-middle">
                        Start Date
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[120px] text-center align-middle">
                        End Date
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} className="w-[150px] text-center align-middle border-r-2 border-gray-300">
                        Status
                    </Table.ColumnHeaderCell>

                    {/* คอลัมน์สำหรับชื่อเดือน */}
                    {months.map((month, index) => (
                        <Table.ColumnHeaderCell 
                            key={index}
                            colSpan={month.days}
                            className={`text-center bg-gray-100  ${index < months.length - 1 ? "border-r border-gray-300" : ""}`}
                        >
                            <Text size="2">{month.name}</Text>
                        </Table.ColumnHeaderCell>
                    ))}
                </Table.Row>

                <Table.Row className="overflow-x-auto">
                    {/* คอลัมน์สำหรับวันที่ */}
                    {months.map((month, index) =>
                        Array.from({ length: month.days }, (_, dayIndex) => (
                            <Table.ColumnHeaderCell
                                key={`${index}-${dayIndex}`}
                                className={`text-center bg-gray-50 ${dayIndex === month.days - 1 && index < months.length - 1 ? "border-r border-gray-300" : ""}`}
                            >
                                <Text size="1">{dayIndex + 1}</Text>
                            </Table.ColumnHeaderCell>
                        ))
                    )}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {tasks.map((task, taskIndex) => {
                    const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
                    console.log(`Task: ${task.taskName}, startCol: ${startCol}, span: ${span}`);
                    console.log(tasks)

                    return (
                        <React.Fragment key={taskIndex}>
                            <Table.Row>
                                <Table.Cell className="font-bold w-[150px] flex items-center">
                                    <button
                                        onClick={() => toggleSubtasks(task.taskId)}
                                        className="mr-2 focus:outline-none"
                                    >
                                        {expandedTask === task.taskId ? (
                                            <ChevronDownIcon className="w-4 h-4" />
                                        ) : (
                                            <ChevronRightIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                    <DialogEditTask
                                        getTaskData={fetchTasks}
                                        taskId={task.taskId}
                                        trigger={
                                            <Text className="cursor-pointer hover:text-blue-500 ">
                                                {task.taskName}
                                            </Text>
                                        }
                                    />
                                    <div className="ml-4 flex items-center">
                                        <DialogAddSubTask
                                            getSubtaskData={fetchSubtasks}
                                            taskId={task.taskId}
                                            taskName={task.taskName}
                                        />
                                    </div>
                                </Table.Cell>
                                <Table.Cell className="w-[150px]">{task.startDate}</Table.Cell>
                                <Table.Cell className="w-[150px]">{task.endDate}</Table.Cell>
                                <Table.Cell className="w-[150px] border-r-2 border-gray-300">{task.status}</Table.Cell>
                                {Array.from({ length: 365 }).map((_, dayIndex) => {
                                    const isStart = dayIndex + 1 === startCol;
                                    return (
                                        <Table.Cell key={dayIndex} className="relative group">
                                            {isStart && span > 0 && (
                                                <div
                                                    className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-blue-500 group-hover:bg-blue-600 transition-all duration-300"
                                                    style={{
                                                        left: 0,
                                                        width: `calc(${span} * 100%)`, // ปรับความกว้างให้สัมพันธ์กับ span
                                                    }}
                                                >
                                                    <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
                                                        {task.taskName}
                                                        <br />
                                                        {task.startDate} - {task.endDate}
                                                        <br />
                                                        Status: {task.status}
                                                    </div>
                                                </div>
                                            )}
                                        </Table.Cell>
                                    );
                                })}
                            </Table.Row>
                            {expandedTask === task.taskId &&
                                task.subtasks?.map((subtask, subtaskIndex) => {
                                    const { startCol, span } = calculateStartColAndSpan(subtask.startDate, subtask.endDate, year);

                                    return (
                                        <Table.Row key={subtaskIndex} className="bg-gray-50">
                                            <Table.Cell className="pl-8 w-[250px]">
                                                <DialogEditSubTask
                                                    getSubtaskData={fetchSubtasks}
                                                    subtaskId={subtask.subtaskId}
                                                    trigger={
                                                        <Text className="cursor-pointer hover:text-blue-500">
                                                            {subtask.subtaskName}
                                                        </Text>
                                                    }
                                                />
                                            </Table.Cell>
                                            <Table.Cell className="w-[150px]">{subtask.startDate}</Table.Cell>
                                            <Table.Cell className="w-[150px]">{subtask.endDate}</Table.Cell>
                                            <Table.Cell className="w-[150px] border-r-2 border-gray-300">{subtask.status}</Table.Cell>
                                            {Array.from({ length: 365 }).map((_, dayIndex) => {
                                                const isStart = dayIndex + 1 === startCol;
                                                return (
                                                    <Table.Cell key={dayIndex} className="relative group">
                                                        {isStart && (
                                                            <div
                                                                className="absolute h-3 top-1/2 transform -translate-y-1/2 rounded bg-green-500 group-hover:bg-green-600 transition-all duration-300"
                                                                style={{
                                                                    left: 0,
                                                                    width: `calc(${span} * 100%)`,
                                                                }}
                                                            >
                                                                <div className="hidden group-hover:block absolute top-[-80px] left-1/2 transform -translate-x-1/2 px-4 py-2 text-xs bg-gray-700 text-white rounded shadow w-64">
                                                                    {subtask.subtaskName}
                                                                    <br />
                                                                    {subtask.startDate} - {subtask.endDate}
                                                                    <br />
                                                                    Status: {subtask.status}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Table.Cell>
                                                );
                                            })}
                                        </Table.Row>
                                    );
                                })}
                        </React.Fragment>
                    );
                })}
            </Table.Body>
        </Table.Root>
    );
};

export default DateTable;

// import React from "react";
// import { Table, Text } from "@radix-ui/themes";

// interface DateTableProps {
//     taskType: string;
//     year: number;
// }

// const DateTable: React.FC<DateTableProps> = ({ taskType, year }) => {
//     // Generate months and days for the selected year
//     const months = Array.from({ length: 12 }, (_, index) => ({
//         name: new Date(year, index).toLocaleString("default", { month: "short" }),
//         days: new Date(year, index + 1, 0).getDate(),
//     }));

//     return (
//         <Table.Root variant="surface" className="min-w-[1200px]">
//             <Table.Header>
//                 <Table.Row>
//                     <Table.ColumnHeaderCell className="w-[180px]">Task Timeline</Table.ColumnHeaderCell>
//                     {months.map((month, index) => (
//                         <Table.ColumnHeaderCell
//                             key={index}
//                             colSpan={month.days}
//                             className={`text-center bg-gray-100 ${index < months.length - 1 ? "border-r border-gray-300" : ""}`}
//                         >
//                             <Text size="2">{month.name}</Text>
//                         </Table.ColumnHeaderCell>
//                     ))}
//                 </Table.Row>
//                 <Table.Row>
//                     <Table.ColumnHeaderCell className="w-[180px]"></Table.ColumnHeaderCell>
//                     {months.map((month, index) =>
//                         Array.from({ length: month.days }, (_, dayIndex) => (
//                             <Table.ColumnHeaderCell
//                                 key={`${index}-${dayIndex}`}
//                                 className={`text-center bg-gray-50 ${dayIndex === month.days - 1 && index < months.length - 1 ? "border-r border-gray-300" : ""}`}
//                             >
//                                 <Text size="1">{dayIndex + 1}</Text>
//                             </Table.ColumnHeaderCell>
//                         ))
//                     )}
//                 </Table.Row>
//             </Table.Header>
//             <Table.Body>
//                 <Table.Row>
//                     <Table.Cell className="font-bold">{taskType}</Table.Cell>
//                     {months.map((month, index) =>
//                         Array.from({ length: month.days }, (_, dayIndex) => (
//                             <Table.Cell
//                                 key={`${index}-${dayIndex}`}
//                                 className={`text-center ${dayIndex === month.days - 1 && index < months.length - 1 ? "border-r border-gray-300" : ""}`}
//                             >
//                                 {/* Add your data here */}
//                             </Table.Cell>
//                         ))
//                     )}
//                 </Table.Row>
//             </Table.Body>
//         </Table.Root>
//     );
// };

// export default DateTable;