import { Router, type Request, type Response } from "express";
import { getFullImage, getImageCardData, getImagesByCategory, uploadImage } from "../controllers/images.controller.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    getImagesByCategory(req, res);
});

router.get("/:imageId", (req: Request, res: Response) => {
    console.log("Fetching full image");
    getFullImage(req, res);
});

router.get("/cardData/:imageId", (req: Request, res: Response) => {
    getImageCardData(req, res);
});

router.post("/", (req: Request, res: Response) => {
    uploadImage(req, res);
});

export default router;
