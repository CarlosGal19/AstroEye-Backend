import { Router } from "express";
import { getPointData, getPointsBySite } from "../controllers/points.controller.js";

const router = Router();

router.get("/site/:siteId", (req, res) => {
    getPointsBySite(req, res);
});

router.get("/:pointId", (req, res) => {
    getPointData(req, res);
});

export default router;
