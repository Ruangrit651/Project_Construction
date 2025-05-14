import { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Badge, Button, Dialog, Heading } from "@radix-ui/themes"; // เพิ่ม Dialog และ Heading
import { getUser } from "@/services/user.service";
import { TypeUserAll } from "@/types/response/response.user";
import DialogAdd from "./components/dialogAddUser";
import DialogEdit from "./components/dialogEditUser";
import AlertDialogDelete from "./components/alertDialogDeletUser";
import ToggleUserStatus from "./components/dialogDisableUser";
import UserDetailPage from "./components/userDetail";

export default function AdminPage() {
    const [user, setUser] = useState<TypeUserAll[]>([]);
    const [selectedUserID, setSelectedUserID] = useState<string | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);

    const getUserData = () => {
        getUser().then((res) => {
            console.log(res);
            setUser(res.responseObject);
        });
    };

    // เปิด dialog แสดงรายละเอียดผู้ใช้
    const openUserDetail = (userId: string) => {
        setSelectedUserID(userId);
        setShowUserDetail(true);
    };

    useEffect(() => {
        getUserData();
    }, []);

    return (
        <Card variant="surface">
            <Flex className="w-full" direction="row" gap="2">
                <Text as="div" size="4" weight="bold">
                    Member
                </Text>
                <DialogAdd getUserData={getUserData} />
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
                                                role={user.role} 
                                                project={user.projects?.project_id || ""}
                                            />
                                            <ToggleUserStatus
                                                getUserData={getUserData}
                                                userId={user.user_id}
                                                isActive={user.is_active}
                                                username={user.username}
                                            />
                                            <AlertDialogDelete
                                                getUserDate={getUserData}
                                                user_id={user.user_id}
                                                username={user.username}
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