import { useState } from "react";
import { Dialog, Button, Flex, TextField, Text, Select } from "@radix-ui/themes";
import { patchResource } from "@/services/resource.service";
import { TypeResourceAll } from "@/types/response/response.resource";

interface DialogEditResourceProps {
    getResourceData: () => void;
    updateResourceInState: (updatedResource: TypeResourceAll) => void; // เพิ่ม prop ใหม่
    resource: TypeResourceAll;
}

const DialogEditResource: React.FC<DialogEditResourceProps> = ({ getResourceData, resource, updateResourceInState }) => {
    const [resourceName, setResourceName] = useState(resource.resource_name);
    const [resourceType, setResourceType] = useState(resource.resource_type);
    const [cost, setCost] = useState(resource.cost);
    const [quantity, setQuantity] = useState(resource.quantity);
    // const [total, setTotal] = useState(resource.total);

    const formatNumber = (value: number) => {
        return value.toLocaleString();
    };

    const handleCostChange = (event: any) => {
        const value = event.target.value.replace(/,/g, ""); // Remove commas for parsing
        const numericValue = value === "" ? 0 : Number(value);
        setCost(numericValue);
    };

    const handleQuantityChange = (event: any) => {
        const value = event.target.value.replace(/,/g, ""); // Remove commas for parsing
        const numericValue = value === "" ? 0 : Number(value);
        setQuantity(numericValue);
    };

    const handleEditResource = async () => {
        try {
            const updatedResource = {
                resource_id: resource.resource_id,
                resource_name: resourceName,
                resource_type: resourceType,
                cost: Number(cost),
                quantity: Number(quantity),
                total: Number(cost) * Number(quantity),
                task_id: resource.task_id,
                subtask_id: resource.subtask_id
            };

            const response = await patchResource(updatedResource);

            if (response.success) {
                // อัพเดท state โดยตรงแทนการโหลดข้อมูลใหม่ทั้งหมด
                updateResourceInState(updatedResource);
            } else {
                alert(`เกิดข้อผิดพลาด: ${response.message}`);
            }
        } catch (error) {
            console.error("แก้ไขข้อมูลไม่สำเร็จ:", error);
            alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button color="orange" variant="soft" className="cursor-pointer">Edit</Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>Edit Resource</Dialog.Title>
                <Flex direction="column">
                    <label>
                        <Text as="div" size="2" mb="3" weight="bold">
                            Resource Name
                        </Text>
                        <TextField.Root
                            value={resourceName}
                            type="text"
                            onChange={(e) => setResourceName(e.target.value)} placeholder="Enter Resource Name" />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">
                            Resource Type
                        </Text>
                        <Select.Root value={resourceType} onValueChange={setResourceType}>
                            <Select.Trigger className="select-trigger">
                                {resourceType} {/* Display the selected resource type */}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="material">Material</Select.Item>
                                <Select.Item value="equipment">Equipment</Select.Item>
                                <Select.Item value="worker">Worker</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">
                            Cost
                        </Text>
                        <TextField.Root
                            value={formatNumber(cost)}
                            type="text"
                            onChange={handleCostChange} placeholder="Enter Cost" />
                    </label>
                    <label>
                        <Text as="div" size="2" mb="3" mt="3" weight="bold">
                            Quantity
                        </Text>
                        <TextField.Root
                            value={formatNumber(quantity)}
                            type="text"
                            onChange={handleQuantityChange} placeholder="Enter Quantity" />
                    </label>
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="gray" mb="3" mt="3" >
                            Cancel
                        </Button>
                    </Dialog.Close>
                    <Dialog.Close>
                        <Button className="cursor-pointer" variant="soft" color="orange" mb="3" mt="3" onClick={handleEditResource}>Update</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default DialogEditResource;