import { Button, Dialog, Flex, Text, Strong } from "@radix-ui/themes";
import { toggleUserStatus } from "@/services/user.service";
import { useState } from "react";

type ToggleUserStatusProps = {
    getUserData: () => void;
    userId: string;
    isActive: boolean;
    username: string;
    showToast?: (message: string, type: 'success' | 'error') => void;
};

const ToggleUserStatus = ({ getUserData, userId, isActive, username, showToast }: ToggleUserStatusProps) => {
    const [loading, setLoading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    
    const actionText = isActive ? "suspend" : "activate";
    
    const handleToggleStatus = async () => {
        if (loading) return;
        
        setLoading(true);
        try {
            const response = await toggleUserStatus(userId, !isActive);
            
            if (response.success) {
                if (showToast) {
                    showToast(`User "${username}" ${actionText}d successfully!`, 'success');
                } else {
                    alert(`User ${actionText}d successfully!`);
                }
                getUserData(); // Refresh user list
            } else {
                if (showToast) {
                    showToast(`Failed to ${actionText} user: ${response.message}`, 'error');
                } else {
                    alert(`Failed to ${actionText} user: ${response.message}`);
                }
            }
        } catch (error) {
            console.error(`Error ${actionText}ing user:`, error);
            if (showToast) {
                showToast(`An error occurred while trying to ${actionText} user. Please try again.`, 'error');
            } else {
                alert(`An error occurred while trying to ${actionText} user. Please try again.`);
            }
        } finally {
            setLoading(false);
            setConfirmDialogOpen(false);
        }
    };

    return (
        <>
            <Button 
                className="cursor-pointer" 
                size="1" 
                color={isActive ? "red" : "green"} 
                variant="soft"
                disabled={loading}
                onClick={() => setConfirmDialogOpen(true)}
            >
                {loading ? "Processing..." : isActive ? "Suspend" : "Activate"}
            </Button>
            
            {/* ส่วน Dialog ยืนยันการ Suspend/Activate */}
            <Dialog.Root open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <Dialog.Content size="2" style={{ maxWidth: '450px' }}>
                    <Dialog.Title>{isActive ? "Suspend" : "Activate"} User</Dialog.Title>
                    
                    <Flex direction="column" gap="3" my="4">
                        <Text>
                            Are you sure you want to <Strong>{actionText}</Strong> user <Strong>"{username}"</Strong>?
                        </Text>
                        
                        {isActive ? (
                            <Text size="2" color="gray">
                                Suspended users will not be able to log in to the system until reactivated.
                            </Text>
                        ) : (
                            <Text size="2" color="gray">
                                This will allow the user to access the system again.
                            </Text>
                        )}
                    </Flex>
                    
                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button 
                            variant="solid" 
                            color={isActive ? "red" : "green"}
                            disabled={loading}
                            onClick={handleToggleStatus}
                        >
                            {loading ? "Processing..." : isActive ? "Suspend User" : "Activate User"}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
};

export default ToggleUserStatus;