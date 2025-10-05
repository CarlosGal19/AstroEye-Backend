import { Router, type Request, type Response } from "express";
import { getSiteData, getSites } from "../controllers/sites.controller.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", async (req: Request, res: Response) => {
    getSites(req, res);
});

router.get("/:siteId", upload.single("file"), (req: Request, res: Response) => {
    getSiteData(req, res);
});

export default router;
