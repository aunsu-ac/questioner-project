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

export const getAllSubmitedAnswers = async(lo_queryParams) => {
    let { text = '', page = 1, limit = 10 } = lo_queryParams;

    text = text.trim() || "";
    limit = Math.min(parseInt(limit), 50);
    let skip = (parseInt(page) - 1) * limit;

    let lo_filterData = {};

    if (text != "") {
        lo_filterData = {
            ...lo_filterData,
            $or: [
                { given_answer: { $regex: `${text}`, $options: "i" } },
                { "question_data.question_title": { $regex: `${text}`, $options: "i" } },
                { "user_data.name": { $regex: `${text}`, $options: "i" } }
            ]
        };
    }

    const li_totalRecords = await getAllSubmitedAnswersData(lo_filterData, [], true)
    let li_totalPages = Math.ceil(li_totalRecords / limit);
    const la_submissionList = await getAllSubmitedAnswersData(lo_filterData, [{ $skip: skip }, { $limit: limit }], false)

    return {
        submited_answer_list: la_submissionList,
        pagination: {
            total_pages: li_totalPages,
            total_records: li_totalRecords,
            current_page: page,
            limit: limit
        }
    }
}

const getAllSubmitedAnswersData = async(lo_filterData, la_paginaionData, lb_count = true) => {
    const la_submissionList = await SubmissionHistoryModel.aggregate([{
        $sort: {
            submission_date: -1
        }
    }, {
        $lookup: {
            from: "question",
            localField: "question_id",
            foreignField: "_id",
            as: "question_data"
        }
    }, {
        $unwind: {
            path: "$question_data",
        }
    }, {
        $lookup: {
            from: "user",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data"
        }
    }, {
        $unwind: {
            path: "$user_data",
        }
    }, { $match: lo_filterData }, {
        $project: {
            _id: 1,
            question_title: "$question_data.question_title",
            user_name: "$user_data.name",
            given_answer: 1,
            submission_date: 1
        }
    }, ...la_paginaionData]);

    if (lb_count) {
        return la_submissionList.length
    }
    return la_submissionList;

}