import { Button, Flex, Strong ,Dialog,Text } from "@radix-ui/themes";
import { deleteProject } from "@/services/project.service";

type DialogProjectProps = {
    getProjectDate: Function;
    project_id: string;
    project_name: string;
    showToast?: (message: string, type: 'success' | 'error') => void; // เพิ่ม prop สำหรับ showToast
}

const AlertDialogDelete = ({ getProjectDate, project_id, project_name, showToast }: DialogProjectProps) => {
    const handleDeleteProject = async () => {
        try {
            await deleteProject({
                project_id: project_id
            })
                .then((response) => {
                    if (response.statusCode === 200) {
                        getProjectDate();
                        // แสดง Toast แทน alert
                        if (showToast) {
                            showToast(`Project "${project_name}" deleted successfully`, 'success');
                        }
                    } else if (response.statusCode === 400) {
                        // แสดง Toast แทน alert
                        if (showToast) {
                            showToast(response.message, 'error');
                        } else {
                            alert(response.message); // fallback ไปใช้ alert ถ้าไม่มี showToast
                        }
                    } else {
                        // แสดง Toast แทน alert
                        if (showToast) {
                            showToast(`Unexpected error: ${response.message}`, 'error');
                        } else {
                            alert("Unexpected error:" + response.message);
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error update user", error.response?.date || error.message);
                    // แสดง Toast แทน alert
                    if (showToast) {
                        showToast("Failed to delete project. Please try again.", 'error');
                    } else {
                        alert("Failed to delete project. Please try again.");
                    }
                });
        } catch (error) {
            console.error("Error delete user:", error);
            if (showToast) {
                showToast("An unexpected error occurred", 'error');
            }
        }
    };

    return (
        <Dialog.Root>
        <Dialog.Trigger>
            <Button className="cursor-pointer" size="1" color="red" variant="soft">Delete</Button>
        </Dialog.Trigger>

        <Dialog.Content maxWidth="450px">
            <Dialog.Title>Delete Project</Dialog.Title>
            <Flex direction="column" gap="3">
                <label>
                    <Text size="2"><Strong>Id : </Strong>{project_id}</Text>
                </label>
                <label>
                    <Text size="2"><Strong>Before Project Name : </Strong>{project_name}</Text>
                </label>
            </Flex>
            <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                    <Button variant="soft" color="gray" className="cursor-pointer">
                    Cancel
                    </Button>
                </Dialog.Close>
                <Dialog.Close>
                    <Button className="cursor-pointer" onClick={handleDeleteProject} color="red" variant="soft">Delete</Button>
                </Dialog.Close>.
            </Flex>
        </Dialog.Content>
    </Dialog.Root>
    )
}

export default AlertDialogDelete