'use strict';

import express from "express";
import { addQuestion, bulkUploadQuestionAnswer } from "./controller.js";

const router = express.Router();

router.post('/', addQuestion);
router.post('/bulk-upload', bulkUploadQuestionAnswer);

export default router;