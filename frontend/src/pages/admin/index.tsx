import { useEffect, useState } from "react";
import { Card, Table, Text, Flex } from "@radix-ui/themes";
import { getUser } from "@/services/user.service";
import { TypeUserAll } from "@/types/response/response.user";
import DialogAdd from "./components/dialogAddUser";
import DialogEdit from "./components/dialogEditUser";
import AlertDialogDelete from "./components/alertDialogDeletUser";

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
                            {/* <Table.ColumnHeaderCell>Id</Table.ColumnHeaderCell> */}
                            <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Project</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {user &&
                            user.map((user: TypeUserAll) => (
                                <Table.Row key={user.user_id}>
                                    {/* <Table.RowHeaderCell>{user.user_id}</Table.RowHeaderCell> */}
                                    <Table.Cell>{user.username}</Table.Cell>
                                    <Table.Cell>{user.role}</Table.Cell>
                                    <Table.Cell>{user.projects?.project_name} </Table.Cell>
                                    <Table.Cell>
                                        <Flex gap="2">
                                            <DialogEdit
                                                getUserData={getUserData}
                                                user_id={user.user_id}
                                                username={user.username}
                                                role={user.role} 
                                                project={user.projects?.project_id || ""} // Ensure a valid project ID is passed
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
