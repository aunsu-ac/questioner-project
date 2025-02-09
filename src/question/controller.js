'use strict';

import { successResponse } from "../../utility/index.js";
import { createQuestion } from "./schema.js";

export const addQuestion = async(req, res, next) => {
    try {
        const lo_question = await createQuestion(req.body);
        successResponse(res, "Question Added Successfully", lo_question);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}