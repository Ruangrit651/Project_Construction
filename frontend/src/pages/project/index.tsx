import { useEffect, useState } from "react";
import { Card, Table, Text, Flex, Button, Dialog, Heading, Tabs } from "@radix-ui/themes";
import { getProject } from "@/services/project.service";
import { TypeProjectAll } from "@/types/response/response.project";
import DialogAdd from "./components/dialogAddProject";
import DialogEdit from "./components/dialogEditProject";
import AlertDialogDelete from "./components/alertDialogDeletProject";
import { getUser } from "@/services/user.service";
import ProjectMembers from "./components/projectMenber";
import ProjectDetailPage from "./components/projectDetail";
import * as Toast from '@radix-ui/react-toast';

export default function AdminProjectPage() {
    const [project, setProject] = useState<TypeProjectAll[]>([]);
    const [users, setUsers] = useState<any[]>([]); // สำหรับเก็บข้อมูลผู้ใช้
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showProjectDetail, setShowProjectDetail] = useState(false);

    // State สำหรับ Toast
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // ฟังก์ชันสำหรับแสดง Toast
    const showToast = (message: string, type: 'success' | 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };



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

    // เปิด dialog แสดงรายละเอียดโปรเจค
    const openProjectDetail = (projectId: string) => {
        setSelectedProjectId(projectId);
        setShowProjectDetail(true);
    };

    useEffect(() => {
        getProjectData();
        getUserData(); // ดึงข้อมูล User ด้วย
    }, []);

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
                    Project
                </Text>
                <DialogAdd 
                getProjectData={getProjectData}
                showToast={showToast} // ส่งฟังก์ชัน showToast ไปด้วย
                 />
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
                                            {/* เพิ่มปุ่มดูรายละเอียด */}
                                            <Button
                                                size="1"
                                                variant="soft"
                                                color="blue"
                                                onClick={() => openProjectDetail(project.project_id)}
                                            >
                                                Detail
                                            </Button>
                                            {/* ปุ่มแก้ไขและลบที่มีอยู่แล้ว */}
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
                                                showToast={showToast} // ส่งฟังก์ชัน showToast ไปด้วย
                                            />
                                        </Flex>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                    </Table.Body>
                </Table.Root>
            </div>

            {/* Dialog for ProjectDetail */}
            <Dialog.Root open={showProjectDetail} onOpenChange={setShowProjectDetail}>
                <Dialog.Content size="3" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
                    <Dialog.Title>Project Details</Dialog.Title>

                    {selectedProjectId && (
                        <div className="mt-3">
                            {/* Use ProjectDetailPage with tabs */}
                            <ProjectDetailPage projectId={selectedProjectId} />
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