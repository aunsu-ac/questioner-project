'use strict';

import { userLogin, addNewUser, resendOTPForExistingUser, verifyOtpAndSubmit } from "./schema.js";
import { successResponse } from "../../utility/index.js";


export const registerUser = async(req, res, next) => {
    try {
        const lo_user = await addNewUser(req.body);
        successResponse(res, 'Successfully registered, A verification OTP has been sent to your email address. Please check your inbox.', lo_user);
    } catch (e) {
        next(e)
    }
}

export const resendUserRegistrationOTP = async(req, res, next) => {
    try {
        const lo_user = await resendOTPForExistingUser(req.body);
        successResponse(res, 'A verification OTP has been sent to your email address. Please check your inbox.', lo_user);
    } catch (e) {
        next(e)
    }
}
export const verifyEmailOtp = async(req, res, next) => {
    try {
        const lo_user = await verifyOtpAndSubmit(req.body);
        successResponse(res, 'Verification Successfull, Try Login.', lo_user);
    } catch (e) {
        next(e)
    }
}
export const login = async(req, res, next) => {
    try {
        let body = req.body;
        const data = await userLogin(body);
        successResponse(res, "Succesfully Logged In", data);
    } catch (e) {
        next(e)
    }
}