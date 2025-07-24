import React, { useState, useEffect } from "react";
import { Card, Text, Flex } from "@radix-ui/themes";
import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { getDetailedProjectProgress } from "@/services/progress.service";

// Utility function to get color based on percentage
const getProgressColor = (percent: number) => {
    if (percent < 25) return "#ef4444"; // แดง
    if (percent < 50) return "#f97316"; // ส้ม 
    if (percent < 75) return "#facc15"; // เหลือง
    return "#22c55e"; // เขียว
};

// Calculate status counts for tasks
const calculateStatusCounts = (tasks: TypeTaskAll[]) => {
    const counts = {
        completed: 0,
        inProgress: 0,
        pending: 0,
        suspended: 0,
        total: tasks.length
    };

    tasks.forEach(task => {
        switch (task.status) {
            case "completed":
                counts.completed++;
                break;
            case "in progress":
                counts.inProgress++;
                break;
            case "pending":
                counts.pending++;
                break;
            case "suspended":
                counts.suspended++;
                break;
        }
    });

    return counts;
};

// สร้าง component ProgressBar สำหรับโปรเจค
const ProjectProgressBar = ({ percent, width = "100%" }: { percent: number, width?: string }) => {
    console.log("Rendering progress bar with percent:", percent);

    return (
        <div style={{ width }}>
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{percent.toFixed(2)}%</span>
            </div>
            
            <div
                style={{
                    width: "100%",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "6px",
                    height: "12px",
                }}
            >
                <div
                    style={{
                        width: `${Math.max(0.5, percent)}%`, // กำหนดค่าขั้นต่ำเพื่อให้แถบยังคงมองเห็นได้แม้ค่าจะน้อยมาก
                        backgroundColor: getProgressColor(percent),
                        height: "100%",
                        borderRadius: "6px",
                        transition: "width 0.3s ease-in-out",
                    }}
                />
            </div>
        </div>
    );
};

// สร้าง component แสดงข้อมูลสถิติ
const StatCard = ({ label, value, color }: { label: string, value: string | number, color?: string }) => {
    return (
        <div className="bg-white rounded-md shadow-sm p-4 flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{label}</span>
            <span 
                className={`text-lg font-semibold ${color ? color : 'text-gray-700'}`}
            >
                {value}
            </span>
        </div>
    );
};

interface ProjectProgressProps {
    tasks: TypeTaskAll[];
    subtasks: Record<string, TypeSubTaskAll[]>;
    taskProgress: Record<string, number>;
    subtaskProgress: Record<string, number>;
    projectProgress?: number;
    baseProjectProgress?: number;
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({
    tasks,
    subtasks,
    taskProgress: initialTaskProgress,
    subtaskProgress: initialSubtaskProgress,
    projectProgress: externalProjectProgress,
    baseProjectProgress
}) => {
    const [internalProjectProgress, setInternalProjectProgress] = useState<number>(0);
    const [statusCounts, setStatusCounts] = useState({
        completed: 0,
        inProgress: 0,
        pending: 0,
        suspended: 0,
        total: 0
    });
    const [taskProgress, setTaskProgress] = useState<Record<string, number>>(initialTaskProgress || {});
    const [subtaskProgress, setSubtaskProgress] = useState<Record<string, number>>(initialSubtaskProgress || {});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // อัพเดทสถานะตามค่า props ที่เปลี่ยนไป
    useEffect(() => {
        setTaskProgress(initialTaskProgress || {});
    }, [initialTaskProgress]);
    
    useEffect(() => {
        setSubtaskProgress(initialSubtaskProgress || {});
    }, [initialSubtaskProgress]);
    
    // อัพเดทสถานะทุกครั้งที่ tasks มีการเปลี่ยนแปลง (ทั้งเพิ่ม ลบ หรือแก้ไขสถานะ)
    useEffect(() => {
        if (tasks.length > 0) {
            const newStatusCounts = calculateStatusCounts(tasks);
            setStatusCounts(newStatusCounts);
            
            // Debug log เพื่อตรวจสอบการอัพเดท
            console.log("Status counts updated:", newStatusCounts);
        }
    }, [tasks]);

    useEffect(() => {
        // ตรวจสอบว่ามี projectId หรือไม่
        if (!tasks.length || !tasks[0].project_id) return;
        
        const projectId = tasks[0].project_id;
        
        const fetchProgressFromBackend = async () => {
            setIsLoading(true);
            try {
                const response = await getDetailedProjectProgress(projectId);
                
                if (response.success) {
                    const { projectProgress, taskProgress: newTaskProgress, subtaskProgress: newSubtaskProgress } = response.responseObject;
                    
                    setInternalProjectProgress(projectProgress);
                    setTaskProgress(newTaskProgress);
                    setSubtaskProgress(newSubtaskProgress);
                }
            } catch (error) {
                console.error("Error fetching project progress:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        // ใช้ข้อมูลจาก props ถ้ามี หรือดึงข้อมูลใหม่จาก backend
        if (baseProjectProgress !== undefined) {
            setInternalProjectProgress(baseProjectProgress);
        } else if (externalProjectProgress !== undefined) {
            setInternalProjectProgress(externalProjectProgress);
        } else {
            fetchProgressFromBackend();
        }
        
        // อัพเดทสถานะ task ทุกครั้งที่ tasks เปลี่ยน
        setStatusCounts(calculateStatusCounts(tasks));
    }, [tasks, subtasks, baseProjectProgress, externalProjectProgress]);

    // ไม่แสดงอะไรเลยถ้าไม่มีข้อมูล
    if (tasks.length === 0) {
        return null;
    }

    // ใช้ค่าที่ได้รับจาก state หรือ props ในการแสดงผล
    const projectProgressToDisplay = internalProjectProgress;

    return (
        <Card variant="surface">
            <Flex className="w-full" direction="column" gap="3">
                <Text as="div" size="4" weight="bold">Project Progress</Text>
                
                <div className="w-full">
                    <ProjectProgressBar percent={projectProgressToDisplay} />
                </div>

                {/* แสดง status counts ด้วย grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <StatCard 
                        label="Completed" 
                        value={statusCounts.completed} 
                        color="text-green-600" 
                    />
                    <StatCard 
                        label="In Progress" 
                        value={statusCounts.inProgress} 
                        color="text-yellow-600" 
                    />
                    <StatCard 
                        label="Pending" 
                        value={statusCounts.pending} 
                        color="text-gray-600" 
                    />
                    <StatCard 
                        label="Suspended" 
                        value={statusCounts.suspended} 
                        color="text-red-600" 
                    />
                </div>
            </Flex>
        </Card>
    );
};

export default ProjectProgress;