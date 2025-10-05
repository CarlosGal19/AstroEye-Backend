import { OpenAI } from "openai";
import sharp from "sharp";
import path from "path";
import fs from "fs-extra";
import type { Request, Response } from "express";
import { PrismaClient } from "../../prisma/generated/index.js";
import { parseToBase64 } from "../global/base64.js";
import { bucket } from "../global/bucket.js";
import type { UploadedFile } from "express-fileupload";

const prisma = new PrismaClient();

export async function getImagesByCategory(req: Request, res: Response) {
    try {
        const pageNumber = Number(req.params.page) || 1;
        const categoryId = Number(req.params.categoryId) || null;

        const images = await prisma.image.findMany({
            select: {
                imageId: true,
                title: true,
                previewImageUrl: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            where: categoryId ? { categoryId } : {},
            take: 15,
            skip: 15 * (pageNumber - 1),
        });

        if (images.length === 0) return [];

        const imagesWithBase64 = await Promise.all(
            images.map(async (img) => {
                const base64 = await parseToBase64(img.previewImageUrl);
                return {
                    imageId: img.imageId,
                    title: img.title,
                    base64,
                };
            })
        );

        return res.status(200).json(imagesWithBase64);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getFullImage(req: Request, res: Response) {
    try {
        try {
            const imageId = Number(req.params.imageId);
            const image = await prisma.image.findFirst({
                select: {
                    title: true,
                    description: true,
                    fullImageUrl: true,
                },
                where: { imageId },
            });

            if (!image) return res.status(404).json({ error: "Image not found" });

            return res.status(200).json({
                title: image.title,
                description: image.description,
                imageUrl: `${process.env.BUCKET_URL}${image.fullImageUrl}`,
            });
        } catch {
            return { error: "Error fetching image" };
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getImageCardData(req: Request, res: Response) {
    try {
        const imageId = Number(req.params.imageId);

        const image = await prisma.image.findFirst({
            select: {
                imageId: true,
                title: true,
                description: true,
                previewImageUrl: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            where: {
                imageId,
            },
        });

        const imageBase64 = image?.previewImageUrl
            ? await parseToBase64(image.previewImageUrl)
            : null;

        if (!image) return res.status(404).json({ error: "Image not found" });

        return res.status(200).json({
            imageId: image.imageId,
            title: image.title,
            description: image.description,
            category: image.category?.name,
            imageBase64,
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function uploadImage(req: Request, res: Response) {
    try {
        console.log(req.file);
        const file = req.file;
        const title = req.body.title as string;
        const description = req.body.description as string;
        const categoryId = Number(req.body.categoryId);
        if (!file || !title || !description || !categoryId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const fileName = file.originalname.split('.')[0]
        const format = file.originalname.split('.')[1]

        // await prisma.image.create({
        //     data: {
        //         previewImageUrl: `images/${fileName}/resized.${format}`,
        //         fullImageUrl: `images/${fileName}/${fileName}_dzi/output.dzi`,
        //         title,
        //         description,
        //         categoryId
        //     }
        // })

        const bufferData = await file.buffer
        console.log("Uploading full image");
        console.log(bufferData);

        await bucket.file(`images/${fileName}/full.jpg`).save(bufferData, {
            resumable: false,
            contentType: 'image/jpeg',
        });

        const resizedBuffer = await sharp(bufferData).resize({ width: 384 }).jpeg({ quality: 100 }).toBuffer();
        await bucket.file(`images/${fileName}/resized.${format}`).save(resizedBuffer, {
            resumable: false,
            contentType: 'image/jpeg'
        })

        const dziDir = path.join(process.cwd(), "dzi_output");
        await fs.ensureDir(dziDir);

        await sharp(bufferData)
            .tile({ size: 256, layout: "dz" })
            .toFile(path.join(dziDir, "output"));

        const outputDzi = path.join(dziDir, "output.dzi");

        const dziDestination = `images/${fileName}/${fileName}_dzi/output.dzi`
        await bucket.upload(outputDzi, { destination: dziDestination, resumable: false, contentType: 'application/xml' });

        const outputFilesDir = path.join(dziDir, "output_files");
        const folders = await fs.readdir(outputFilesDir);

        for (const folder of folders) {

            const folderPath = path.join(outputFilesDir, folder);
            const stats = await fs.stat(folderPath);

            if (stats.isDirectory()) {

                const images = await fs.readdir(folderPath);
                for (const image of images) {
                    const imagePath = path.join(folderPath, image);
                    const destination = `images/${fileName}/${fileName}_dzi/output_files/${folder}/${image}`;
                    await bucket.upload(imagePath, { destination, resumable: false, contentType: 'image/jpeg' });
                }

            } else {

                const destination = `images/${fileName}/${fileName}_dzi/output_files/${folder}`;
                await bucket.upload(folderPath, { destination, resumable: false, contentType: 'application/xml' });
            }
        }

        await fs.remove(dziDir);

        return res.status(200).json({ message: "Image uploaded successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}

export async function getJamesWebbImages(req: Request, res: Response) {
    try {
        const images = await prisma.image.findMany({
            select: {
                imageId: true,
                title: true,
                previewImageUrl: true,
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            where: { categoryId: 11 }, // Assuming categoryId 3 corresponds to James Webb images
            take: 15,
        });

        if (images.length === 0) return res.status(404).json({ error: "No images found" });

        const imagesWithBase64 = await Promise.all(
            images.map(async (img) => {
                const base64 = await parseToBase64(img.previewImageUrl);
                return {
                    imageId: img.imageId,
                    title: img.title,
                    base64,
                };
            })
        );

        return res.status(200).json(imagesWithBase64);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getPromptEmbedding(prompt: string) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: prompt,
    });

    return response?.data[0]?.embedding;
}

function parseEmbedding(text: string): number[] {
    return text.split(",").map(Number);
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
    const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] ?? 0), 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dot / (magA * magB);
}

export async function getPromptImages(req: Request, res: Response) {
    try {
        const userPrompt = req.query.prompt as string;
        if (!userPrompt) return res.status(400).json({ error: "Prompt is required" });

        const promptEmbedding = await getPromptEmbedding(userPrompt);

        const images = await prisma.image.findMany({
            select: {
                imageId: true,
                title: true,
                previewImageUrl: true,
                aiDescription: true,
            },
            take: 500,
        });

        // 3️⃣ Calcular similitud
        const scoredImages = images.map(img => {
            if (!img.aiDescription) return { ...img, similarity: -1 }; // Manejar caso sin embedding
            if (!promptEmbedding) return { ...img, similarity: -1 }; // Manejar caso sin embedding de prompt
            const imageEmbedding = parseEmbedding(img.aiDescription);
            const similarity = cosineSimilarity(promptEmbedding, imageEmbedding);
            console.log(`Similitud para imagen ${img.imageId}: ${similarity}`);
            return { ...img, similarity };
        });

        // 4️⃣ Ordenar por similitud descendente y tomar solo aquellas con una simulitud positiva
        const positiveImages = scoredImages.filter(img => img.similarity > 0.5);
        const topImages = positiveImages
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 15);

        // 5️⃣ Convertir a base64
        const imagesWithBase64 = await Promise.all(
            topImages.map(async (img) => {
                const base64 = await parseToBase64(img.previewImageUrl);
                return {
                    imageId: img.imageId,
                    title: img.title,
                    base64,
                    similarity: img.similarity,
                };
            })
        );

        return res.status(200).json(imagesWithBase64);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

