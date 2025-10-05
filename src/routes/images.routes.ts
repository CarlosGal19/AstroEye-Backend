import { Router, type Request, type Response } from "express";
import { getFullImage, getImageCardData, getImagesByCategory, getJamesWebbImages, uploadImage } from "../controllers/images.controller.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    getImagesByCategory(req, res);
});

router.get("/:imageId", (req: Request, res: Response) => {
    getFullImage(req, res);
});

router.get("/cardData/:imageId", (req: Request, res: Response) => {
    getImageCardData(req, res);
});

router.get("/images/james_webb", (req: Request, res: Response) => {
    getJamesWebbImages(req, res);
});

router.post("/", (req: Request, res: Response) => {
    uploadImage(req, res);
});

export default router;
