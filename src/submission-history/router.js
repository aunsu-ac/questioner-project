'use strict';

import express from "express";
import { submitAnswer } from "./controller.js";
import { user_authorization } from "../middlewares/index.js";

const router = express.Router();

router.post('/', user_authorization(['user']), submitAnswer);

export default router;