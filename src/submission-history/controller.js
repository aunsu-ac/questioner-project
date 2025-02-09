'use strict';

import moment from "moment";
import { successResponse } from "../../utility/index.js";
import { saveAnswer } from "./schema.js";

export const submitAnswer = async(req, res, next) => {
    try {
        let lo_body = req.body;
        lo_body.user_id = req.user._id;
        lo_body.submission_date = moment().toDate(); // moment autometically manage the timezone

        const lo_question = await saveAnswer(lo_body, req.user);
        successResponse(res, "You've successfully submitted your answer for this question.", lo_question);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}