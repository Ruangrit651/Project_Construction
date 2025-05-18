import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTask, getTaskProject } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";
import { getProject } from "@/services/project.service"; // เพิ่ม import นี้สำหรับดึงโปรเจกต์ของพนักงาน

// นำเข้าคอมโพเนนต์ที่จำเป็น
import {
  TimelineContainer,
  TimelineHeader,
  TimelineSidebar,
  TimelineGrid,
  TimelineContent,
  TimelineContentInner,
  TaskRow,
  SubtaskRow,
  DayCell,
  TaskBar,
  TaskTooltip,
  TaskProgress,
  StatusIndicator,
  MonthHeader
} from "./components/Tailwind";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Card, Button, Flex, Text, Select } from "@radix-ui/themes";

// Type สำหรับ Task และ Subtask
interface Task {
  taskId: string;
  taskName: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  created_at?: string;
  subtasks?: Subtask[];
}

interface Subtask {
  subtaskId: string;
  subtaskName: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  created_at?: string;
}

interface Project {
  project_id: string;
  project_name: string;
}

export default function EmployeeTimelinePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get("project_id");
  const projectName = searchParams.get("project_name");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId);

  // ดึงข้อมูลโปรเจกต์ของพนักงาน
  const fetchEmployeeProjects = async () => {
    try {
      // ดึง user_id จาก localStorage หรือจากที่เก็บ session ของคุณ
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        console.error("User ID not found");
        return;
      }
      
      const response = await getProject(userId);
      
      if (response.success && response.responseObject) {
        setProjects(response.responseObject);
        
        // ถ้ายังไม่ได้เลือกโปรเจกต์ ให้เลือกโปรเจกต์แรกอัตโนมัติ
        if (!selectedProject && response.responseObject.length > 0) {
          setSelectedProject(response.responseObject[0].project_id);
          if (!projectId) {
            navigate(`/employeetimeline?project_id=${response.responseObject[0].project_id}&project_name=${encodeURIComponent(response.responseObject[0].project_name)}`);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching employee projects:", error);
    }
  };

  // ฟังก์ชั่นสำหรับดึงข้อมูล Task
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      if (!selectedProject) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      const response = await getTaskProject(selectedProject);
      
      if (response.success) {
        // แปลงข้อมูลจาก API ให้เข้ากับรูปแบบที่ต้องการ
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

        setTasks(formattedTasks);
        
        // ดึงปีจากงานทั้งหมดเพื่อสร้าง selector
        const years = new Set<number>();
        formattedTasks.forEach(task => {
          if (task.startDate) years.add(new Date(task.startDate).getFullYear());
          if (task.endDate) years.add(new Date(task.endDate).getFullYear());
        });

        const sortedYears = Array.from(years).sort();
        setAvailableYears(sortedYears);

        // เลือกปีปัจจุบันถ้ามี หรือปีแรกในรายการ
        if (sortedYears.length > 0) {
          const currentYear = new Date().getFullYear();
          if (sortedYears.includes(currentYear)) {
            setYear(currentYear);
          } else {
            setYear(sortedYears[0]);
          }
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชั่นสำหรับดึงข้อมูล Subtask
  const fetchSubtasks = async () => {
    try {
      const updatedTasks = [...tasks];

      for (const task of updatedTasks) {
        const response = await getSubtask(task.taskId);

        if (response.success) {
          // กรองเฉพาะ subtask ที่อยู่ในงานนี้
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
              created_at: subtask.created_at
            }));

          task.subtasks = filteredSubtasks;
        }
      }

      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  };

  // เรียกดึงโปรเจกต์ของพนักงานเมื่อโหลดหน้าแรก
  useEffect(() => {
    fetchEmployeeProjects();
  }, []);

  // ดึงข้อมูลงานเมื่อเลือกโปรเจกต์
  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    }
  }, [selectedProject]);

  // ดึงข้อมูลงานย่อยหลังจากดึงข้อมูลงานหลัก
  useEffect(() => {
    if (tasks.length > 0) {
      fetchSubtasks();
    }
  }, [tasks.length]);

  // ฟังก์ชั่นสลับการแสดง subtasks
  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // ฟังก์ชั่น scroll to today
  const scrollToToday = () => {
    const today = new Date();
    const timelineContent = document.querySelector('.timeline-content');

    if (!timelineContent) {
      console.error("Timeline content element not found");
      return;
    }

    if (today.getFullYear() !== year) {
      console.log("Current year doesn't match - can't scroll to today");
      return;
    }

    // คำนวณตำแหน่งของวันนี้
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const todayPosition = dayOfYear * 40; // 40px per day

    // คำนวณตำแหน่งการเลื่อนเพื่อให้วันนี้อยู่กลาง
    const scrollPosition = todayPosition - (timelineContent.clientWidth / 2) + 20;

    // เลื่อนไปยังตำแหน่งด้วยการเคลื่อนไหวแบบ smooth
    timelineContent.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });

    // เพิ่ม visual feedback
    const todayCells = document.querySelectorAll('.day-cell-today');
    todayCells.forEach(cell => {
      cell.classList.add('highlight-flash');
      setTimeout(() => {
        cell.classList.remove('highlight-flash');
      }, 2100);
    });
  };

  // ฟังก์ชั่น check ว่าเป็นวันนี้หรือไม่
  const isToday = (year: number, monthIndex: number, dayOfMonth: number) => {
    const today = new Date();
    return today.getDate() === dayOfMonth &&
      today.getMonth() === monthIndex &&
      today.getFullYear() === year;
  };

  // ฟังก์ชั่น calculate start column and span for task bar
  const calculateStartColAndSpan = (startDate: string, endDate: string, year: number) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const fullYear = year;

    if (start.getFullYear() !== fullYear && end.getFullYear() !== fullYear) {
      return { startCol: 0, span: 0 };
    }

    const startCol = Math.max(
      1,
      Math.floor((start.getTime() - new Date(fullYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const endCol = Math.min(
      365,
      Math.floor((end.getTime() - new Date(fullYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const span = endCol - startCol + 1;
    return { startCol, span };
  };

  // ฟังก์ชั่น render task bar
  const renderTaskBar = (task: Task | Subtask, isSubtask: boolean = false) => {
    const { startCol, span } = calculateStartColAndSpan(task.startDate, task.endDate, year);
    const progress = task.progress || 0;
    
    return (
      <TaskBar
        status={task.status}
        className={`relative group ${isSubtask ? 'bg-blue-400' : 'bg-blue-600'}`}
        style={{
          left: `${(startCol - 1) * 40}px`,
          width: `${span * 40}px`,
        }}
      >
        <div className="px-2 py-1 text-white text-xs truncate flex items-center justify-between">
          <span>{isSubtask ? (task as Subtask).subtaskName : (task as Task).taskName}</span>
          {!isSubtask && (
            <button 
              onClick={() => toggleSubtasks((task as Task).taskId)}
              className="ml-1 text-white hover:text-yellow-200"
            >
              {expandedTasks.includes((task as Task).taskId) ? "▼" : "►"}
            </button>
          )}
        </div>

        <TaskProgress progress={progress} />
        <StatusIndicator status={task.status} />

        <TaskTooltip className="transition-opacity duration-300 ease-in-out">
          <div className="font-medium mb-1">{isSubtask ? (task as Subtask).subtaskName : (task as Task).taskName}</div>
          <div className="text-xs text-gray-300">
            <div>Start: {new Date(task.startDate).toLocaleDateString()}</div>
            <div>End: {new Date(task.endDate).toLocaleDateString()}</div>
            <div>Duration: {span} days</div>
            <div>Status: {task.status}</div>
            <div>Progress: {task.progress}%</div>
          </div>
        </TaskTooltip>
      </TaskBar>
    );
  };

  // ฟังก์ชันเปลี่ยนโปรเจกต์
  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.project_id === projectId);
    if (selectedProject) {
      setSelectedProject(projectId);
      navigate(`/employeetimeline?project_id=${projectId}&project_name=${encodeURIComponent(selectedProject.project_name)}`);
    }
  };

  return (
    <Card variant="surface">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{projectName ? `${projectName} - Timeline` : "Project Timeline"}</h1>
            <p className="text-gray-600 mt-1">View and manage your assigned tasks and subtasks</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            {projects.length > 0 && (
              <Select.Root 
                value={selectedProject || ''} 
                onValueChange={handleProjectChange}
              >
                <Select.Trigger placeholder="Select a project" />
                <Select.Content>
                  {projects.map(project => (
                    <Select.Item key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
            
            {/* Year Selector */}
            {availableYears.length > 0 && (
              <Select.Root 
                value={year.toString()} 
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <Select.Trigger placeholder="Select year" />
                <Select.Content>
                  {availableYears.map(y => (
                    <Select.Item key={y} value={y.toString()}>
                      {y}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Flex justify="center" align="center" style={{ height: "400px" }}>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <Text size="4" ml="4">Loading timeline...</Text>
        </Flex>
      ) : (
        <TimelineContainer>
          <TimelineHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{year} Project Timeline</h2>
              
              {/* Today Button */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  scrollToToday();
                }}
                size="2"
                color="blue"
              >
                <span>Today</span>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse ml-1"></div>
              </Button>
            </div>
          </TimelineHeader>

          <TimelineGrid>
            {/* Sidebar - Task Names */}
            <TimelineSidebar>
              <div className="p-4 border-b border-gray-200 bg-gray-50 h-10">
                <h3 className="text-sm font-medium text-gray-700">Tasks</h3>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {tasks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No tasks found for this project
                  </div>
                ) : (
                  tasks.map(task => (
                    <React.Fragment key={task.taskId}>
                      {/* Task Row */}
                      <div className="p-4 border-b border-gray-200 hover:bg-gray-50" style={{ height: "40px" }}>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleSubtasks(task.taskId)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedTasks.includes(task.taskId) ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </button>
                          <span className="text-sm font-medium text-gray-900">{task.taskName}</span>
                        </div>
                      </div>

                      {/* Subtask Rows */}
                      {expandedTasks.includes(task.taskId) && task.subtasks && task.subtasks.map(subtask => (
                        <div 
                          key={subtask.subtaskId} 
                          className="pl-6 pr-4 py-4 border-b border-gray-200 bg-gray-50" 
                          style={{ height: "40px" }}
                        >
                          <span className="text-sm text-gray-700">• {subtask.subtaskName}</span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </div>
            </TimelineSidebar>

            {/* Timeline Content */}
            <TimelineContent className="timeline-content">
              <TimelineContentInner>
                {/* Today line */}
                {(() => {
                  const today = new Date();
                  if (today.getFullYear() === year) {
                    const startOfYear = new Date(year, 0, 1);
                    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
                    const position = (dayOfYear * 40) + 20; // 40px ต่อวัน

                    return (
                      <div
                        className="absolute top-[40px] w-[2px] bg-red-500 z-[1000]"
                        style={{
                          left: `${position}px`,
                          height: '3000px',
                          pointerEvents: 'none'
                        }}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Month Headers */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-200" style={{ height: "40px" }}>
                  <div className="flex flex-col h-full">
                    <div className="flex h-[20px]">
                      {Array.from({ length: 12 }, (_, monthIndex) => {
                        const month = new Date(year, monthIndex).toLocaleString("default", { month: "short" });
                        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                        return (
                          <MonthHeader
                            key={monthIndex}
                            month={month}
                            width={`${daysInMonth * 40}px`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex h-[20px]">
                      {Array.from({ length: 12 }, (_, monthIndex) => {
                        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                        return (
                          <div
                            key={monthIndex}
                            className="flex"
                            style={{ width: `${daysInMonth * 40}px` }}
                          >
                            {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                              const dayOfMonth = dayIndex + 1;
                              const date = new Date(year, monthIndex, dayOfMonth);
                              const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
                              const isCurrentDay = isToday(year, monthIndex, dayOfMonth);

                              return (
                                <DayCell
                                  key={dayIndex}
                                  day={dayOfMonth}
                                  isWeekend={isWeekendDay}
                                  isToday={isCurrentDay}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Task Bars */}
                <div className="relative">
                  {tasks.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                      No tasks to display
                    </div>
                  ) : (
                    tasks.map(task => (
                      <React.Fragment key={task.taskId}>
                        {/* Main Task */}
                        <TaskRow 
                          id={`task-${task.taskId}`} 
                          style={{ width: 'max-content', minWidth: '100%' }}
                        >
                          {renderTaskBar(task)}
                        </TaskRow>

                        {/* Subtasks */}
                        {expandedTasks.includes(task.taskId) && task.subtasks && task.subtasks.map(subtask => (
                          <SubtaskRow
                            key={subtask.subtaskId} 
                            id={`subtask-${subtask.subtaskId}`}
                            style={{ width: 'max-content', minWidth: '100%' }}
                          >
                            {renderTaskBar(subtask, true)}
                          </SubtaskRow>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </TimelineContentInner>
            </TimelineContent>
          </TimelineGrid>
        </TimelineContainer>
      )}
    </Card>
  );
}