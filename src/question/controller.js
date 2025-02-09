'use strict';

import { convertCsvToJson, successResponse, updateKeyName } from "../../utility/index.js";
import { addBulkQuestion, createQuestion, listOfQuestionsForCategory } from "./schema.js";
import fs from "fs";
import path from "path";
const __dirname = path.resolve();

export const addQuestion = async(req, res, next) => {
    try {
        const lo_question = await createQuestion(req.body);
        successResponse(res, "Question Added Successfully", lo_question);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}
export const bulkUploadQuestionAnswer = async(req, res, next) => {
    try {
        const ls_filePath = req.body?.csv_path || '';
        if (ls_filePath == '') {
            throw new Error('Please provide file path');
        }
        const ls_fullPath = path.join(__dirname, `public/temp/${ls_filePath}`);
        if (!fs.existsSync(ls_fullPath)) {
            throw new Error('File does not exist');
        }

        const la_rawData = await convertCsvToJson(ls_fullPath);
        const la_formatedData = await updateKeyName(la_rawData);
        if (la_formatedData.file_errors.length > 0) {
            throw new Error(la_formatedData.file_errors.join('\n'));
        }
        la_formatedData.final_update_arr.forEach(async(lo_question) => {
            // have to do this becuse of the count save in category
            await createQuestion(lo_question);
        });
        // await addBulkQuestion(la_formatedData.final_update_arr);
        successResponse(res, "Question Added Successfully");
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}
export const getAllQuestionsForCategory = async(req, res, next) => {
    try {
        const la_questionList = await listOfQuestionsForCategory(req.query);
        let ls_messsage = "No Question Found";
        if (la_questionList.length > 0) {
            ls_messsage = "Question Listing";
        }
        successResponse(res, ls_messsage, la_questionList);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}