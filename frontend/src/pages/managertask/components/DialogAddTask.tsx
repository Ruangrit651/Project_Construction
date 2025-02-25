// import { useState } from "react";
// import * as Dialog from "@radix-ui/react-dialog";
// import { Button } from "@radix-ui/themes";
// import { PayloadCreateTask } from "@/types/requests/request.task";

// export default function DialogAddTask({ addTask }: { addTask: (task: PayloadCreateTask) => void }) {
//     const [task, setTask] = useState<PayloadCreateTask>({
//         task_name: "",
//         description: "",
//         budget: undefined,
//         start_date: "",
//         end_date: "",
//         status: false,
//     });

//     const handleSave = () => {
//         if (task.task_name && task.start_date && task.end_date) {
//             addTask(task);
//             setTask({
//                 task_name: "",
//                 description: "",
//                 budget: undefined,
//                 start_date: "",
//                 end_date: "",
//                 status: false,
//             });
//         } else {
//             alert("กรุณากรอกข้อมูลที่จำเป็น");
//         }
//     };

//     return (
//         <Dialog.Root>
//             <Dialog.Trigger asChild>
//                 <Button>เพิ่ม Task ใหม่</Button>
//             </Dialog.Trigger>
//             <Dialog.Portal>
//                 <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
//                 <Dialog.Content className="fixed bg-white p-6 rounded-lg shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//                     <Dialog.Title className="text-lg font-semibold mb-4">เพิ่ม Task ใหม่</Dialog.Title>
//                     <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
//                         <div>
//                             <label className="block text-sm font-medium">ชื่อ Task</label>
//                             <input
//                                 type="text"
//                                 value={task.task_name}
//                                 onChange={(e) => setTask({ ...task, task_name: e.target.value })}
//                                 className="border p-2 w-full rounded"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium">รายละเอียด</label>
//                             <textarea
//                                 value={task.description}
//                                 onChange={(e) => setTask({ ...task, description: e.target.value })}
//                                 className="border p-2 w-full rounded"
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium">งบประมาณ</label>
//                             <input
//                                 type="number"
//                                 value={task.budget || ""}
//                                 onChange={(e) => setTask({ ...task, budget: parseFloat(e.target.value) })}
//                                 className="border p-2 w-full rounded"
//                             />
//                         </div>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium">วันที่เริ่ม</label>
//                                 <input
//                                     type="date"
//                                     value={task.start_date}
//                                     onChange={(e) => setTask({ ...task, start_date: e.target.value })}
//                                     className="border p-2 w-full rounded"
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium">วันที่สิ้นสุด</label>
//                                 <input
//                                     type="date"
//                                     value={task.end_date}
//                                     onChange={(e) => setTask({ ...task, end_date: e.target.value })}
//                                     className="border p-2 w-full rounded"
//                                     required
//                                 />
//                             </div>
//                         </div>
//                         <Button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">
//                             บันทึก
//                         </Button>
//                     </form>
//                 </Dialog.Content>
//             </Dialog.Portal>
//         </Dialog.Root>
//     );
// }
// --------------------------------------------------------------

// import { useState } from "react";
// import * as Dialog from "@radix-ui/react-dialog";
// import { Button ,Flex } from "@radix-ui/themes";
// import { PayloadCreateTask } from "@/types/requests/request.task";

// export default function DialogAddTask({ addTask }: { addTask: (task: PayloadCreateTask) => void }) {
//     const [task, setTask] = useState({
//         task_name: "",
//         description: "",
//         budget: 0,
//         start_date: "",
//         end_date: "",
//         status: false,
//     });

//     const handleSave = () => {
//         if (task.task_name && task.start_date && task.end_date) {
//             addTask(task);
//             setTask({
//                 task_name: "",
//                 description: "",
//                 budget: 0,
//                 start_date: "",
//                 end_date: "",
//                 status: false,
//             });
//         } else {
//             alert("Please fill in all required fields!");
//         }
//     };

//     return (
//         <Dialog.Root>
//             <Dialog.Trigger asChild>
//                 <Button>เพิ่ม Task ใหม่</Button>
//             </Dialog.Trigger>
//             <Dialog.Portal>
//                 <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
//                 <Dialog.Content className="fixed bg-white p-6 rounded-lg shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//                     <Dialog.Title>เพิ่ม Task ใหม่</Dialog.Title>
//                     <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
//                         <div>
//                             <label className="block text-sm font-medium">ชื่อ Task</label>
//                             <input
//                                 type="text"
//                                 value={task.task_name}
//                                 onChange={(e) => setTask({ ...task, task_name: e.target.value })}
//                                 className="border p-2 w-full"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium">วันที่เริ่ม</label>
//                             <input
//                                 type="date"
//                                 value={task.start_date}
//                                 onChange={(e) => setTask({ ...task, start_date: e.target.value })}
//                                 className="border p-2 w-full"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium">วันที่สิ้นสุด</label>
//                             <input
//                                 type="date"
//                                 value={task.end_date}
//                                 onChange={(e) => setTask({ ...task, end_date: e.target.value })}
//                                 className="border p-2 w-full"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium">งบประมาณ</label>
//                             <input
//                                 type="number"
//                                 value={task.budget}
//                                 onChange={(e) => setTask({ ...task, budget: parseFloat(e.target.value) })}
//                                 className="border p-2 w-full"
//                                 required
//                             />
//                         </div>
//                         <Flex gap="3" mt="4" justify="end">
//                             <Dialog.Close>
//                                 <Button  variant="soft" color="green" type="submit" onClick={handleSave}>
//                                     Save
//                                 </Button>
//                             </Dialog.Close>
//                         </Flex>
//                     </form>
//                 </Dialog.Content>
//             </Dialog.Portal>
//         </Dialog.Root>
//     );
// }

import {
  GanttComponent,
  TaskFieldsModel,
  ColumnsDirective,
  ColumnDirective,
  Edit,
  Inject,
  Toolbar,
  Selection,
} from "@syncfusion/ej2-react-gantt";
import './Gantt.css';
import { PayloadCreateTask, PayloadUpdateTask } from "@/types/requests/request.task";

interface GanttProps {
  tasks: PayloadCreateTask[];
  onTasksChange: (updatedTasks: PayloadCreateTask[]) => void;
}

export default function DialogAddTask({ tasks, onTasksChange }: GanttProps) {
  const editOptions = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    allowTaskbarEditing: true,
    mode: "Auto",
  };

  const taskValues: TaskFieldsModel = {
    id: "task_name",
    name: "task_name",
    startDate: "start_date",
    endDate: "end_date",
  };

  const handleActionComplete = (args: any) => {
    if (args.requestType === "save") {
      const updatedTask: PayloadUpdateTask = args.data;
      const updatedTasks = tasks.map((task) =>
        task.task_name === updatedTask.task_name ? updatedTask : task
      );
      onTasksChange(updatedTasks);
    } else if (args.requestType === "delete") {
      const updatedTasks = tasks.filter((task) => task.task_name !== args.data[0].task_name);
      onTasksChange(updatedTasks);
    }
  };

  return (
    <div>
      <GanttComponent
        dataSource={tasks}
        taskFields={taskValues}
        editSettings={editOptions}
        toolbar={["Add", "Edit", "Delete", "Update", "Cancel"]}
        allowSelection={true}
        actionComplete={handleActionComplete}
      >
        <Inject services={[Edit, Toolbar, Selection]} />
        <ColumnsDirective>
          <ColumnDirective field="task_name" headerText="Task Name" />
          <ColumnDirective field="description" headerText="Description" />
          <ColumnDirective field="start_date" headerText="Start Date" format="dd-MMM-yy" />
          <ColumnDirective field="end_date" headerText="End Date" format="dd-MMM-yy" />
          <ColumnDirective
            field="status"
            headerText="Status"
            textAlign="Center"
            template={(props) => (props.status ? "✅ Completed" : "⏳ In Progress")}
          />
        </ColumnsDirective>
      </GanttComponent>
    </div>
  );
}

