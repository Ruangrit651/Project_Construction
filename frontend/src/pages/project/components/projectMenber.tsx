import { useState, useEffect } from "react";
import { Card, Heading, Table, Text } from "@radix-ui/themes";

interface ProjectMembersProps {
  projectId: string;
  projectName?: string;
}

export default function ProjectMembers({ projectId, projectName }: ProjectMembersProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load project members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        // Import directly to avoid dynamic require issues
        const { getProjectUsers } = await import("@/services/project.service");
        
        // Make sure projectId is valid
        if (!projectId) {
          console.error("Missing projectId in ProjectMembers component");
          setMembers([]);
          return;
        }
        
        try {
          const response = await getProjectUsers(projectId);
          console.log("Project members response:", response); // Debug log
          
          if (response && response.success) {
            setMembers(response.responseObject || []);
          } else {
            console.log("No members found or invalid response format");
            setMembers([]);
          }
        } catch (err) {
          console.error("Error fetching project members:", err);
          setMembers([]);
        }
      } catch (error) {
        console.error("Service import error:", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [projectId]);

  if (loading) {
    return <Text>Loading members...</Text>;
  }

  return (
    <Card variant="surface" className="mt-2">
      <Heading size="3" mb="2">
        {projectName ? `${projectName} - Members` : "Project Members"}
      </Heading>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Joined On</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {members.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={3}>
                <Text align="center">No members found</Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            members.map((member) => (
              <Table.Row key={member.relation_id || member.user_id || member.id}>
                <Table.Cell>{member.user?.username || member.username || "Unknown"}</Table.Cell>
                <Table.Cell>{member.user?.role || member.role || "Member"}</Table.Cell>
                <Table.Cell>
                  {member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A"}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Card>
  );
}