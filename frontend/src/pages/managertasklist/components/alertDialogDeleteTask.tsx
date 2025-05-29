import { Dialog, Button, Flex, Strong, Text } from "@radix-ui/themes";
import { deleteTask } from "@/services/task.service";

interface AlertDialogDeleteTaskProps {
    getTaskData: () => void;
    task_id: string;
    task_name: string;
}

const AlertDialogDeleteTask: React.FC<AlertDialogDeleteTaskProps> = ({ getTaskData, task_id, task_name }) => {
    const handleDelete = async () => {
        try {
            const response = await deleteTask({ task_id });
            if (response.statusCode === 200) {
                getTaskData();
            } else {
                alert(response.message || "Unexpected error occurred");
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task. Please try again.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger>
                <Button className="cursor-pointer" size="1" color="red" variant="soft">Delete</Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="450px">
                <Dialog.Title>Delete Task</Dialog.Title>
                <Flex direction="column" gap="3">
                    <label>
                        <Text size="2"><Strong>Task ID: </Strong>{task_id}</Text>
                    </label>
                    <label>
                        <Text size="2"><Strong>Task Name: </Strong>{task_name}</Text>
                    </label>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" onClick={handleDelete} color="red" id="delete-task">
                            Delete
                        </Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default AlertDialogDeleteTask;