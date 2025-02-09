'use strict';
import mongoose from "mongoose";
import { getQuestionById } from "../question/schema.js";

const submissionHistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
        validate: [{
            validator: async function(user_id) {
                const lb_userExists = await mongoose.model("User").exists({ _id: user_id, status: "A" });
                return !!lb_userExists;
            },
            message: "Invalid user. The user does not exist.",
        }],
    },
    question_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: [true, "Question is required"],
        immutable: true,
        validate: {
            validator: async function(question_id) {
                const lb_questionExists = await mongoose.model("Question").countDocuments({ _id: question_id });
                return !!lb_questionExists;
            },
            message: "Invalid question. The question does not exist.",
        },
    },
    given_answer: {
        type: String,
        required: [true, "Answer is required"],
        trim: true,
        immutable: true,
    },
    is_correct: {
        type: Boolean,
        default: false,
        immutable: true,
    },
    submission_date: {
        type: Date,
        required: true,
    },
}, {
    versionKey: false,
    timestamps: true,
    collection: 'submission_history',
});

const SubmissionHistoryModel = mongoose.model('SubmissionHistory', submissionHistorySchema);

export const saveAnswer = async(lo_submittionData, lo_user) => {
    const { submittion_answers = [], given_answer = '', question_id = '' } = lo_submittionData;

    // if (submittion_answers.isArray() && submittion_answers.length > 0) {

    //     const la_submittedAnswer = submittion_answers.map((lo_answer) => {
    //         return {
    //             ...lo_answer,
    //             user_id: lo_user._id,
    //             submission_date: moment().toDate()
    //         }
    //     });
    //     await SubmissionHistoryModel.insertMany(la_submittedAnswer);
    // }



    const li_existingSubmission = await SubmissionHistoryModel.countDocuments({
        user_id: new mongoose.Types.ObjectId(lo_submittionData.user_id),
        question_id: new mongoose.Types.ObjectId(question_id),
    });

    if (li_existingSubmission > 0) {
        throw new Error("You already submitted an answer for this question.");
    }

    const lo_questionData = await getQuestionById(question_id);
    if (lo_questionData.valid_answer.trim() === given_answer.trim()) {
        lo_submittionData.is_correct = true;
    }

    const lo_question = await SubmissionHistoryModel.create(lo_submittionData);
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
                    answers: 1,
                    valid_answer: 1
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