import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import { Button } from "@radix-ui/themes";
import { getTask } from "@/services/task.service"; // Replace with your API service

const PlanningPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getTask();
        setTasks(response.responseObject || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">Project Planning</h1>

      <div className="flex">
        {/* Left Calendar Section */}
        <div className="w-1/2 pr-4">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="border rounded-lg shadow-md"
          />
        </div>

        {/* Right Task Section */}
        <div className="w-1/2 pl-4 border-l">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="soft" color="blue">
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white p-6 rounded-lg shadow-lg">
                {/* Form for adding a new task */}
                <h3 className="text-lg font-medium mb-4">Add New Task</h3>
                {/* Your task form implementation here */}
              </DialogContent>
            </Dialog>
          </div>
          
          <ul>
            {tasks.map((task) => (
              <li key={task.task_id} className="mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{task.task_name}</span>
                  <span className="text-gray-500 text-sm">
                    {task.start_date} - {task.end_date}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${calculateProgress(task.start_date, task.end_date)}%`,
                    }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Utility function to calculate progress
const calculateProgress = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (now < start) return 0;
  if (now > end) return 100;

  return Math.round(((now - start) / (end - start)) * 100);
};

export default PlanningPage;
