'use strict';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { getUserById } from '../user/schema.js';
const { Schema } = mongoose;
const AuthTokenSchema = new Schema({
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['user'],
        required: true
    },
    user_id: {
        type: ObjectId,
        required: function() { return this.type === 'user' }
    },
}, { timestamps: true });

const AuthTokenModel = mongoose.model('auth_tokens', AuthTokenSchema)

export const saveAuthToken = async(token, type, id) => {
    const ls_type = type + "_id";
    await AuthTokenModel.create({ token, type, [ls_type]: id });
}

export const verifyAndGetUser = async(token, type = []) => {
    const lo_tokenDetails = await AuthTokenModel.findOne({ token });

    if (!lo_tokenDetails)
        throw Error("Access Denied!")

    const lb_condition = type.includes(lo_tokenDetails.type) || type.length == 0;

    if (lo_tokenDetails.type == 'user' && lo_tokenDetails.user_id && lb_condition) {
        const user = await getUserById(lo_tokenDetails.user_id);
        if (!user || user?.status != 'A') { throw Error("Access Denied!") }
        let user_new = {...user, user_type: lo_tokenDetails.type }
        return user_new;
    }
    throw Error("Access Denied!")
}

export const deleteToken = async(token) => {
    try {
        const result = await AuthTokenModel.findOneAndRemove({ token: token }, { useFindAndModify: false });
        return result;
    } catch (e) {
        throw new Error(e);
    }

}