import { Button, Flex, Strong, Dialog, Text } from "@radix-ui/themes";
import { deleteUser } from "@/services/user.service";

type DialogUserProps = {
    getUserDate: Function;
    user_id: string;
    username: string;
    showToast?: (message: string, type: 'success' | 'error') => void;
}

const AlertDialogDelete = ({ getUserDate, user_id, username, showToast }: DialogUserProps) => {
    const handleDeleteCategory = async () => {
        try {
            await deleteUser({
                user_id: user_id
            })
                .then((response) => {
                    if (response.statusCode === 200) {
                        getUserDate();
                        if (showToast) {
                            showToast(`User "${username}" deleted successfully`, 'success');
                        }
                    } else if (response.statusCode === 400) {
                        if (showToast) {
                            showToast(response.message, 'error');
                        } else {
                            alert(response.message);
                        }
                    } else {
                        if (showToast) {
                            showToast(`Unexpected error: ${response.message}`, 'error');
                        } else {
                            alert("Unexpected error:" + response.message);
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error deleting user", error.response?.date || error.message);
                    if (showToast) {
                        showToast("Failed to delete user. Please try again.", 'error');
                    } else {
                        alert("Failed to delete user. Please try again.");
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
                <Dialog.Title>Delete User</Dialog.Title>
                <Flex direction="column" gap="3">
                    <label>
                        <Text size="2"><Strong>Id: </Strong>{user_id}</Text>
                    </label>
                    <label>
                        <Text size="2"><Strong>Username: </Strong>{username}</Text>
                    </label>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray">
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" onClick={handleDeleteCategory} color="red">Delete</Button>
                    </Dialog.Close>.
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default AlertDialogDelete