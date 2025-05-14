import React, { useState, useEffect } from "react";
import { Card, Text, Flex } from "@radix-ui/themes";
import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";
import { calculateProjectProgress } from "../Function/CalProgress";

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
        notStarted: 0,
        cancelled: 0,
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
            case "not started":
                counts.notStarted++;
                break;
            case "cancelled":
                counts.cancelled++;
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
        <Card style={{ minWidth: "150px", textAlign: "center" }}>
            <Text size="1" weight="medium" color="gray">{label}</Text>
            <Text size="5" weight="bold" color={color}>{value}</Text>
        </Card>
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
    taskProgress,
    subtaskProgress,
    projectProgress: externalProjectProgress,
    baseProjectProgress
}) => {
    const [internalProjectProgress, setInternalProjectProgress] = useState<number>(0);
    const [statusCounts, setStatusCounts] = useState({
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        cancelled: 0,
        total: 0
    });

    useEffect(() => {
        // เพิ่ม logging สำหรับ debug
        console.log("ProjectProgress useEffect triggered with:", {
            taskCount: tasks.length,
            subtasksCount: Object.keys(subtasks).length,
            taskProgressEntries: Object.keys(taskProgress).length,
            subtaskProgressEntries: Object.keys(subtaskProgress).length,
            externalProgressProvided: externalProjectProgress !== undefined,
            baseProgressProvided: baseProjectProgress !== undefined
        });

        // ตรวจสอบว่าข้อมูลมีความพร้อมที่จะคำนวณหรือไม่
        const hasData = tasks.length > 0 && Object.keys(taskProgress).length > 0;

        if (baseProjectProgress !== undefined) {
            console.log("Using base project progress always:", baseProjectProgress);
            setInternalProjectProgress(baseProjectProgress);
        }
        else if (externalProjectProgress !== undefined) {
            console.log("Using external project progress:", externalProjectProgress);
            setInternalProjectProgress(externalProjectProgress);
        }
        else if (hasData) {
            // คำนวณทันทีถ้ามีข้อมูลพร้อม
            const progress = calculateProjectProgress(tasks, taskProgress, subtasks, subtaskProgress);
            console.log("Calculated internal progress value (immediate):", progress);
            setInternalProjectProgress(progress);
        }

        setStatusCounts(calculateStatusCounts(tasks));
    }, [tasks, subtasks, baseProjectProgress, externalProjectProgress, taskProgress, subtaskProgress]);

    // ไม่แสดงอะไรเลยถ้าไม่มีข้อมูล
    if (tasks.length === 0) {
        return null;
    }

    return (
        <Card variant="surface" className="mb-4">
            <Text as="div" size="5" weight="bold" className="mb-4">
                Project Overview
            </Text>

            <Flex direction="column" gap="4">
                <ProjectProgressBar percent={internalProjectProgress} />

                <Flex gap="2" wrap="wrap">
                    <StatCard label="Total Tasks" value={statusCounts.total} />
                    <StatCard label="Completed" value={statusCounts.completed} color="green" />
                    <StatCard label="In Progress" value={statusCounts.inProgress} color="blue" />
                    <StatCard label="Not Started" value={statusCounts.notStarted} color="gray" />
                    <StatCard label="Cancelled" value={statusCounts.cancelled} color="red" />
                </Flex>
            </Flex>
        </Card>
    );
};

export default ProjectProgress;