import { Button } from "@radix-ui/themes";
import { toggleUserStatus } from "@/services/user.service";
import { useState } from "react";

type ToggleUserStatusProps = {
    getUserData: () => void;
    userId: string;
    isActive: boolean;
    username: string;
};

const ToggleUserStatus = ({ getUserData, userId, isActive, username }: ToggleUserStatusProps) => {
    const [loading, setLoading] = useState(false);

    const handleToggleStatus = async () => {
        if (loading) return;
        
        const actionText = isActive ? "suspend" : "activate";
        const confirmed = window.confirm(
            `Are you sure you want to ${actionText} user "${username}"?`
        );
        
        if (!confirmed) return;
        
        setLoading(true);
        try {
            const response = await toggleUserStatus(userId, !isActive);
            
            if (response.success) {
                alert(`User ${actionText}d successfully!`);
                getUserData(); // Refresh user list
            } else {
                alert(`Failed to ${actionText} user: ${response.message}`);
            }
        } catch (error) {
            console.error(`Error ${actionText}ing user:`, error);
            alert(`An error occurred while trying to ${actionText} user. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            className="cursor-pointer" 
            size="1" 
            color={isActive ? "red" : "green"} 
            variant="soft"
            disabled={loading}
            onClick={handleToggleStatus}
        >
            {loading ? "Processing..." : isActive ? "Suspend" : "Activate"}
        </Button>
    );
};

export default ToggleUserStatus;