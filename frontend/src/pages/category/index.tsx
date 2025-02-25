import { useEffect, useState } from "react";
import { Card , Table, Text, Flex } from "@radix-ui/themes";
import { getCategories } from "@/services/category.service";
import {TypeCategoriesAll} from "@/types/response/response.category";
import DialogAdd from "./components/dialogAddCategory";
import DialogEdit from "./components/dialogEditCategory";
import AlertDialogDelete from "./components/alertDialogDeletCategory";

export default function CategoriesPage(){
    const [categories, setCategories] = useState<TypeCategoriesAll[]>([]);

    const getCategoriesDate = () => {
        getCategories().then((res) => {
            console.log(res);
            
            setCategories(res.responseObject);
        })
    }

    useEffect (() => {
        getCategoriesDate();
    }, []);

    return (
        // <div className="flex flex-col h-screen">
        //     <div className="coutainer w-full pt-2 ">
                <Card variant="surface" >
                <Flex className="w-full" direction="row" gap="2">
                    <Text as="div" size="2" weight="bold">
                        Categories
                    </Text>
                    <DialogAdd getCategoriesData={getCategoriesDate} />
                </Flex>
                    <div className="w-full mt-2">
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Id</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>category Name</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Edit</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Delete</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {categories && categories.map((category: TypeCategoriesAll) => (
                                    <Table.Row key={category.id}>
                                    <Table.RowHeaderCell>{category.id}</Table.RowHeaderCell>
                                    <Table.Cell>{category.category_name}</Table.Cell>
                                    <Table.Cell>
                                        <DialogEdit
                                            getCategoriesData={getCategoriesDate}
                                            id={category.id}
                                            category_name={category.category_name}
                                        />
                                        </Table.Cell>
                                    <Table.Cell>
                                        <AlertDialogDelete
                                            getCategoriesDate={getCategoriesDate}
                                            id={category.id}
                                            category_name={category.category_name}
                                        />
                                    </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </div>
                </Card>
        //     </div>
        // </div>
    );
}