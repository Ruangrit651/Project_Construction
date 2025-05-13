import prisma from "@src/db";
import { relation } from "@prisma/client";
import { TypePayloadRelation } from "@modules/relation/relationModel";

export const RelationKeys = [
    "relation_id",
    "project_id",
    "user_id",
    "created_at"
];

export const RelationRepository = {
    // ค้นหาความสัมพันธ์ทั้งหมด
    findAllAsync: async () => {
        return prisma.relation.findMany({
            include: {
                project: {
                    select: {
                        project_id: true,
                        project_name: true
                    }
                },
                user: {
                    select: {
                        user_id: true,
                        username: true
                    }
                }
            }
        });
    },

    // ค้นหาความสัมพันธ์ตาม ID
    findById: async (relation_id: string) => {
        return prisma.relation.findUnique({
            where: { relation_id },
            include: {
                project: {
                    select: {
                        project_id: true,
                        project_name: true
                    }
                },
                user: {
                    select: {
                        user_id: true,
                        username: true
                    }
                }
            }
        });
    },

    // ค้นหาความสัมพันธ์ตาม project_id
    findByProjectId: async (project_id: string) => {
        return prisma.relation.findMany({
            where: { project_id },
            include: {
                user: {
                    select: {
                        user_id: true,
                        username: true,
                        role: true
                    }
                }
            }
        });
    },

    // ค้นหาความสัมพันธ์ตาม user_id
    findByUserId: async (user_id: string) => {
        return prisma.relation.findMany({
            where: { user_id },
            include: {
                project: {
                    select: {
                        project_id: true,
                        project_name: true,
                        status: true,
                        start_date: true,
                        end_date: true
                    }
                }
            }
        });
    },

    // ตรวจสอบว่าความสัมพันธ์ระหว่าง project และ user มีอยู่แล้วหรือไม่
    findByProjectAndUser: async (project_id: string, user_id: string) => {
        return prisma.relation.findFirst({
            where: {
                project_id,
                user_id
            }
        });
    },

    // สร้างความสัมพันธ์ใหม่
    create: async (payload: TypePayloadRelation) => {
        return prisma.relation.create({
            data: {
                project_id: payload.project_id,
                user_id: payload.user_id
            },
            include: {
                project: {
                    select: {
                        project_id: true,
                        project_name: true
                    }
                },
                user: {
                    select: {
                        user_id: true,
                        username: true
                    }
                }
            }
        });
    },

    // ลบความสัมพันธ์ตาม ID
    delete: async (relation_id: string) => {
        return prisma.relation.delete({
            where: { relation_id }
        });
    },

    // ลบความสัมพันธ์ตาม project_id และ user_id
    deleteByProjectAndUser: async (project_id: string, user_id: string) => {
        return prisma.relation.deleteMany({
            where: {
                project_id,
                user_id
            }
        });
    },

    // ลบความสัมพันธ์ทั้งหมดของ project
    deleteAllByProject: async (project_id: string) => {
        return prisma.relation.deleteMany({
            where: { project_id }
        });
    },

    // ลบความสัมพันธ์ทั้งหมดของ user
    deleteAllByUser: async (user_id: string) => {
        return prisma.relation.deleteMany({
            where: { user_id }
        });
    }
};