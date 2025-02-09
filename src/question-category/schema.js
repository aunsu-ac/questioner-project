'use strict';
import mongoose from "mongoose";

const questionCategorySchema = new mongoose.Schema({
    category_name: {
        type: String,
        required: [true, "Category Name is required"],
        validate: {
            validator: async function(category_name) {
                const categoryCount = await mongoose
                    .model("QuestionCategory")
                    .countDocuments({
                        category_name,
                    });
                return categoryCount === 0;
            },
            message: "Category Name already exists",
        },
        unique: true,
        trim: true,
        index: true,
    },
    question_count: {
        type: Number,
        default: 0,
    },
}, {
    versionKey: false,
    timestamps: true,
    collection: 'question_category',
});
questionCategorySchema.index({ category_name: 1 }, { unique: true });

const QuestionCategoryModel = mongoose.model('QuestionCategory', questionCategorySchema);

export const getAllCategory = async(lo_queryParams) => {
    let { text = '', page = 1, limit = 10 } = lo_queryParams;

    text = text.trim() || "";
    limit = Math.min(parseInt(limit), 50);
    let skip = (parseInt(page) - 1) * limit;

    let lo_sort = {
        createdAt: -1,
    };

    let lo_filterData = {};

    if (text != "") {
        lo_filterData = {
            ...lo_filterData,
            category_name: { $regex: `${text}`, $options: "i" }
        };
    }
    const li_totalRecords = await QuestionCategoryModel.countDocuments(lo_filterData)
    let li_totalPages = Math.ceil(li_totalRecords / limit);

    const la_categoryList = await QuestionCategoryModel.aggregate([{
            $match: lo_filterData
        },
        { $sort: lo_sort },
        {
            $project: {
                category_name: 1,
                question_count: 1
            }
        },
        { $skip: skip }, { $limit: limit }
    ]);
    return {
        category_list: la_categoryList,
        pagination: {
            total_pages: li_totalPages,
            total_records: li_totalRecords,
            current_page: page,
            limit: limit
        }
    }
}
export const createCategory = async(lo_categoryData) => {
    const lo_category = await QuestionCategoryModel.create(lo_categoryData);
    return lo_category;
}
export const updateCategoryCount = async(category_ids) => {
    await QuestionCategoryModel.updateMany({
        _id: { $in: category_ids },
    }, {
        $inc: {
            question_count: 1,
        },
    });
};
export const getCategoryIdsByNames = async(la_categoryNames) => {
    const la_category = await QuestionCategoryModel.find({
        category_name: { $in: la_categoryNames }
    }, { _id: 1 });
    const la_categoryIds = la_category.map(category => category._id);
    return la_categoryIds;
}