// import { useEffect, useState } from "react";
// import { Card, Table, Text, Flex } from "@radix-ui/themes";
// import { getProject } from "@/services/project.service";
// import { TypeProjectAll } from "@/types/response/response.project";
// import DialogAdd from "./components/dialogAddProject";
// import DialogEdit from "./components/dialogEditProject";
// import AlertDialogDelete from "./components/alertDialogDeletProject";

// export default function AdminProjectPage() {
//     const [project, setProject] = useState<TypeProjectAll[]>([]);

//     const getProjectData = () => {
//         getProject().then((res) => {
//             console.log(res);
//             setProject(res.responseObject);
//         });
//     };

//     useEffect(() => {
//         getProjectData();
//     }, []);

//     return (
//         <Card variant="surface">
//             <Flex className="w-full" direction="row" gap="2">
//                 <Text as="div" size="4" weight="bold">
//                     Project
//                 </Text>
//                 <DialogAdd getProjectData={getProjectData} />
//             </Flex>
//             <div className="w-full mt-2">
//                 <Table.Root variant="surface">
//                     <Table.Header>
//                         <Table.Row>
//                             {/* <Table.ColumnHeaderCell>Id</Table.ColumnHeaderCell> */}
//                             <Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
//                             <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
//                         </Table.Row>
//                     </Table.Header>
//                     <Table.Body>
//                         {project &&
//                             project.map((project: TypeProjectAll) => (
//                                 <Table.Row key={project.project_id}>
//                                     {/* <Table.RowHeaderCell>{project.project_id}</Table.RowHeaderCell> */}
//                                     <Table.Cell>{project.project_name}</Table.Cell>
//                                     <Table.Cell>{new Intl.NumberFormat("en-US").format(project.budget)}</Table.Cell>
//                                     <Table.Cell>{project.status}</Table.Cell>
//                                     <Table.Cell>{project.user_id}</Table.Cell>
//                                     <Table.Cell>
//                                         <Flex gap="2">
//                                             <DialogEdit
//                                                 getProjectData={getProjectData}
//                                                 project_id={project.project_id}
//                                                 project_name={project.project_name}
//                                                 budget={project.budget}
//                                                 status={project.status}
//                                                 start_date={project.start_date}
//                                                 end_date={project.end_date}
//                                             />
//                                             <AlertDialogDelete
//                                                 getProjectDate={getProjectData}
//                                                 project_id={project.project_id}
//                                                 project_name={project.project_name}
//                                             />
//                                         </Flex>
//                                     </Table.Cell>
//                                 </Table.Row>
//                             ))}
//                     </Table.Body>
//                 </Table.Root>
//             </div>
//         </Card>
//     );
// }

import { useEffect, useState } from "react";
import { Card, Table, Text, Flex } from "@radix-ui/themes";
import { getProject } from "@/services/project.service";
import { TypeProjectAll } from "@/types/response/response.project";
import DialogAdd from "./components/dialogAddProject";
import DialogEdit from "./components/dialogEditProject";
import AlertDialogDelete from "./components/alertDialogDeletProject";
import { getUser } from "@/services/user.service";

export default function AdminProjectPage() {
    const [project, setProject] = useState<TypeProjectAll[]>([]);
    const [users, setUsers] = useState<any[]>([]); // สำหรับเก็บข้อมูลผู้ใช้

    const getProjectData = () => {
        getProject().then((res) => {
            console.log(res);
            setProject(res.responseObject);
        });
    };

    // ดึงข้อมูล User เพื่อใช้แสดงชื่อ
    const getUserData = () => {
        getUser().then((res) => {
            if (res.success) {
                setUsers(res.responseObject);
            }
        });
    };

    // หาชื่อ User จาก user_id
    const getUsernameById = (userId: string | undefined) => {
        if (!userId) return "ไม่ระบุ";
        const user = users.find(user => user.user_id === userId);
        return user ? user.username : "ไม่ระบุ";
    };

    useEffect(() => {
        getProjectData();
        getUserData(); // ดึงข้อมูล User ด้วย
    }, []);

    return (
        <Card variant="surface">
            <Flex className="w-full" direction="row" gap="2">
                <Text as="div" size="4" weight="bold">
                    Project
                </Text>
                <DialogAdd getProjectData={getProjectData} />
            </Flex>
            <div className="w-full mt-2">
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Project Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Budget</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {project &&
                            project.map((project: TypeProjectAll) => (
                                <Table.Row key={project.project_id}>
                                    <Table.Cell>{project.project_name}</Table.Cell>
                                    <Table.Cell>{new Intl.NumberFormat("en-US").format(project.budget)}</Table.Cell>
                                    <Table.Cell>{project.status}</Table.Cell>
                                    <Table.Cell>
                                        {/* แสดงชื่อเจ้าของ โดยใช้ owner ที่ส่งมาจาก API หรือหาจาก user_id */}
                                        {project.owner?.username || getUsernameById(project.user_id) || "ไม่ระบุ"}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex gap="2">
                                            <DialogEdit
                                                getProjectData={getProjectData}
                                                project_id={project.project_id}
                                                project_name={project.project_name}
                                                budget={project.budget}
                                                status={project.status}
                                                start_date={project.start_date}
                                                end_date={project.end_date}
                                                user_id={project.user_id} // ส่ง user_id ไปด้วย
                                            />
                                            <AlertDialogDelete
                                                getProjectDate={getProjectData}
                                                project_id={project.project_id}
                                                project_name={project.project_name}
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
