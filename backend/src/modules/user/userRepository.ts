import prisma from "@src/db"; 
import { user } from "@prisma/client"; 
import { TypePayloadUser } from "@modules/user/userModel"; 

export const UserKeys = [
    "user_id",
    "project_id",
    "role",
    "username",
    "password",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by"
];


export const UserRepository = { //Object
    // ค้นหาผู้ใช้ทั้งหมด
    findAllAsync: async () => {
        return prisma.user.findMany({
            include: {projects: true}
        });
    },

    // ค้นหาผู้ใช้ตามชื่อผู้ใช้
    findByUsername: async (username: string, keys = UserKeys as Array<keyof user>) => { //Method
        return prisma.user.findUnique({
            where: { username: username },
            select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        }) as Promise<Pick<user, keyof user> | null>;
    },

    // ค้นหาผู้ใช้ตาม user_id
    findById: async (user_id: string) => {
        return prisma.user.findUnique({
            where: { user_id: user_id },
            select: {
                user_id: true,
                username: true,
                role: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true
            }
        });
    },


    // สร้างผู้ใช้ใหม่
    create: async (payload: TypePayloadUser) => {
        const username = payload.username.trim();
        const setPayload: any = {
            project_id:payload.project_id,
            username: username,
            password: payload.password,
            role: payload.role,
            created_by: payload.created_by,
            updated_by: payload.updated_by
        };
        
        console.log ('project_id:', setPayload.project_id);
        return await prisma.user.create({
            data: setPayload
        });
    },

    update: async (user_id: string, payload: Partial<TypePayloadUser>) => {
        return await prisma.user.update({
            where: {
                user_id: user_id,  // ใช้ user_id ในการอัปเดต
            },
            data: {
                username: payload.username,
                password: payload.password,
                role: payload.role || "", 
                project_id: payload.project_id
            },
        });
    },

    // ลบผู้ใช้
    delete: async (user_id: string) => {
        return await prisma.user.delete({
            where: { user_id: user_id }
        });
    }
};

// userRepository เอาไว้จัดการ ฐานข้อมูล