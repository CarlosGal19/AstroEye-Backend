import type { Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client.js'

const prisma = new PrismaClient()

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            select: {
                categoryId: true,
                name: true,
            }
        });
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
