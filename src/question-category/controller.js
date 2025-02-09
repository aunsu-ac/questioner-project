'use strict';

import { successResponse } from "../../utility/index.js";
import { getAllCategory, createCategory, categoryWiseQuestionList } from "./schema.js";

export const getAllCategoryListWithCount = async(req, res, next) => {
    try {
        const la_categoryList = await getAllCategory(req.query);
        let ls_messsage = "No Category Found";
        if (la_categoryList.category_list.length > 0) {
            ls_messsage = "Category Listing";
        }

        successResponse(res, ls_messsage, la_categoryList);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
};

export const addCategory = async(req, res, next) => {
    try {
        const lo_category = await createCategory(req.body);
        successResponse(res, "Category Added Successfully", lo_category);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}
export const getAllQuestionsForCategory = async(req, res, next) => {
    try {
        const la_categoryWiseQuestionList = await categoryWiseQuestionList(req.query);
        let ls_messsage = "No Category Found";
        if (la_categoryWiseQuestionList.length > 0) {
            ls_messsage = "Category wise Question Listing";
        }
        successResponse(res, ls_messsage, la_categoryWiseQuestionList);
    } catch (e) {
        console.log("e", e);
        next(e);
    }
}