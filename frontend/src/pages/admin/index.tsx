import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyUser } from "@/services/verify.service";
import { Card, Table, Text, Flex, Badge, Button, Dialog, Heading } from "@radix-ui/themes";
import { getUser } from "@/services/user.service";
import { TypeUserAll } from "@/types/response/response.user";
import DialogAdd from "./components/dialogAddUser";
import DialogEdit from "./components/dialogEditUser";
import AlertDialogDelete from "./components/alertDialogDeletUser";
import ToggleUserStatus from "./components/dialogDisableUser";
import UserDetailPage from "./components/userDetail";
import * as Toast from '@radix-ui/react-toast';

export default function AdminPage() {
    const [user, setUser] = useState<TypeUserAll[]>([]);
    const [selectedUserID, setSelectedUserID] = useState<string | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const navigate = useNavigate();

    // State for Toast
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    // State for unique roles
    const uniqueRoles = Array.from(new Set(user.map(u => u.role)));

    // Function to filter users by role
    const filteredUsers = roleFilter === "all"
        ? user
        : user.filter(u => u.role === roleFilter);

    // Function to show Toast
    const showToast = (message: string, type: 'success' | 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };

    const getUserData = () => {
        getUser().then((res) => {
            console.log(res);
            setUser(res.responseObject);
        });
    };

    // Open user detail dialog
    const openUserDetail = (userId: string) => {
        setSelectedUserID(userId);
        setShowUserDetail(true);
    };

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await verifyUser();
                if (!response.success) {
                    navigate("/"); // กลับไปหน้า Login หากไม่มี Token
                }
            } catch (error) {
                console.error("Authentication failed:", error);
                navigate("/"); // กลับไปหน้า Login หากเกิดข้อผิดพลาด
            }
        };

        checkAuthentication();
        getUserData();
    }, [navigate]);

    return (
        <Card variant="surface">
            {/* Toast notification */}
            <Toast.Provider swipeDirection="right">
                <Toast.Root
                    className={`${toastType === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
                        } border-l-4 p-4 mb-4 fixed bottom-4 right-4 w-72 shadow-md rounded-md z-50`}
                    open={toastOpen}
                    onOpenChange={setToastOpen}
                    duration={3000}
                >
                    <div className="flex">
                        <Toast.Title className={`font-medium ${toastType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {toastMessage}
                        </Toast.Title>
                        <Toast.Close className="ml-auto">
                            <span className="text-gray-500 hover:text-gray-700">×</span>
                        </Toast.Close>
                    </div>
                    <Toast.Description className="mt-1 text-sm">
                        {toastType === 'success' ? 'Operation completed successfully.' : 'Please try again.'}
                    </Toast.Description>
                </Toast.Root>
                <Toast.Viewport />
            </Toast.Provider>

            <Flex className="w-full" direction="row" gap="2">
                <Text as="div" size="4" weight="bold">
                    Member
                </Text>
                <DialogAdd getUserData={getUserData} showToast={showToast} />

                {/* Add role filter dropdown */}
                <Flex className="ml-auto" align="center" gap="2">
                    <Text size="2">Filter by role:</Text>
                    <select
                        className="px-2 py-1 border rounded text-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        {uniqueRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </Flex>
            </Flex>
            <div className="w-full mt-2">
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell className="text-center">Status</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell className="text-center">Actions</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {user &&
                            user.map((user: TypeUserAll) => (
                                <Table.Row key={user.user_id}>
                                    <Table.Cell>{user.username}</Table.Cell>
                                    <Table.Cell>{user.role}</Table.Cell>
                                    {/* <Table.Cell>{user.projects?.project_name}</Table.Cell> */}
                                    <Table.Cell justify="center">
                                        <Badge color={user.is_active ? "green" : "red"}>
                                            {user.is_active ? "Active" : "Suspended"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex gap="2" justify="center">
                                            <Button
                                                className="cursor-pointer"
                                                size="1"
                                                variant="soft"
                                                color="blue"
                                                onClick={() => openUserDetail(user.user_id)}
                                            >
                                                Detail
                                            </Button>
                                            <DialogEdit
                                                getUserData={getUserData}
                                                user_id={user.user_id}
                                                username={user.username}
                                                fullname={user.fullname}
                                                role={user.role}
                                                project={user.projects?.project_id || ""}
                                                showToast={showToast}
                                            />
                                            <ToggleUserStatus
                                                getUserData={getUserData}
                                                userId={user.user_id}
                                                isActive={user.is_active}
                                                username={user.username}
                                                showToast={showToast}
                                            />
                                            <AlertDialogDelete
                                                getUserDate={getUserData}
                                                user_id={user.user_id}
                                                username={user.username}
                                                showToast={showToast}
                                            />
                                        </Flex>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table.Root>
            </div>

            {/* Dialog for UserDetail */}
            <Dialog.Root open={showUserDetail} onOpenChange={setShowUserDetail}>
                <Dialog.Content size="3" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
                    <Dialog.Title>User Details</Dialog.Title>

                    {selectedUserID && (
                        <div className="mt-3">
                            <UserDetailPage userId={selectedUserID} />
                        </div>
                    )}

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft">Close</Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Card>
    );
}