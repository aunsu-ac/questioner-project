'use strict';

import { successResponse } from "../../utility/index.js";
import { getAllCategory, createCategory } from "./schema.js";

export const getAllCategoryListWithCount = async(req, res, next) => {
    try {
        const la_vendor = await getAllCategory(req.query);
        let ls_messsage = "No Category Found";
        if (la_vendor.category_list.length > 0) {
            ls_messsage = "Category Listing";
        }

        successResponse(res, ls_messsage, la_vendor);
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