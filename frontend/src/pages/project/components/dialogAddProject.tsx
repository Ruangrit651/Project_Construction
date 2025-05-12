import { Text, Dialog, Button, Flex, TextField, Select } from "@radix-ui/themes";
import { postProject } from "@/services/project.service";
import { useState,useEffect } from "react";
import { getUser } from "@/services/user.service";

type DialogProjectProps = {
    getProjectData: Function;
};

type User = {
    user_id: string;
    username: string;
};

const DialogAdd = ({ getProjectData }: DialogProjectProps) => {
    const [projectName, setProjectName] = useState("");
    const [actual, setActual] = useState(0);
    const [formmattedActual, setFormattedActual] = useState("0");
    const [budget, setBudget] = useState(0);
    const [formattedBudget, setFormattedBudget] = useState("0"); // For displaying formatted budget
    const [status, setStatus] = useState("In progress"); // Default status
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [users, setUsers] = useState<User[]>([]); // State to hold user data
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // ดึงข้อมูลผู้ใช้เมื่อคอมโพเนนต์โหลด
    useEffect(() => {
        // เรียกใช้ API เพื่อดึงรายการผู้ใช้
        getUser().then(response => {
            if (response.success) {
                setUsers(response.responseObject);
            }
        }).catch(error => {
            console.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้", error);
        });
    }, []);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    const handleActualChange = (event: any) => {
        const value = event.target.value.replace(/,/g, "");
        const numericValue = value === "" ? 0 : Number(value);
        setActual(numericValue);
        setFormattedActual(formatNumber(numericValue));
    }

    const handleBudgetChange = (event: any) => {
        const value = event.target.value.replace(/,/g, ""); // Remove commas for parsing
        const numericValue = value === "" ? 0 : Number(value);
        setBudget(numericValue);
        setFormattedBudget(formatNumber(numericValue));
    };

    const handleCreateProject = async () => {
        if (!projectName || !budget || !startDate || !endDate || !selectedUserId) {
            alert("Please enter all required fields (project name, budget, start date, and end date).");
            return;
        }

        postProject({ project_name: projectName, actual, budget, status, start_date: startDate, end_date: endDate, user_id: selectedUserId })
            .then((response) => {
                if (response.statusCode === 200) {
                    // Clear form fields
                    setProjectName("");
                    setActual(0);
                    setBudget(0);
                    setFormattedBudget("0");
                    setStatus("In progress");
                    setStartDate("");
                    setEndDate("");
                    // Refresh project data
                    getProjectData();
                } else if (response.statusCode === 400) {
                    alert(response.message);
                } else {
                    alert("Unexpected error: " + response.message);
                }
            })
            .catch((error) => {
                console.error("Error creating project", error.response?.data || error.message);
                alert("Failed to create project. Please try again.");
            });
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger>
                <Button className="cursor-pointer" variant="soft" size="1">Create</Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="450px">
                <Dialog.Title>Create Project</Dialog.Title>
                <Flex direction="column" gap="3">
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            Project Name
                        </Text>
                        <TextField.Root
                            defaultValue=""
                            placeholder="Enter project name"
                            onChange={(event) => setProjectName(event.target.value)}
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            เจ้าของโปรเจกต์
                        </Text>
                        <Select.Root
                            defaultValue=""
                            onValueChange={(userId: string) => setSelectedUserId(userId)}
                        >
                            <Select.Trigger className="select-trigger" placeholder="เลือกเจ้าของโปรเจกต์">
                                {selectedUserId ? 
                                    users.find(user => user.user_id === selectedUserId)?.username : 
                                    "เลือกเจ้าของโปรเจกต์"}
                            </Select.Trigger>
                            <Select.Content>
                                {users.map(user => (
                                    <Select.Item key={user.user_id} value={user.user_id}>
                                        {user.username}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </label>
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            Budget
                        </Text>
                        <TextField.Root
                            defaultValue=""
                            placeholder="Enter budget"
                            type="text"
                            value={formattedBudget}
                            onChange={handleBudgetChange}
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            Actual
                        </Text>
                        <TextField.Root
                            defaultValue=""
                            placeholder="Enter actual"
                            type="text"
                            value={formmattedActual}
                            onChange={handleActualChange}
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            Status
                        </Text>
                        <Select.Root
                            defaultValue="In progress"
                            onValueChange={(status: string) => setStatus(status)}
                        >
                            <Select.Trigger className="select-trigger">
                                {status} {/* Display the selected status */}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="In progress">In progress</Select.Item>
                                <Select.Item value="Completed">Completed</Select.Item>
                                <Select.Item value="Suspend operations">Suspend operations</Select.Item>
                                <Select.Item value="Project Cancellation">Project Cancellation</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </label>
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            Start Date
                        </Text>
                        <TextField.Root
                            defaultValue=""
                            placeholder="Enter start date (YYYY-MM-DD)"
                            type="date"
                            onChange={(event) => setStartDate(event.target.value)}
                        />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            End Date
                        </Text>
                        <TextField.Root
                            defaultValue=""
                            placeholder="Enter end date (YYYY-MM-DD)"
                            type="date"
                            onChange={(event) => setEndDate(event.target.value)}
                        />
                    </label>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Dialog.Close asChild>
                        <Button className="cursor-pointer" onClick={handleCreateProject}>Save</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogAdd;

