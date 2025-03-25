import { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { patchTask, getTask } from "@/services/task.service";
import AlertDialogDeleteTask from "./AlertDialogDeleteTask";

interface DialogEditTaskProps {
    getTaskData: () => void;
    taskId: string;
    trigger: React.ReactNode;
}

const DialogEditTask: React.FC<DialogEditTaskProps> = ({ getTaskData, taskId, trigger }) => {
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            if (taskId) {
                setLoading(true);
                try {
                    const response = await getTask(taskId);
                    const taskData = response.responseObject;
                    
                    setTaskName(taskData.task_name);
                    setDescription(taskData.description);
                    setBudget(taskData.budget);
                    setStartDate(taskData.start_date);
                    setEndDate(taskData.end_date);
                    setStatus(taskData.status);
                } catch (error) {
                    console.error("Failed to fetch task details:", error);
                    alert("An error occurred while fetching task details.");
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchTaskDetails();
    }, [taskId]);

    const handleEditTask = async () => {
      if (!taskName || !description || !budget || !startDate || !endDate) {
          alert("Please fill out all required fields.");
          return;
      }
  
      try {
          // Update this line to match the correct function signature
          const response = await patchTask({
              id: taskId,
              task_name: taskName,
              description,
              budget,
              start_date: startDate,
              end_date: endDate,
              status: status,
          });
  
          if (response.success) {
              getTaskData();
          } else {
              alert(`Error: ${response.message}`);
          }
      } catch (error) {
          console.error("Failed to update task:", error);
          alert("An error occurred while updating the task.");
      }
  };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Edit Task</Dialog.Title>
                {loading ? (
                    <Text>Loading task details...</Text>
                ) : (
                    <Flex direction="column">
                        <label>
                            <Text as="div" size="2" mb="3" weight="bold">Task Name</Text>
                            <TextField.Root 
                                value={taskName} 
                                type="text"
                                onChange={(e) => setTaskName(e.target.value)} 
                                placeholder="Enter Task Name" 
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
                            <TextField.Root 
                                value={description} 
                                type="text"
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Enter Task Description" 
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
                            <TextField.Root 
                                value={budget} 
                                type="text"
                                onChange={(e) => setBudget(Number(e.target.value))} 
                                placeholder="Enter Budget" 
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Start Date</Text>
                            <TextField.Root 
                                value={startDate} 
                                type="date"
                                onChange={(e) => setStartDate(e.target.value)} 
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">End Date</Text>
                            <TextField.Root 
                                value={endDate} 
                                type="date"
                                onChange={(e) => setEndDate(e.target.value)} 
                            />
                        </label>
                        <label>
                            <Text as="div" size="2" mb="3" mt="3" weight="bold">Status</Text>
                            <Select.Root value={status} onValueChange={setStatus}>
                                <Select.Trigger>{status}</Select.Trigger>
                                <Select.Content>
                                    <Select.Item value="pending">Pending</Select.Item>
                                    <Select.Item value="completed">Completed</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </label>
                    </Flex>
                )}
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
                    </Dialog.Close>
                    <Flex gap="3"  mt="3">
                      <Dialog.Close >
                          <AlertDialogDeleteTask 
                              getTaskData={getTaskData} 
                              task_id={taskId} 
                              task_name={taskName} 
                          />
                      </Dialog.Close>
                    </Flex>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleEditTask}>Update</Button>
                    </Dialog.Close>
                </Flex>
                
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditTask;