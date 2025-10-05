import { getCategories } from "../controllers/category.controller.js";

import { Router } from "express";

const router = Router();

router.get("/", getCategories);

export default router;
