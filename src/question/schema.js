'use strict';
import mongoose from "mongoose";
import { updateCategoryCount } from "../question-category/schema.js";

const questionSchema = new mongoose.Schema({
    question_title: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: async function(question_title) {
                const question = await mongoose.model("Question").findOne({
                    question_title: question_title.trim()
                });
                return !question;
            },
            message: "Question Title must be unique",
        },
        index: true,
    },
    category_ids: {
        type: [{
            type: mongoose.Schema.ObjectId,
            ref: "QuestionCategory",
            trim: true,
        }, ],
        validate: [{
                validator: function(category_ids) {
                    return category_ids && category_ids.length > 0;
                },
                message: "At least one Question Category is required",
            },
            {
                validator: async function(category_ids) {
                    const questioncategoryCount = await mongoose
                        .model("QuestionCategory")
                        .countDocuments({
                            _id: { $in: category_ids },
                        });
                    return questioncategoryCount === category_ids.length;
                },
                message: "One or more selected Question Category do not exist",
            },
        ],
    },
    answers: [{
        type: String,
        required: true,
        trim: true,
    }],
    valid_answer: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(valid_answer) {
                return this.answers.includes(valid_answer.trim());
            },
            message: "Valid Answer should be one of the answers",
        },
    }
}, {
    versionKey: false,
    timestamps: true,
    collection: 'question',
});

questionSchema.index({ question_title: 1 }, { unique: true });

const QuestionModel = mongoose.model('Question', questionSchema);


export const createQuestion = async(lo_questionData) => {
    const lo_question = await QuestionModel.create(lo_questionData);
    updateCategoryCount(lo_question.category_ids);
    return lo_question;
}
export const listOfQuestionsForCategory = async(lo_queryParams) => {
    let { category_id = '', text = '', page = 1, limit = 10 } = lo_queryParams;

    text = text.trim() || "";
    limit = Math.min(parseInt(limit), 50);
    let skip = (parseInt(page) - 1) * limit;

    let lo_sort = {
        createdAt: -1,
    };

    let lo_filterData = {};

    if (category_id != "") {
        lo_filterData = {
            ...lo_filterData,
            category_ids: new mongoose.Types.ObjectId(category_id)
        };
    }

    if (text != "") {
        lo_filterData = {
            ...lo_filterData,
            question_title: { $regex: `${text}`, $options: "i" }
        };
    }
    const li_totalRecords = await QuestionModel.countDocuments(lo_filterData)
    let li_totalPages = Math.ceil(li_totalRecords / limit);

    const la_questionList = await QuestionModel.aggregate([
        { $match: lo_filterData },
        {
            $lookup: {
                from: 'question',
                localField: "_id",
                foreignField: "category_ids",
                as: "question_list"
            }
        }, { $sort: lo_sort },
        {
            $project: {
                _id: 1,
                category_name: 1,
                question_count: 1,
                question_count_by_size: { $size: "$question_list" },
                question_list: {
                    _id: 1,
                    question_title: 1,
                    answers: 1
                }
            }

        },
        { $skip: skip }, { $limit: limit }
    ]);
    return {
        question_list: la_questionList,
        pagination: {
            total_pages: li_totalPages,
            total_records: li_totalRecords,
            current_page: page,
            limit: limit
        }
    }
}
export const getQuestionById = async(id) => {
    return await QuestionModel.findById(id);
}
export const addBulkQuestion = async(la_questionData) => {
    const la_question = await QuestionModel.insertMany(la_questionData);
    return la_question;
}