'use strict';

import express from "express";
import { getAllCategoryListWithCount, addCategory } from "./controller.js";

const router = express.Router();

router.get('/', getAllCategoryListWithCount);
router.post('/', addCategory);

export default router;