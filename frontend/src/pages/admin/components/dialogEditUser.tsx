import { Text, Dialog, Button, Flex, TextField, Strong, Select } from "@radix-ui/themes";
import { patchUser } from "@/services/user.service";
import { getRole } from "@/services/role.service";
import { getProject } from "@/services/project.service";
import { createRelation, deleteRelationByProjectUser } from "@/services/relation.service";
import { useState, useEffect } from "react";

type DialogUserProps = {
  getUserData: Function;
  user_id: string;
  username: string;
  role: string;
  project: string;
};

const DialogEdit = ({ getUserData, user_id, username, role, project }: DialogUserProps) => {
  const [patchUserName, setPatchUserName] = useState(username);
  const [patchPassword, setPatchPassword] = useState("");
  const [patchRole, setPatchRole] = useState(role);
  const [patchProject, setPatchProject] = useState(project);
  const [originalProject, setOriginalProject] = useState(project); // เก็บค่าโปรเจกต์เดิม
  const [roles, setRoles] = useState<{ role_id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ project_id: string; project_name: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Fetch roles on component load
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const response = await getRole();
        console.log("Roles:", response.responseObject);
        if (response.success) {
          setRoles(response.responseObject);
        } else {
          alert("Failed to fetch roles: " + response.message);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        alert("Error fetching roles. Please try again.");
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  // Fetch projects on component load
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await getProject();
        console.log("Projects:", response.responseObject);
        if (response.success) {
          setProjects(response.responseObject);
        } else {
          alert("Failed to fetch projects: " + response.message);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        alert("Error fetching projects. Please try again.");
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const handleUpdateUser = async () => {
    if (!patchUserName || !patchRole) {
      alert("Please fill out all required fields.");
      return;
    }

    setProcessing(true);

    try {
      // 1. อัพเดตข้อมูลผู้ใช้
      const response = await patchUser({
        user_id,
        username: patchUserName,
        password: patchPassword || undefined,
        role: patchRole || undefined,
      });

      if (response.statusCode === 200) {
        // 2. จัดการความสัมพันธ์ระหว่างผู้ใช้กับโปรเจกต์

        // เพิ่มความสัมพันธ์ใหม่ (ถ้ามีการเลือก project และเป็น project ที่แตกต่างจากเดิม)
        if (patchProject && patchProject !== originalProject) {
          console.log("Adding user to new project:", patchProject);

          try {
            await createRelation({
              project_id: patchProject,
              user_id: user_id
            });
            console.log("Successfully added user to project");
          } catch (relationError) {
            console.error("Error adding user to new project:", relationError);
            alert("User information updated but there was an error adding to the new project.");
          }
        }

        // Update original project value for next edit
        setOriginalProject(patchProject);

        // Refresh user data
        getUserData();
        alert("User updated successfully!");
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button className="cursor-pointer" size="1" color="orange" variant="soft">
          Edit
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Edit User</Dialog.Title>
        <Flex direction="column" gap="3">
          {/* User ID */}
          <label>
            <Text size="2">
              <Strong>ID: </Strong>
              {user_id}
            </Text>
          </label>
          {/* Current Username */}
          <label>
            <Text size="2">
              <Strong>Current Username: </Strong>
              {username}
            </Text>
          </label>
          {/* New Username */}
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              New Username
            </Text>
            <TextField.Root
              value={patchUserName}
              placeholder="Enter new username"
              onChange={(event) => setPatchUserName(event.target.value)}
            />
          </label>
          {/* Password */}
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Password
            </Text>
            <TextField.Root
              value={patchPassword}
              type="password"
              placeholder="Enter new password (optional)"
              onChange={(event) => setPatchPassword(event.target.value)}
            />
          </label>
          {/* Role */}
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Role
            </Text>
            {loadingRoles ? (
              <Text>Loading roles...</Text>
            ) : (
              <Select.Root
                size="2"
                value={patchRole}
                onValueChange={(value) => setPatchRole(value)}
              >
                <Select.Trigger>
                  {roles.find((role) => role.name === patchRole)?.name || "Select a role"}
                </Select.Trigger>
                <Select.Content>
                  {roles.map((role) => (
                    <Select.Item key={role.role_id} value={role.name}>
                      {role.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </label>
          {/* Project */}
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Project
            </Text>
            {loadingProjects ? (
              <Text>Loading projects...</Text>
            ) : (
              <Select.Root
                size="2"
                value={patchProject}
                onValueChange={(value) => setPatchProject(value)}
              >
                <Select.Trigger>
                  {projects.find((project) => project.project_id === patchProject)?.project_name ||
                    "Select a project"}
                </Select.Trigger>
                <Select.Content>
                  {projects.map((project) => (
                    <Select.Item key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </label>
        </Flex>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button className="cursor-pointer" variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button className="cursor-pointer" variant="soft" color="orange" onClick={handleUpdateUser}>{processing ? "Updating..." : "Update"}</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default DialogEdit;
