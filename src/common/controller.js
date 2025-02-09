'use strict';

import { errorResponse, successResponse } from "../../utility/index.js";
import { deleteToken } from "../auth_tokens/schema.js";
import { updateUserProfile } from "../user/schema.js";
import fs from 'fs';
import path from 'path';

export const logout = async(req, res, next) => {
    try {
        if (!req.headers.authorization) {
            throw new Error("You Are not a Logged in User")
        }

        const token = req.headers.authorization;
        const lo_tokenDetails = await deleteToken(token)
        if (!lo_tokenDetails) {
            throw new Error('Token not found logout Failed')
        } else {
            successResponse(res, 'Logout Successfull');
        }
    } catch (e) {
        next(e)
    }
}
export const myProfile = async(req, res, next) => {
    const result = req.user;
    successResponse(res, "Profile Details", result);
}
export const tempFileUpload = async(req, res, next) => {
    const userId = req.user._id;
    const userType = req.user.user_type;

    try {
        const __dirname = path.resolve();
        const fileData = req.files.file_data;
        const la_fileName = fileData.name.split('.');
        const ls_fileExt = la_fileName.slice(-1)[0];

        const ls_time = new Date().getTime();
        const ls_onlyfileName = `${userId}_${userType}_${ls_time}`;
        const ls_fullFileName = `${ls_onlyfileName}.${ls_fileExt}`;
        const ls_relativePath = `/public/temp/${ls_fullFileName}`;
        const ls_absolutePath = path.join(__dirname, ls_relativePath);

        fs.writeFile(ls_absolutePath, fileData.data, (err) => {
            if (err) {
                throw new Error('File upload failed');
            }
            successResponse(res, "Successfully Uploaded", ls_fullFileName);
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

export const updateProfile = async(req, res, next) => {
    try {
        const ls_userId = req.user._id;
        const lo_data = {...req.body };
        delete lo_data.status;
        delete lo_data.updatedAt;
        delete lo_data.createdAt;
        delete lo_data.password;
        delete lo_data.email_verify_otp;

        let lo_result = await updateUserProfile(ls_userId, lo_data);

        if (Object.keys(lo_result).length > 0) {
            successResponse(res, 'Profile Updated Successfully.', lo_result);
        }
    } catch (error) {
        next(error);
    }
}

export const unlinkFileFromAws = async(req, res, next) => {
    const filePath = req.body.filePath;
    try {
        if (!filePath || filePath == '') {
            throw new Error("File Path Required.");
        }

        const deleteReturn = await deleteFileFromAWS(filePath);
        successResponse(res, "Successfully Deleted", deleteReturn);
    } catch (error) {
        console.log(error);
        next(error);
    }
}