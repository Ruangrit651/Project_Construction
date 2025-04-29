import { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Badge } from "@radix-ui/themes";
import { getUser } from "@/services/user.service";
import { TypeUserAll } from "@/types/response/response.user";
import DialogAdd from "./components/dialogAddUser";
import DialogEdit from "./components/dialogEditUser";
import AlertDialogDelete from "./components/alertDialogDeletUser";
import ToggleUserStatus from "./components/dialogDisableUser"; // นำเข้า component ใหม่

export default function AdminPage() {
    const [user, setUser] = useState<TypeUserAll[]>([]);

    const getUserData = () => {
        getUser().then((res) => {
            console.log(res);
            setUser(res.responseObject);
        });
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
                            <Table.ColumnHeaderCell>Project</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell> {/* เพิ่มคอลัมน์สถานะ */}
                            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {user &&
                            user.map((user: TypeUserAll) => (
                                <Table.Row key={user.user_id}>
                                    <Table.Cell>{user.username}</Table.Cell>
                                    <Table.Cell>{user.role}</Table.Cell>
                                    <Table.Cell>{user.projects?.project_name}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color={user.is_active ? "green" : "red"}>
                                            {user.is_active ? "Active" : "Suspended"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex gap="2">
                                            <DialogEdit
                                                getUserData={getUserData}
                                                user_id={user.user_id}
                                                username={user.username}
                                                role={user.role} 
                                                project={user.projects?.project_id || ""}
                                            />
                                            {/* เพิ่มปุ่มเปิด/ปิดสถานะ */}
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
        </Card>
    );
}