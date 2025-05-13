import React from "react";
import { Card, Text, Flex, Tooltip } from "@radix-ui/themes";
import { TypeTaskAll } from "@/types/response/response.task";
import { TypeSubTaskAll } from "@/types/response/response.subtask";

// สร้าง component ProgressBar สำหรับโปรเจค
const ProjectProgressBar = ({ percent, width = "100%" }: { percent: number, width?: string }) => {
    // กำหนดสีตามเปอร์เซ็นต์
    const getColor = () => {
        if (percent < 25) return "#ef4444"; // แดง
        if (percent < 50) return "#f97316"; // ส้ม 
        if (percent < 75) return "#facc15"; // เหลือง
        return "#22c55e"; // เขียว
    };

    return (
        <div style={{ width }}>
            <Flex justify="between" align="center" mb="1">
                <Text size="2" weight="medium">Overall Progress</Text>
                <Text size="2" weight="medium">{percent.toFixed(2)}%</Text>
            </Flex>
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
                        width: `${percent}%`,
                        backgroundColor: getColor(),
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
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({ tasks, subtasks, taskProgress }) => {
    // คำนวณความคืบหน้าโดยรวมของโปรเจค
    const calculateProjectProgress = (): number => {
        if (tasks.length === 0) return 0;
        
        let totalProgress = 0;
        let totalWeight = 0;
        
        tasks.forEach(task => {
            const weight = task.budget || 1; // ใช้งบประมาณเป็นน้ำหนัก หรือ 1 ถ้าไม่มีงบประมาณ
            const progress = taskProgress[task.task_id] || 0;
            
            totalProgress += progress * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? totalProgress / totalWeight : 0;
    };
    
    // คำนวณจำนวนงานตามสถานะ
    const calculateStatusCounts = () => {
        const counts = {
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            cancelled: 0,
            total: tasks.length
        };
        
        tasks.forEach(task => {
            switch(task.status) {
                case 'completed':
                    counts.completed++;
                    break;
                case 'in progress':
                    counts.inProgress++;
                    break;
                case 'cancelled':
                    counts.cancelled++;
                    break;
                default:
                    counts.notStarted++;
                    break;
            }
        });
        
        return counts;
    };
    
    const projectProgress = calculateProjectProgress();
    const statusCounts = calculateStatusCounts();
    
    return (
        <Card variant="surface" className="mb-4">
            <Text as="div" size="5" weight="bold" className="mb-4">
                Project Overview
            </Text>
            
            <Flex direction="column" gap="4">
                <ProjectProgressBar percent={projectProgress} />
                
                <Flex gap="2" wrap="wrap">
                    <StatCard label="Total Tasks" value={statusCounts.total} />
                    <StatCard label="Completed" value={statusCounts.completed} color="green" />
                    <StatCard label="In Progress" value={statusCounts.inProgress} color="blue" />
                    <StatCard label="Not Started" value={statusCounts.notStarted} color="orange" />
                    <StatCard label="Cancelled" value={statusCounts.cancelled} color="red" />
                </Flex>
            </Flex>
        </Card>
    );
};

export default ProjectProgress;