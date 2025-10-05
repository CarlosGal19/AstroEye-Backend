import { parseToBase64 } from "../global/base64.js";
import { PrismaClient } from "../../prisma/generated/index.js";
import type { Request, Response } from "express";

const prisma = new PrismaClient();

export async function getSites(req: Request, res: Response) {
    try {
        const sites = await prisma.site.findMany({
            select: {
                siteId: true,
                name: true,
                imageUrl: true,
            },
        });

        const sitesWithBase64 = await Promise.all(
            sites.map(async (site) => {
                const base64 = await parseToBase64(site.imageUrl);

                return {
                    siteId: site.siteId,
                    name: site.name,
                    imageUrl: base64,
                };
            })
        );
        return res.status(200).json(sitesWithBase64);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getSiteData(req: Request, res: Response) {
    try {
        const siteId = Number(req.params.siteId);
        if (isNaN(siteId)) {
            return res.status(400).json({ error: "Invalid site ID" });
        }
        const site = await prisma.site.findFirst({
            select: {
                name: true,
                imageUrl: true,
            },
            where: { siteId },
        });

        if (!site) return null;

        const imageBase64 = await parseToBase64(site.imageUrl);

        return res.status(200).json({
            name: site.name,
            imageBase64,
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}
