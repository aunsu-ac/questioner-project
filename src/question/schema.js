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
export const getQuestionById = async(id) => {
    return await QuestionModel.findById(id);
}
export const addBulkQuestion = async(la_questionData) => {
    const la_question = await QuestionModel.insertMany(la_questionData);
    return la_question;
}