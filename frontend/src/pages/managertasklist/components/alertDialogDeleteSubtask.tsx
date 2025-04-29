import { Dialog, Button, Flex, Strong, Text } from "@radix-ui/themes";
import { deleteSubtask } from "@/services/subtask.service";

interface AlertDialogDeleteSubtaskProps {
    getSubtaskData: () => void;
    subtask_id: string;
    subtask_name: string;
}

const AlertDialogDeleteSubtask: React.FC<AlertDialogDeleteSubtaskProps> = ({ getSubtaskData, subtask_id, subtask_name }) => {
    const handleDelete = async () => {
        console.log("Deleting subtask:", subtask_id);
        try {
            const response = await deleteSubtask({ subtask_id });
            if (response.statusCode === 200) {
                getSubtaskData();
            } else {
                alert(response.message || "Unexpected error occurred");
            }
        } catch (error) {
            console.error("Error deleting subtask:", error);
            alert("Failed to delete subtask. Please try again.");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger>
                <Button size="1" color="red" variant="soft" className="cursor-pointer">Delete</Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="450px" className="overflow-visible">
                <Dialog.Title>Delete Subtask</Dialog.Title>
                <Flex direction="column" gap="3">
                    <Text size="2"><Strong>Subtask Name: </Strong>{subtask_name}</Text>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" onClick={handleDelete} color="red">Confirm</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default AlertDialogDeleteSubtask;