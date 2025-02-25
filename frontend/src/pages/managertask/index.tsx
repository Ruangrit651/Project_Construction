// import { useState } from "react";
// import { Card, Table, Text, Flex, Button } from "@radix-ui/themes";
// import DialogAddTask from "./components/DialogAddTask";

// const months = ["August", "September", "October"];
// const weeks = ["week1", "week2", "week3", "week4"];

// export default function Planning() {
//     const [tasks, setTasks] = useState([]);

//     const addTask = (task) => {
//         setTasks([...tasks, task]);
//     };

//     return (
//         <Card className="p-4">
//             <Flex justify="between" align="center" className="mb-4">
//                 <Text size="5" weight="bold">Project Planning</Text>
//                 <DialogAddTask addTask={addTask} />
//             </Flex>
//             <Table.Root>
//                 <Table.Header>
//                     <Table.Row>
//                         <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
//                         {months.map((month) => (
//                             <Table.ColumnHeaderCell colSpan={4} key={month}>
//                                 {month}
//                             </Table.ColumnHeaderCell>
//                         ))}
//                     </Table.Row>
//                     <Table.Row>
//                         <Table.ColumnHeaderCell />
//                         {months.map((month) =>
//                             weeks.map((week) => (
//                                 <Table.ColumnHeaderCell key={`${month}-${week}`}>
//                                     {week}
//                                 </Table.ColumnHeaderCell>
//                             ))
//                         )}
//                     </Table.Row>
//                 </Table.Header>
//                 <Table.Body>
//                     {tasks.map((task, index) => (
//                         <Table.Row key={index}>
//                             <Table.RowHeaderCell>{task.name}</Table.RowHeaderCell>
//                             {months.flatMap(() => weeks).map((_, weekIndex) => (
//                                 <Table.Cell key={weekIndex}>
//                                     {task.startWeek <= weekIndex && task.endWeek >= weekIndex && (
//                                         <div className="bg-blue-500 h-2 rounded"></div>
//                                     )}
//                                 </Table.Cell>
//                             ))}
//                         </Table.Row>
//                     ))}
//                 </Table.Body>
//             </Table.Root>
//         </Card>
//     );
// }

// import { useState } from "react";
// import { Card, Table, Text, Flex } from "@radix-ui/themes";
// import DialogAddTask from "./components/DialogAddTask";
// import ProgressBar from "./components/ProgressBar";

// export default function AdminTaskPage() {
//     const [tasks, setTasks] = useState([]);

//     const addTask = (task) => {
//         setTasks([...tasks, task]);
//     };

//     return (
//         <Card variant="surface">
//             <Flex className="w-full" direction="row" justify="between" align="center" gap="2">
//                 <Text size="4" weight="bold">
//                     Project Planning
//                 </Text>
//             </Flex>
            
//             <DialogAddTask addTask={addTask} />
//             <div className="w-full mt-4">
//                 <Table.Root>
//                     <Table.Header>
//                         <Table.Row>
//                             <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
//                         </Table.Row>
//                     </Table.Header>
//                     <Table.Body>
//                         {tasks.map((task, index) => (
//                             <Table.Row key={index}>
//                                 <Table.RowHeaderCell>{task.name}</Table.RowHeaderCell>
//                                 <Table.Cell>{task.budget}</Table.Cell>
//                                 <Table.Cell>
//                                     <ProgressBar startDate={task.startDate} endDate={task.endDate} />
//                                 </Table.Cell>
//                             </Table.Row>
//                         ))}
//                     </Table.Body>
//                 </Table.Root>
//             </div>
//         </Card>
//     );
// }

// import React, { useState, useEffect } from "react";
// import Scheduler, { SchedulerData, ViewTypes } from "react-big-scheduler";
// import "react-big-scheduler/lib/css/style.css";
// import DialogAddTask from "./components/DialogAddTask";
// import ProgressBar from "./components/ProgressBar";
// import { getTask, postTask } from "@/services/task.service"; // Replace with your API calls

// export default function Planning() {
//     const [schedulerData] = useState(new SchedulerData("2025-01-01", ViewTypes.Week));
//     const [tasks, setTasks] = useState([]);

//     // Fetch existing tasks from the API
//     useEffect(() => {
//         const fetchTasks = async () => {
//             try {
//                 const response = await getTask();
//                 setTasks(response.responseObject); // Assuming API returns an array of tasks
//             } catch (error) {
//                 console.error("Error fetching tasks:", error);
//             }
//         };
//         fetchTasks();
//     }, []);

//     const addTask = async (task) => {
//         try {
//             const response = await postTask(task);
//             setTasks((prev) => [...prev, response.responseObject]);
//             schedulerData.addEvent({
//                 id: response.responseObject.task_id,
//                 start: task.start_date,
//                 end: task.end_date,
//                 title: task.task_name,
//             });
//         } catch (error) {
//             console.error("Error adding task:", error);
//         }
//     };

//     return (
//         <div className="p-4">
//             <div className="flex justify-between items-center mb-4">
//                 <h1 className="text-xl font-bold">Project Planning</h1>
//                 <DialogAddTask addTask={addTask} />
//             </div>
//             <div className="border rounded-lg overflow-hidden">
//                 <Scheduler
//                     schedulerData={schedulerData}
//                     events={tasks.map((task) => ({
//                         id: task.task_id,
//                         start: task.start_date,
//                         end: task.end_date,
//                         title: task.task_name,
//                     }))}
//                     eventItemClick={(event) => alert(`Clicked: ${event.title}`)}
//                     slotClickedFunc={(slot) => console.log(`Slot clicked: ${slot}`)}
//                 />
//             </div>
//             <div className="mt-6">
//                 <h2 className="text-lg font-semibold">Task Progress</h2>
//                 {tasks.map((task) => (
//                     <div key={task.task_id} className="mb-4">
//                         <h3 className="font-medium">{task.task_name}</h3>
//                         <ProgressBar startDate={task.start_date} endDate={task.end_date} />
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }

// import React, { useState, useEffect } from "react";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import DialogAddTask from "./components/DialogAddTask";
// import ProgressBar from "./components/ProgressBar";
// import { getTask, postTask } from "@/services/task.service"; // Import API service

// export default function PlanningPage() {
//     const [selectedDate, setSelectedDate] = useState(new Date());
//     const [tasks, setTasks] = useState([]);

//     // Fetch tasks from the backend
//     useEffect(() => {
//         const fetchTasks = async () => {
//             try {
//                 const response = await getTask();
//                 const fetchedTasks = response.responseObject || [];
//                 setTasks(fetchedTasks);
//             } catch (error) {
//                 console.error("Error fetching tasks:", error);
//             }
//         };
//         fetchTasks();
//     }, []);

//     const addTask = async (newTask) => {
//         try {
//             const response = await postTask(newTask);
//             const createdTask = response.responseObject;

//             // Update task list
//             setTasks((prevTasks) => [...prevTasks, createdTask]);
//         } catch (error) {
//             console.error("Error adding task:", error);
//         }
//     };

//     return (
//         <div className="p-4">
//             <div className="flex justify-between items-center mb-4">
//                 <h1 className="text-2xl font-bold">Project Planning</h1>
//                 <DialogAddTask addTask={addTask} />
//             </div>

//             <div className="grid grid-cols-12 gap-4">
//                 {/* Left Side: Calendar */}
//                 <div className="col-span-5 border rounded-lg p-4 bg-white">
//                     <h2 className="text-lg font-semibold mb-4">ปฏิทิน</h2>
//                     <Calendar
//                         value={selectedDate}
//                         onChange={(date) => setSelectedDate(date)}
//                         className="w-full"
//                     />
//                 </div>

//                 {/* Right Side: Task List */}
//                 <div className="col-span-7 border rounded-lg p-4 bg-white">
//                     <h2 className="text-lg font-semibold mb-4">รายการ Task</h2>
//                     <div className="space-y-4">
//                         {tasks.map((task) => (
//                             <div key={task.task_id} className="p-4 border rounded-md bg-gray-50">
//                                 <h3 className="font-medium text-md">{task.task_name}</h3>
//                                 <p className="text-sm text-gray-600">
//                                     วันที่เริ่ม: {task.start_date} - วันที่สิ้นสุด: {task.end_date}
//                                 </p>
//                                 <ProgressBar
//                                     startDate={task.start_date}
//                                     endDate={task.end_date}
//                                 />
//                             </div>
//                         ))}
//                         {tasks.length === 0 && (
//                             <p className="text-gray-500 text-center">ยังไม่มี Task ในระบบ</p>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

import React, { useState, useEffect } from "react";
import DialogAddTask from "./components/DialogAddTask";
import { getTask, postTask } from "@/services/task.service"; // ✅ Import API service
import { PayloadCreateTask } from "@/types/requests/request.task";

export default function PlanningPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState<PayloadCreateTask[]>([]);

    // Fetch tasks from backend
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await getTask();
                const fetchedTasks = response.responseObject || [];
                setTasks(fetchedTasks);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };
        fetchTasks();
    }, []);

    const addTask = async (newTask: PayloadCreateTask) => {
        try {
            const response = await postTask(newTask);
            const createdTask = response.responseObject;

            //  Update task list & Gantt Chart
            setTasks((prevTasks) => [...prevTasks, createdTask]);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Project Planning</h1>
                <DialogAddTask addTask={addTask} />
            </div>

            
            <div className="mt-8 border rounded-lg p-4 bg-white">
                <h2 className="text-lg font-semibold mb-4">Gantt Chart</h2>
                <DialogAddTask tasks={tasks} onTasksChange={setTasks} />
            </div>
        </div>
    );
}





