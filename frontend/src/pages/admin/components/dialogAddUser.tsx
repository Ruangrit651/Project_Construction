import { Text, Dialog, Button, Flex, TextField, Select } from "@radix-ui/themes";
import { postUser } from "@/services/user.service";
import { getRole } from "@/services/role.service";
import { getProject } from "@/services/project.service";
import { createRelation } from "@/services/relation.service";
import { useEffect, useState } from "react";

type DialogUserProps = {
  getUserData: Function;
  showToast?: (message: string, type: 'success' | 'error') => void;
};

const DialogAdd = ({ getUserData, showToast }: DialogUserProps) => {
  const [postUserName, setPostUserName] = useState("");
  const [postPassword, setPostPassword] = useState("");
  const [postRole, setPostRole] = useState("");
  const [postProject, setPostProject] = useState<string | null>(null);
  const [roles, setRoles] = useState<{ role_id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ project_id: string; project_name: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

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
          if (showToast) {
            showToast(`Failed to fetch roles: ${response.message}`, 'error');
          } else {
            alert("Failed to fetch roles: " + response.message);
          }
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        if (showToast) {
          showToast("Error fetching roles. Please try again.", 'error');
        } else {
          alert("Error fetching roles. Please try again.");
        }
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [showToast]);

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
          if (showToast) {
            showToast(`Failed to fetch projects: ${response.message}`, 'error');
          } else {
            alert("Failed to fetch projects: " + response.message);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        if (showToast) {
          showToast("Error fetching projects. Please try again.", 'error');
        } else {
          alert("Error fetching projects. Please try again.");
        }
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [showToast]);

  const handleCreateUser = async () => {
    if (!postUserName || !postPassword || !postRole) {
      if (showToast) {
        showToast("Please enter all required fields (username, password, and role).", 'error');
      } else {
        alert("Please enter all required fields (username, password, and role).");
      }
      return;
    }
    try {
      const response = await postUser({
        username: postUserName,
        password: postPassword,
        role: postRole,
        project_id: postProject,
      });

      if (response.statusCode === 200) {
        // If user has selected a project, create the relation
        if (postProject) {
          try {
            await createRelation({
              project_id: postProject,
              user_id: response.responseObject.user_id
            });
            console.log("User-project relation created successfully");
          } catch (relationError) {
            console.error("Failed to create relation:", relationError);
          }
        }

        setPostUserName("");
        setPostPassword("");
        setPostRole("");
        setPostProject(null);
        getUserData();
        
        if (showToast) {
          showToast(`User "${postUserName}" created successfully!`, 'success');
        } else {
          alert("User created successfully!");
        }
      } else {
        if (showToast) {
          showToast(response.message, 'error');
        } else {
          alert(response.message);
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      if (showToast) {
        showToast("Failed to create user. Please try again.", 'error');
      } else {
        alert("Failed to create user. Please try again.");
      }
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button size="1" variant="soft" className="cursor-pointer">Create</Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Create User</Dialog.Title>
        <Flex direction="column" gap="3">
          {/* Username */}
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Username
            </Text>
            <TextField.Root
              id="enter-username"
              value={postUserName}
              placeholder="Enter username"
              onChange={(event) => setPostUserName(event.target.value)}
            />
          </label>
          {/* Password */}
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Password
            </Text>
            <TextField.Root
              value={postPassword}
              placeholder="Enter password"
              type="password"
              onChange={(event) => setPostPassword(event.target.value)}
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
                value={postRole}
                onValueChange={(value) => setPostRole(value)}
              >
                <Select.Trigger>
                  {roles.find((role) => role.name === postRole)?.name || "Select a role"}
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
                value={postProject || "none"}
                onValueChange={(value) => setPostProject(value === "none" ? null : value)}
              >
                <Select.Trigger>
                  {postProject
                    ? projects.find((project) => project.project_id === postProject)?.project_name || "Select a Project"
                    : "No Project"}
                </Select.Trigger>
                <Select.Content>
                  {/* Default option for no project */}
                  <Select.Item value="none">No Project</Select.Item>
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
          <Dialog.Close>
            <Button className="cursor-pointer" onClick={handleCreateUser}>Create</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default DialogAdd;