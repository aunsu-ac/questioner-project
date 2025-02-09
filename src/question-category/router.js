'use strict';

import express from "express";
import { getAllCategoryListWithCount, addCategory, getAllQuestionsForCategory } from "./controller.js";

const router = express.Router();

router.get('/', getAllCategoryListWithCount);
router.get('/get-category-wise-question', getAllQuestionsForCategory);
router.post('/', addCategory);

export default router;