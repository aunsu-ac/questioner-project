'use strict';

import moment from "moment";
import { successResponse } from "../../utility/index.js";
import { getAllSubmitedAnswers, saveAnswer } from "./schema.js";

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
export const getAllSubmitedAnswersWithFilter = async(req, res, next) => {
    try {
        const la_submitedAnswerList = await getAllSubmitedAnswers(req.query);
        let ls_messsage = "No Submitted Answers Found";
        if (la_submitedAnswerList.submited_answer_list.length > 0) {
            ls_messsage = "Submitted Answer Listing";
        }

        successResponse(res, ls_messsage, la_submitedAnswerList);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}