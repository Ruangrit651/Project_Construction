import { useEffect, useState, Fragment } from "react";
import { Card, Table, Text, Flex, Spinner } from "@radix-ui/themes";
import { getTask } from "@/services/task.service";
import { TypeTask } from "@/types/response/response.task";
import DialogAddTask from "./components/DialogAddTask";
import DialogEditTask from "./components/DialogEditTask";
import AlertDialogDeleteTask from "./components/alertDialogDeleteTask";

export default function TaskPage() {
    const [tasks, setTasks] = useState<TypeTask[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await getTask();
            if (response.success) {
                setTasks(response.responseObject);
            } else {
                console.error("Failed to fetch tasks");
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <Card variant="surface">
            <Flex justify="between" mb="4">
                <Text size="4" weight="bold">Task Management</Text>
                <DialogAddTask getTaskData={fetchTasks} />
            </Flex>
            {isLoading ? (
                <Flex justify="center" align="center" style={{ height: "200px" }}>
                    <Spinner size="3" />
                </Flex>
            ) : (
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Task Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tasks.map((task) => (
                            <Table.Row key={task.task_id}>
                                <Table.Cell>{task.task_name}</Table.Cell>
                                <Table.Cell>{task.budget || "-"}</Table.Cell>
                                <Table.Cell>{task.start_date || "-"}</Table.Cell>
                                <Table.Cell>{task.end_date || "-"}</Table.Cell>
                                <Table.Cell>{task.status ? "Active" : "Inactive"}</Table.Cell>
                                <Table.Cell>
                                    <Flex gap="2">
                                        <DialogEditTask task={task} getTaskData={fetchTasks} />
                                        <AlertDialogDeleteTask 
                                            getTaskData={fetchTasks}
                                            task_id={task.task_id}
                                            task_name={task.task_name}
                                        />
                                    </Flex>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </Card>
    );
}
