import { storage, bucketName } from "./bucket.js";

export async function parseToBase64(filePath: string): Promise<string> {
    try {
        const file = storage.bucket(bucketName).file(filePath);
        const [buffer] = await file.download();

        const ext = filePath.split(".").pop()?.toLowerCase();
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
        return "";
    }
}
