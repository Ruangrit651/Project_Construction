// import { useState, useEffect } from "react";
// import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
// import { patchSubtask, getSubtask } from "@/services/subtask.service";
// import { patchTask } from "@/services/task.service";
// import { getTask } from "@/services/task.service";

// interface DialogEditSubtaskProps {
//     getSubtaskData: () => void;
//     subtaskId: string;
//     trigger: React.ReactNode;
//     fetchSubTasks?: () => void; // Add fetchTasks as an optional prop
    
// }

// const DialogEditSubtask: React.FC<DialogEditSubtaskProps> = ({ getSubtaskData, subtaskId, trigger }) => {
//     const [subtaskName, setSubtaskName] = useState("");
//     const [description, setDescription] = useState("");
//     const [budget, setBudget] = useState(0);
//     const [formattedBudget, setFormattedBudget] = useState("0"); // For displaying formatted budget
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [status, setStatus] = useState("pending");
//     const [loading, setLoading] = useState(false);

//     const formatNumber = (value: number) => {
//         return new Intl.NumberFormat("en-US").format(value);
//     };

//     const handleBudgetChange = (event: any) => {
//         const value = event.target.value.replace(/,/g, ""); // Remove commas for parsing
//         const numericValue = value === "" ? 0 : Number(value);
//         setBudget(numericValue);
//         setFormattedBudget(formatNumber(numericValue)); // Update the formatted budget
//     };

//     const updateSubtaskStatus = async (subtaskId: string, status: string) => {
//         try {
//             await patchSubtask({ subtask_id: subtaskId, status });
//             const response = await getTask(); // ดึงข้อมูล Task ทั้งหมด
//             const tasks = response.responseObject;
//             const task = tasks.find((t: any) => t.subtasks?.some((s: any) => s.subtask_id === subtaskId));
//             if (task) {
//                 const allCompleted = task.subtasks?.every((s: any) => s.status === "Completed");
//                 if (allCompleted) {
//                     await patchTask({ task_id: task.task_id, status: "Completed" });
//                 }
//             }
//             getSubtaskData(); // รีเฟรชข้อมูล Subtask
//         } catch (error) {
//             console.error("Failed to update subtask status:", error);
//         }
//     };

//     useEffect(() => {
//         console.log("subtaskId:", subtaskId); // Debugging: Check the subtaskId
//         const fetchSubtaskDetails = async () => {
//             if (subtaskId) {
//                 setLoading(true);
//                 try {
//                     const response = await getSubtask(subtaskId); // Fetch subtask by ID
//                     console.log("API Response:", response); // Debugging: Check the API response
//                     if (response.responseObject && response.responseObject.length > 0) {
//                         // Use the correct property name for subtask ID
//                         const subtaskData = response.responseObject.find(
//                             (subtask: any) => subtask.subtask_id === subtaskId
//                         );
    
//                         if (subtaskData) {
//                             setSubtaskName(subtaskData.subtask_name);
//                             setDescription(subtaskData.description);
//                             setBudget(Number(subtaskData.budget)); // Convert budget to a number
//                             setFormattedBudget(formatNumber(Number(subtaskData.budget))); // Set formatted budget
//                             setStartDate(subtaskData.start_date);
//                             setEndDate(subtaskData.end_date);
//                             setStatus(subtaskData.status);
//                         } else {
//                             console.error("Subtask not found.");
//                             alert("Subtask not found.");
//                         }
//                     } else {
//                         console.error("No subtask data found.");
//                         alert("No subtask data found.");
//                     }
//                 } catch (error) {
//                     console.error("Failed to fetch subtask details:", error);
//                     alert("An error occurred while fetching subtask details.");
//                 } finally {
//                     setLoading(false);
//                 }
//             }
//         };
    
//         fetchSubtaskDetails();
//     }, [subtaskId]);

//     const handleEditSubtask = async () => {
//         if (!subtaskName || !description || !budget || !startDate || !endDate) {
//             alert("Please fill out all required fields.");
//             return;
//         }
    
//         try {
//             const response = await patchSubtask({
//                 subtask_id: subtaskId,
//                 subtask_name: subtaskName,
//                 description,
//                 budget: Number(budget),
//                 start_date: startDate,
//                 end_date: endDate,
//                 status,
//             });
    
//             if (response.success) {
//                 // เรียก updateSubtaskStatus เพื่อเช็คสถานะ Task
//                 await updateSubtaskStatus(subtaskId, status);
//                 getSubtaskData();
//             } else {
//                 alert(`Error: ${response.message}`);
//             }
//         } catch (error) {
//             console.error("Failed to update subtask:", error);
//             alert("An error occurred while updating the subtask.");
//         }
//     };

//     return (
//         <Dialog.Root>
//             <Dialog.Trigger asChild>
//                 {trigger}
//             </Dialog.Trigger>
//             <Dialog.Content className="overflow-visible">
//                 <Dialog.Title>Edit Subtask</Dialog.Title>
//                 {loading ? (
//                     <Text>Loading subtask details...</Text>
//                 ) : (
//                     <Flex direction="column">
//                         <label>
//                             <Text as="div" size="2" mb="3" weight="bold">Subtask Name</Text>
//                             <TextField.Root
//                                 value={subtaskName}
//                                 type="text"
//                                 onChange={(e) => setSubtaskName(e.target.value)}
//                                 placeholder="Enter Name"
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Description</Text>
//                             <TextField.Root
//                                 value={description}
//                                 type="text"
//                                 onChange={(e) => setDescription(e.target.value)}
//                                 placeholder="Enter Subtask Description"
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Budget</Text>
//                             <TextField.Root
//                                 value={formattedBudget} // Display formatted budget
//                                 type="text"
//                                 onChange={handleBudgetChange}
//                                 placeholder="Enter Budget"
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Start Date</Text>
//                             <TextField.Root
//                                 value={startDate}
//                                 type="date"
//                                 onChange={(e) => setStartDate(e.target.value)}
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">End Date</Text>
//                             <TextField.Root
//                                 value={endDate}
//                                 type="date"
//                                 onChange={(e) => setEndDate(e.target.value)}
//                             />
//                         </label>
//                         <label>
//                             <Text as="div" size="2" mb="3" mt="3" weight="bold">Status</Text>
//                             <Select.Root value={status} onValueChange={setStatus}>
//                                 <Select.Trigger>{status}</Select.Trigger>
//                                 <Select.Content>
//                                     <Select.Item value="pending">Pending</Select.Item>
//                                     <Select.Item value="completed">Completed</Select.Item>
//                                 </Select.Content>
//                             </Select.Root>
//                         </label>
//                     </Flex>
//                 )}
//                 <Flex gap="3" mt="4" justify="end">
//                     <Dialog.Close>
//                         <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3">Cancel</Button>
//                     </Dialog.Close>
//                     <Dialog.Close>
//                         <Button className="cursor-pointer" variant="soft" mb="3" mt="3" onClick={handleEditSubtask}>Update</Button>
//                     </Dialog.Close>
//                 </Flex>
//             </Dialog.Content>
//         </Dialog.Root>
//     );
// };

// export default DialogEditSubtask;

import React, { useState, useEffect } from "react";
import { Dialog, Button, Flex, TextField, Text, Select, Slider } from "@radix-ui/themes";
import { getSubtask, patchSubtask } from "@/services/subtask.service";
import { getSubtaskProgress, createProgress } from "@/services/progress.service";

interface DialogEditSubtaskProps {
    getSubtaskData: () => void;
    subtaskId: string;
    trigger: React.ReactNode;
    fetchSubTasks?: () => void;    
}

const DialogEditSubtask: React.FC<DialogEditSubtaskProps> = ({ getSubtaskData, subtaskId, trigger }) => {
    const [subtaskName, setSubtaskName] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [progressPercent, setProgressPercent] = useState(0);
    const [currentProgress, setCurrentProgress] = useState(0);

    const formatNumber = (value: number) => {
        return value.toLocaleString('en-US');
    };

    const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value.replace(/[^0-9]/g, '');
        const numericValue = rawValue === '' ? 0 : parseInt(rawValue);
        setBudget(numericValue);
        setFormattedBudget(formatNumber(numericValue));
    };

    // แก้ไขฟังก์ชันนี้เพื่อดึงข้อมูล subtask ที่ถูกต้อง
    const fetchSubtaskData = async () => {
        try {
            setIsLoading(true);
            console.log("Fetching subtask data for ID:", subtaskId);
            
            // ใช้ getSubtask แทน getSubtaskById
            const response = await getSubtask(subtaskId);
            console.log("Fetched subtask data:", response);
            
            if (response.success && response.responseObject && response.responseObject.length > 0) {
                // ค้นหา subtask ที่ตรงกับ subtaskId ที่ต้องการ
                const subtask = response.responseObject.find(
                    (s: any) => s.subtask_id === subtaskId
                );
                
                if (subtask) {
                    console.log("Setting form data from:", subtask);
                    
                    setSubtaskName(subtask.subtask_name || "");
                    setDescription(subtask.description || "");
                    setBudget(subtask.budget || 0);
                    setFormattedBudget(formatNumber(subtask.budget || 0));
                    
                    // จัดการวันที่
                    if (subtask.start_date) {
                        const startDateOnly = subtask.start_date.split('T')[0];
                        setStartDate(startDateOnly);
                    }
                    
                    if (subtask.end_date) {
                        const endDateOnly = subtask.end_date.split('T')[0];
                        setEndDate(endDateOnly);
                    }
                    
                    setStatus(subtask.status || "pending");
                    
                    // ดึงข้อมูลความคืบหน้า
                    try {
                        const progressResponse = await getSubtaskProgress(subtaskId);
                        if (progressResponse.success && progressResponse.responseObject.length > 0) {
                            const latestProgress = progressResponse.responseObject[0].percent;
                            setProgressPercent(latestProgress);
                            setCurrentProgress(latestProgress);
                        }
                    } catch (progressError) {
                        console.error("Failed to fetch progress:", progressError);
                    }
                } else {
                    console.error("Subtask not found in response");
                    setErrorMessage("Subtask not found");
                }
            } else {
                console.error("Failed to get subtask data:", response.message);
                setErrorMessage("Failed to load subtask details");
            }
        } catch (error) {
            console.error("Error fetching subtask data:", error);
            setErrorMessage("Failed to load subtask details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // เรียกใช้ fetchSubtaskData เมื่อ dialog เปิด
    useEffect(() => {
        if (open && subtaskId) {
            fetchSubtaskData();
        }
    }, [open, subtaskId]);

    const handleEditSubtask = async () => {
        try {
            if (!subtaskName || !description || budget <= 0 || !startDate || !endDate) {
                setErrorMessage("Please fill out all required fields properly.");
                return;
            }
            
            console.log("Updating subtask:", {
                subtask_id: subtaskId,
                subtask_name: subtaskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status
            });
            
            const response = await patchSubtask({
                subtask_id: subtaskId,
                subtask_name: subtaskName,
                description,
                budget,
                start_date: startDate,
                end_date: endDate,
                status
            });

            if (response.success) {
                // บันทึกความคืบหน้าใหม่ถ้ามีการเปลี่ยนแปลง
                if (progressPercent !== currentProgress) {
                    try {
                        await createProgress({
                            subtask_id: subtaskId,
                            percent: progressPercent,
                            description: `Updated progress to ${progressPercent}%`,
                        });
                        console.log("Updated progress to:", progressPercent);
                    } catch (progressError) {
                        console.error("Failed to update progress:", progressError);
                    }
                }
                
                console.log("Subtask updated successfully");
                getSubtaskData();
                setOpen(false);
            } else {
                console.error("Failed to update subtask:", response.message);
                setErrorMessage(response.message || "Failed to update subtask");
            }
        } catch (error) {
            console.error("Error updating subtask:", error);
            setErrorMessage("An error occurred while updating the subtask.");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "500px" }}>
                <Dialog.Title>Edit Subtask</Dialog.Title>
                {isLoading ? (
                    <Text>Loading subtask details...</Text>
                ) : (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <Flex direction="column" gap="3">
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Subtask Name
                                </Text>
                                <TextField.Root
                                    placeholder="Enter subtask name"
                                    value={subtaskName}
                                    onChange={(e) => setSubtaskName(e.target.value)}
                                />
                            </label>
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Description
                                </Text>
                                <TextField.Root
                                    placeholder="Enter description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </label>
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Budget
                                </Text>
                                <TextField.Root
                                    placeholder="Enter budget"
                                    value={formattedBudget}
                                    onChange={handleBudgetChange}
                                />
                            </label>
                            <Flex gap="3">
                                <label style={{ flexGrow: 1 }}>
                                    <Text as="div" size="2" mb="1" weight="bold">
                                        Start Date
                                    </Text>
                                    <TextField.Root
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </label>
                                <label style={{ flexGrow: 1 }}>
                                    <Text as="div" size="2" mb="1" weight="bold">
                                        End Date
                                    </Text>
                                    <TextField.Root
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </label>
                            </Flex>
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Status
                                </Text>
                                <Select.Root
                                    value={status}
                                    onValueChange={(value) => {
                                        setStatus(value);
                                        // อัปเดต progress ตาม status ที่เลือก
                                        if (value === "completed") {
                                            setProgressPercent(100);
                                        } else if (value === "in progress" && progressPercent === 0) {
                                            setProgressPercent(50);
                                        } else if (value === "pending") {
                                            setProgressPercent(0);
                                        }
                                    }}
                                >
                                    <Select.Trigger />
                                    <Select.Content>
                                        <Select.Item value="pending">Pending</Select.Item>
                                        <Select.Item value="in progress">In Progress</Select.Item>
                                        <Select.Item value="completed">Completed</Select.Item>
                                        <Select.Item value="canceled">Canceled</Select.Item>
                                    </Select.Content>
                                </Select.Root>
                            </label>

                            {/* เพิ่มส่วนสไลเดอร์สำหรับความคืบหน้า */}
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Progress: {progressPercent}%
                                </Text>
                                <Slider 
                                    value={[progressPercent]}
                                    onValueChange={(values) => {
                                        setProgressPercent(values[0]);
                                        // อัปเดต status ตาม progress
                                        if (values[0] === 100) {
                                            setStatus("completed");
                                        } else if (values[0] > 0) {
                                            setStatus("in progress");
                                        } else {
                                            setStatus("pending");
                                        }
                                    }}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                            </label>

                            {errorMessage && (
                                <Text color="red" size="2">
                                    {errorMessage}
                                </Text>
                            )}
                        </Flex>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray">
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button type="submit" onClick={handleEditSubtask}>
                                Update Subtask
                            </Button>
                        </Flex>
                    </form>
                )}
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditSubtask;