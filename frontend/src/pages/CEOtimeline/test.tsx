import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getTask, getTaskProject } from "@/services/task.service";
import { getSubtask } from "@/services/subtask.service";

// นำเข้าคอมโพเนนต์ที่จำเป็นเหมือนกับ Managertask
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

const CEOTimeline = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get("project_id");
  const projectName = searchParams.get("project_name");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [taskList, setTaskList] = useState<Task[]>([]);

  // ฟังก์ชั่นสำหรับดึงข้อมูล Task
  const fetchTasks = async () => {
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
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // ฟังก์ชั่นสำหรับดึงข้อมูล Subtask
  const fetchSubtasks = async () => {
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
              created_at: subtask.created_at
            }));

          // กำหนด subtasks โดยไม่มีการเรียงลำดับใหม่
          task.subtasks = filteredSubtasks;
        }
      }

      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  };

  // โหลด tasks เมื่อคอมโพเนนต์ถูกโหลดหรือ project_id เปลี่ยน
  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // โหลด subtasks หลังจาก tasks ถูกโหลด
  useEffect(() => {
    if (tasks.length > 0) {
      fetchSubtasks();
    }
  }, [tasks.length]);

  // อัพเดทตัวแปร taskList จาก tasks ที่ได้
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setTaskList(tasks);
    }
  }, [tasks]);

  // เพิ่ม CSS สำหรับ animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; background-color: rgba(239, 68, 68, 0.4); }
      }
      .highlight-flash {
        animation: flash 0.7s ease-in-out 3;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

    // Calculate today's position
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const todayPosition = dayOfYear * 40; // 40px per day

    // Calculate scroll position to center today
    const scrollPosition = todayPosition - (timelineContent.clientWidth / 2) + 20;

    // Smooth scroll to position
    timelineContent.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });

    // Add visual feedback
    const todayCells = document.querySelectorAll('.day-cell-today');
    todayCells.forEach(cell => {
      cell.classList.add('highlight-flash');
      setTimeout(() => {
        cell.classList.remove('highlight-flash');
      }, 2100);
    });
  };

  // ฟังก์ชั่น check if date is today
  const isToday = (year: number, monthIndex: number, dayOfMonth: number) => {
    const today = new Date();
    return today.getDate() === dayOfMonth &&
      today.getMonth() === monthIndex &&
      today.getFullYear() === year;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'in progress':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-700';
      case 'in progress':
        return 'text-blue-700';
      case 'delayed':
        return 'text-red-700';
      case 'pending':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
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


  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{projectName ? `${projectName} - Timeline` : "Timeline"}</h1>
            <p className="text-gray-300">View task schedule and progress for the selected project</p>
          </div>
        </div>
      </div>

      <TimelineContainer>
        <TimelineHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">{year} Project Timeline</h2>

            {/* Today Button - เพิ่มปุ่ม Today */}
            <button
              onClick={(e) => {
                e.preventDefault();
                scrollToToday();
              }}
              className="px-3 py-1.5 bg-blue-600 text-white border border-blue-700 rounded shadow-sm hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5 font-medium"
            >
              <span>Today</span>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            </button>
          </div>
        </TimelineHeader>

        <TimelineGrid>
          {/* Sidebar - Task Names */}
          <TimelineSidebar>
            <div className="p-4 border-b border-gray-200 bg-gray-50 h-10">
              <h3 className="text-sm font-medium text-gray-700">Tasks</h3>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
              {taskList.map(task => (
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
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{task.taskName}</span>
                        {task.status && (
                          <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${getStatusTextColor(task.status)} bg-opacity-20 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subtask Rows */}
                  {expandedTasks.includes(task.taskId) && task.subtasks && task.subtasks.map(subtask => (
                    <div
                      key={subtask.subtaskId}
                      className="pl-6 pr-4 py-4 border-b border-gray-200 bg-gray-50"
                      style={{ height: "40px" }}
                    >
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700">• {subtask.subtaskName}</span>
                        {subtask.status && (
                          <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${getStatusTextColor(subtask.status)} bg-opacity-20 ${getStatusColor(subtask.status)}`}>
                            {subtask.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
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
                {taskList.map(task => (
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
                ))}
              </div>
            </TimelineContentInner>
          </TimelineContent>
        </TimelineGrid>
      </TimelineContainer>
    </div>
  );
};

export default CEOTimeline;