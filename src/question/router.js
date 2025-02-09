'use strict';

import express from "express";
import { addQuestion, bulkUploadQuestionAnswer, getAllQuestionsForCategory } from "./controller.js";

const router = express.Router();

router.get('/', getAllQuestionsForCategory);
router.post('/', addQuestion);
router.post('/bulk-upload', bulkUploadQuestionAnswer);

export default router;