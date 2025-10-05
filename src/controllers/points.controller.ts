import type { Request, Response } from "express";
import { PrismaClient } from "../../prisma/generated/index.js";
import { parseToBase64 } from "../global/base64.js";

const prisma = new PrismaClient();

export async function getPointsBySite(req: Request, res: Response) {
    try {
        const siteId = Number(req.params.siteId);
        if (isNaN(siteId)) {
            return res.status(400).json({ error: "Invalid site ID" });
        }
        const points = await prisma.point.findMany({
            select: {
                pointId: true,
                longitude: true,
                latitude: true,
                image: {
                    select: {
                        title: true,
                    }
                }
            },
            where: {
                siteId
            }
        })

        if (points.length === 0) return res.status(200).json([]);

        return res.status(200).json({
            points: points.map(p => ({
                pointId: p.pointId,
                pointLat: Number(p.latitude),
                pointLng: Number(p.longitude),
                imageTitle: p.image?.title
            }))
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getPointData(req: Request, res: Response) {
    try {
        const pointId = Number(req.params.pointId);
        const point = await prisma.point.findFirst({
            select: {
                pointId: true,
                siteId: true,
                image: {
                    select: {
                        imageId: true,
                        title: true,
                        description: true,
                        previewImageUrl: true,
                        category: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
            },
            where: {
                pointId
            }
        })

        const imageBase64 = point?.image?.previewImageUrl ? await parseToBase64(point.image.previewImageUrl) : null;
        if (!point) return res.status(404).json({ error: "Point not found" });

        return res.status(200).json({
            pointId,
            siteId: point?.siteId,
            imageId: point?.image?.imageId,
            title: point?.image?.title,
            description: point?.image?.description,
            category: point?.image?.category?.name,
            imageBase64
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}
