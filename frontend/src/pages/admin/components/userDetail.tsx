import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Heading, Text, Table, Button, Flex, Badge } from "@radix-ui/themes";
import { getUser } from "@/services/user.service";
import { getUserProjects } from "@/services/relation.service";
import { TypeUserAll } from "@/types/response/response.user";
import { TypeRelation } from "@/types/response/response.relation";
import { Link } from "react-router-dom";
import { formatDate } from "../../Function/FormatDate";

type UserDetailProps = {
    // ถ้ามี userId ส่งเข้ามาจะใช้ userId นั้น
    // ถ้าไม่มีจะใช้ id จาก URL params
    userId?: string;
};

export default function UserDetailPage({ userId }: UserDetailProps) {
    // ใช้ userId จาก props หรือ URL params
    const params = useParams();
    const id = userId || params.id;
    
    const [user, setUser] = useState<TypeUserAll | null>(null);
    const [projects, setProjects] = useState<TypeRelation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchUserData = async () => {
                try {
                    // Fetch user details
                    const userResponse = await getUser();
                    if (userResponse.success) {
                        const userData = userResponse.responseObject.find(
                            (u: TypeUserAll) => u.user_id === id
                        );
                        if (userData) {
                            setUser(userData);
                        }
                    }

                    // Fetch user's projects
                    try {
                        const projectsResponse = await getUserProjects(id);
                        if (projectsResponse.success) {
                            setProjects(projectsResponse.responseObject);
                        }
                    } catch (err) {
                        console.error("Error loading projects:", err);
                        setProjects([]);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchUserData();
        }
    }, [id]);

    if (loading) {
        return <Text>Loading user details...</Text>;
    }

    if (!user) {
        return <Text>User not found</Text>;
    }

    return (
        <div>
            <Card variant="surface">
                <Heading size="6" mb="2">{user.username}</Heading>
                <Flex direction="column" gap="2">
                    <Text>Role: {user.role}</Text>
                    <Flex align="center" gap="2">
                        <Text>Status:</Text> 
                        <Badge color={user.is_active ? "green" : "red"}>
                            {user.is_active ? "Active" : "Suspended"}
                        </Badge>
                    </Flex>
                    <Text>Created: {formatDate(user.created_at)}</Text>
                    {user.updated_at && <Text>Last Updated: {formatDate(user.updated_at)}</Text>}
                </Flex>
            </Card>

            <Card variant="surface" className="mt-4">
                <Heading size="4" mb="2">User's Projects</Heading>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Joined On</Table.ColumnHeaderCell>
                            {/* แสดงคอลัมน์ Actions เฉพาะเมื่อไม่ได้อยู่ใน Dialog */}
                            {!userId && <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {projects.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={userId ? 3 : 4}>
                                    <Text align="center">No projects found</Text>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            projects.map((relation) => (
                                <Table.Row key={relation.relation_id}>
                                    <Table.Cell>{relation.project?.project_name || 'Unnamed Project'}</Table.Cell>
                                    <Table.Cell>{relation.project?.status || 'Unknown'}</Table.Cell>
                                    <Table.Cell>
                                        {relation.created_at ? formatDate(relation.created_at) : 'N/A'}
                                    </Table.Cell>
                                    {/* แสดงปุ่ม View Project เฉพาะเมื่อไม่ได้อยู่ใน Dialog */}
                                    {!userId && (
                                        <Table.Cell>
                                            <Link to={`/project/${relation.project?.project_id}`}>
                                                <Button size="1" variant="soft">
                                                    View Project
                                                </Button>
                                            </Link>
                                        </Table.Cell>
                                    )}
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table.Root>
            </Card>
        </div>
    );
}