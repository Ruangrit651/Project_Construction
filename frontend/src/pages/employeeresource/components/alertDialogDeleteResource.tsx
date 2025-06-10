import { Dialog, Button, Flex, Strong, Text } from "@radix-ui/themes";
import { deleteResource } from "@/services/resource.service";
import { useState } from "react";

interface AlertDialogDeleteResourceProps {
    getResourceData: () => void;
    removeResourceFromState: (resourceId: string) => void;
    resource_id: string;
    task_name: string;
    resource_name: string;
}

const AlertDialogDeleteResource: React.FC<AlertDialogDeleteResourceProps> = ({
    getResourceData,
    removeResourceFromState,
    resource_id,
    task_name,
    resource_name
}) => {
    const [open, setOpen] = useState(false); // สถานะควบคุม Dialog

    const handleDelete = async () => {
        try {
            const response = await deleteResource({ resource_id });
            if (response.statusCode === 200) {
                removeResourceFromState(resource_id);
                setOpen(false); // ปิด Dialog หลังลบสำเร็จ
            } else {
                alert(response.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
            }
        } catch (error) {
            console.error("ลบข้อมูลไม่สำเร็จ:", error);
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>
                <Button color="red" variant="soft" className="cursor-pointer">Delete</Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="450px">
                <Dialog.Title>Delete Resource</Dialog.Title>
                <Flex direction="column" gap="3">
                    <Text size="2"><Strong>Task Name: </Strong>{task_name}</Text>
                    <Text size="2"><Strong>Resource Name: </Strong>{resource_name}</Text>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">Cancel</Button>
                    </Dialog.Close>
                    <Button
                        className="cursor-pointer"
                        variant="soft"
                        onClick={handleDelete}
                        color="red"
                        id="delete-resource-button-confirm-em"
                    >
                        Confirm
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default AlertDialogDeleteResource;
