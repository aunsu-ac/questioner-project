'use strict';

import express from "express";
import { addQuestion } from "./controller.js";

const router = express.Router();

router.post('/', addQuestion);

export default router;