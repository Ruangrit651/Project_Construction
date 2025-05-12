import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, Heading, Text, Tabs, Flex, Button } from "@radix-ui/themes";
import { getProject } from "@/services/project.service";
import { TypeProjectAll } from "@/types/response/response.project";
import ProjectMembers from "./projectMenber";

type ProjectDetailProps = {
    // ถ้ามี projectId ส่งเข้ามาจะใช้ projectId นั้น
    // ถ้าไม่มีจะใช้ id จาก URL params
    projectId?: string;
};

export default function ProjectDetailPage({ projectId }: ProjectDetailProps) {
    // ใช้ projectId จาก props หรือ URL params
    const params = useParams();
    const id = projectId || params.id;
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const queryId = searchParams.get('id') || id;

    const [project, setProject] = useState<TypeProjectAll | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (queryId) {
            const fetchProject = async () => {
                try {
                    const response = await getProject();
                    if (response.success) {
                        const projectData = response.responseObject.find(
                            (p: TypeProjectAll) => p.project_id === queryId
                        );
                        if (projectData) {
                            setProject(projectData);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching project:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchProject();
        }
    }, [queryId]);

    if (loading) {
        return <Text>Loading project details...</Text>;
    }

    if (!project) {
        return <Text>Project not found</Text>;
    }

    return (
        <div>
            <Card variant="surface">
                <Heading size="6" mb="2">{project.project_name}</Heading>
                <Flex direction="column" gap="2">
                    <Text>Budget: {new Intl.NumberFormat('en-US').format(project.budget)}</Text>
                    <Text>Status: {project.status}</Text>
                    <Text>Start Date: {project.start_date}</Text>
                    <Text>End Date: {project.end_date || 'Not specified'}</Text>
                </Flex>
            </Card>

            <Tabs.Root defaultValue="members">
                <Tabs.List className="mt-4">
                    <Tabs.Trigger value="members">Members</Tabs.Trigger>
                    <Tabs.Trigger value="tasks">Tasks</Tabs.Trigger>
                </Tabs.List>


                <Tabs.Content value="members">
                    <ProjectMembers
                        projectId={project.project_id}
                        projectName={project.project_name}
                    />
                </Tabs.Content>

                <Tabs.Content value="tasks">
                    <Card variant="surface" className="mt-4">
                        <Heading size="4" mb="2">Project Tasks</Heading>
                        <Text>Task management coming soon...</Text>
                    </Card>
                </Tabs.Content>
            </Tabs.Root>

            {/* ปุ่มย้อนกลับ - แสดงเฉพาะเมื่อเป็นหน้าเต็ม (ไม่ได้อยู่ใน Dialog) */}
            {!projectId && (
                <Flex mt="4">
                    <Button
                        variant="soft"
                        onClick={() => window.history.back()}
                    >
                        ← Back to Projects
                    </Button>
                </Flex>
            )}
        </div>
    );
}