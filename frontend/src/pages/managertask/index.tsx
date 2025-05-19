import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getTask, getTaskProject } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import DateTable from "./test";
import DialogAddTask from "./components/DialogAddTask";

const ManagerTaskPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("project_id");
    const projectName = searchParams.get("project_name");

    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Year selector state
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Fetch tasks based on whether we have a project ID or not
    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            let response;

            if (projectId) {
                response = await getTaskProject(projectId);
            } else {
                response = await getTask();
            }

            if (response.success) {
                // ใช้ข้อมูลตามลำดับที่ได้รับจาก API โดยไม่มีการเรียงลำดับใหม่
                const formattedTasks = response.responseObject.map((task: any) => ({
                    taskId: task.task_id,
                    taskName: task.task_name,
                    description: task.description,
                    budget: task.budget,
                    startDate: task.start_date,
                    endDate: task.end_date,
                    status: task.status,
                    progress: task.progress || 0,
                    created_at: task.created_at
                }));

                console.log("Tasks received from API (original order):", formattedTasks);
                setTasks(formattedTasks);

                // Extract years from tasks for the year selector
                const years = new Set<number>();
                formattedTasks.forEach(task => {
                    if (task.startDate) years.add(new Date(task.startDate).getFullYear());
                    if (task.endDate) years.add(new Date(task.endDate).getFullYear());
                });

                const sortedYears = Array.from(years).sort();
                setAvailableYears(sortedYears);

                // Set default year to current year if available, otherwise first year
                if (sortedYears.length > 0) {
                    const currentYear = new Date().getFullYear();
                    if (sortedYears.includes(currentYear)) {
                        setSelectedYear(currentYear);
                    } else {
                        setSelectedYear(sortedYears[0]);
                    }
                }
            } else {
                setError(response.message || "Failed to fetch tasks");
                setTasks([]);
            }
        } catch (error) {
            setError("An error occurred while fetching tasks");
            console.error("Error fetching tasks:", error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch subtasks for the specific task
    const fetchSubtasks = async () => {
        if (tasks.length === 0) return;

        try {
            const updatedTasks = [...tasks];

            for (const task of updatedTasks) {
                const response = await getSubtask(task.taskId);

                if (response.success) {
                    // กรองแต่ไม่เรียงลำดับใหม่ คงลำดับตามที่ API ส่งมา
                    const filteredSubtasks = response.responseObject
                        .filter(subtask => subtask.task_id === task.taskId)
                        .map((subtask: any) => ({
                            subtaskId: subtask.subtask_id,
                            subtaskName: subtask.subtask_name,
                            description: subtask.description,
                            budget: subtask.budget,
                            startDate: subtask.start_date,
                            endDate: subtask.end_date,
                            status: subtask.status,
                            progress: subtask.progress || 0,
                            // เก็บวันที่สร้างเพื่อใช้อ้างอิงถ้าจำเป็น
                            created_at: subtask.created_at
                        }));

                    // กำหนด subtasks โดยไม่มีการเรียงลำดับใหม่
                    task.subtasks = filteredSubtasks;

                    console.log(`Fetched ${filteredSubtasks.length} subtasks for task: ${task.taskName}`);
                }
            }

            setTasks(updatedTasks);
        } catch (error) {
            console.error("Error fetching subtasks:", error);
        }
    };

    const updateTaskStatus = async (taskId: string) => {
        try {
            const response = await getSubtask(taskId);
            if (response.success && response.responseObject) {
                // กรองเฉพาะ subtasks ของ task นี้
                const subtasks = response.responseObject.filter(
                    (subtask: any) => subtask.task_id === taskId
                );

                if (subtasks.length === 0) return;

                // คำนวณสถานะใหม่
                let newStatus = "pending";
                const totalSubtasks = subtasks.length;
                const completedSubtasks = subtasks.filter((s: any) => s.status === "completed").length;
                const inProgressSubtasks = subtasks.filter((s: any) => s.status === "in progress").length;

                if (completedSubtasks === totalSubtasks) {
                    newStatus = "completed";
                } else if (completedSubtasks > 0 || inProgressSubtasks > 0) {
                    newStatus = "in progress";
                }

                // อัพเดตสถานะของ task ใน API
                await patchTask({
                    task_id: taskId,
                    status: newStatus
                });

                // อัพเดตสถานะใน local state
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.taskId === taskId ? { ...task, status: newStatus } : task
                    )
                );
            }
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    // เพิ่มฟังก์ชันสำหรับการเพิ่ม subtask ลงใน state โดยตรง
    const addSubtaskToState = (taskId: string, newSubtask: any) => {
        setTasks(prevTasks =>
            prevTasks.map(task => {
                if (task.taskId === taskId) {
                    return {
                        ...task,
                        subtasks: [...(task.subtasks || []), {
                            subtaskId: newSubtask.subtask_id,
                            subtaskName: newSubtask.subtask_name,
                            description: newSubtask.description,
                            budget: newSubtask.budget,
                            startDate: newSubtask.start_date,
                            endDate: newSubtask.end_date,
                            status: newSubtask.status,
                            progress: newSubtask.progress || 0
                        }]
                    };
                }
                return task;
            })
        );
    };

    // Load tasks when the component mounts or project_id changes
    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    // Load subtasks after tasks are loaded
    useEffect(() => {
        if (tasks.length > 0) {
            fetchSubtasks();
        }
    }, [tasks.length]);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className=" text-black px-6 py-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {projectName ? `${projectName} - Timeline` : 'All Tasks'}
                        </h1>
                        <p className="text-black-100 mt-1">
                            Manage project tasks and subtasks
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Year selector */}
                        {availableYears.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Year:</span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className=" text-b border border-blue-500 rounded px-3 py-1 text-sm"
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Add Task button */}
                        {projectId && (
                            <DialogAddTask
                                getTaskData={fetchTasks}
                                projectId={projectId}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading tasks...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center h-64 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-red-600">{error}</p>
                        <button
                            onClick={fetchTasks}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-700">No tasks found for this project</p>
                        {projectId && (
                            <p className="mt-2 text-gray-500">Create a new task to get started with your project timeline</p>
                        )}
                        {/* {projectId && (
                            <DialogAddTask 
                                getTaskData={fetchTasks} 
                                buttonClassName="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                buttonText="Create First Task"
                            />
                        )} */}
                    </div>
                ) : (
                    <div className="overflow-x-auto timeline-container">
                        <div className="min-w-[1200px]">
                            <DateTable
                                year={selectedYear}
                                tasks={tasks}
                                fetchTasks={fetchTasks}
                                fetchSubtasks={fetchSubtasks}
                                projectId={projectId}
                                updateTaskStatus={updateTaskStatus}
                                addSubtaskToState={addSubtaskToState}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerTaskPage;