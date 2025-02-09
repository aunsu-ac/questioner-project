import { validationResult } from "express-validator";
import { errorResponse, verifyJwtToken } from "../../utility/index.js";
import { verifyAndGetUser } from "../auth_tokens/schema.js";

export const expressValidate = (req, res, next) => {

    var err = validationResult(req);
    if (!err.isEmpty()) {
        errorResponse(res, err);
    } else {
        next();
    }
}


export const user_authorization = (type = []) => {
    return async(req, res, next) => {
        if (req.headers.authorization) {
            try {
                verifyJwtToken(req.headers.authorization);
                const lo_user = await verifyAndGetUser(req.headers.authorization, type);
                req.user = lo_user;
                next();
            } catch (e) {
                errorResponse(res, "Access Denied", 401);
            }
        } else {
            errorResponse(res, "Access Denied", 401);
        }
    };
}