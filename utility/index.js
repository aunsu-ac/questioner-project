import jwt from 'jsonwebtoken';
import crypto from "crypto";
const password_salt = "kYse3A1@";
const jwt_expiry = '120d';
export const otp_expiry = 120;
export const otp_resend = 30;
export const max_otp_attempt_count = 5;
const request_block_time_after_max_attempt = 900;
const genarateRandomeNumber = (min, max) => {
    const li_randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return li_randomNumber;
};


export const errorHandler = (error, req, res, next) => {

    console.log(`error ${error.message}`); // log the error

    const status = error.status || 400;

    const ls_err = error.message;
    if (typeof ls_err === "string") {
        const ls_errFormated = ls_err.toLowerCase();
        if (ls_errFormated.includes("validation")) {
            const la_err = ls_err.split(", ");
            const la_newErr = la_err.map((err, index) => {
                const [key, value] = err.split(": ").slice(index === 0 ? 1 : 0);
                /*  return {
                        [key.trim()]: value.trim()
                        }; */
                return {
                    key: key,
                    value: value,
                };
            });
            res.status(status).json({ error: la_newErr });
        } else {
            res.status(status).json({ error: ls_err });
        }
    } else {
        res.status(status).json({ error: error.message });
    }
};

export const errorResponse = (res, message, status = 400) => {
    const ls_err = message;
    if (typeof ls_err === "string") {
        const ls_errFormated = ls_err.toLowerCase();
        if (ls_errFormated.includes("validation")) {
            const la_err = ls_err.split(", ");

            const la_newErr = la_err.map((err, index) => {
                const [key, value] = err.split(": ").slice(index === 0 ? 1 : 0);
                /*  return {
                        [key.trim()]: value.trim()
                        }; */
                return {
                    key: key.trim(),
                    value: value.trim(),
                };
            });
            res.status(status).json({ error: la_newErr });
        } else {
            res.status(status).json({ error: ls_err });
        }
    } else {
        res.status(status).json({ error: message });
    }
};


export const successResponse = (res, message = '', data = [], status = 200) => {
    res.status(status).json({ 'message': message, 'data': data });
}

export const encrypt = (ls_content) => {
    const ls_algorithm = 'aes-256-cbc';
    const lhex_key = crypto.scryptSync(password_salt, 'salt', 32);
    const lhex_iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ls_algorithm, lhex_key, lhex_iv);
    const lhex_encrypted = Buffer.concat([cipher.update(ls_content, 'utf8'), cipher.final()]);
    return `${lhex_iv.toString('hex')}:${lhex_encrypted.toString('hex')}`;
};

export const decrypt = (ls_encryptedContent) => {
    const [lhex_ivHex, lhex_encrypted] = ls_encryptedContent.split(':');
    const lhex_iv = Buffer.from(lhex_ivHex, 'hex');
    const lhex_key = crypto.scryptSync(password_salt, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', lhex_key, lhex_iv);
    const ls_decrypted = Buffer.concat([decipher.update(Buffer.from(lhex_encrypted, 'hex')), decipher.final()]);
    return ls_decrypted.toString('utf8');
};

export const generateJwt = (data) => {
    return jwt.sign(data, password_salt, { expiresIn: jwt_expiry });
}

export const verifyJwtToken = (token) => {
    return jwt.verify(token, password_salt);
}

export const generateOtpNew = async(ls_attemptCount, ls_otpFor = "") => {
    const li_attemptCount = parseInt(ls_attemptCount);
    const li_newAttemptCount = li_attemptCount + 1;
    let li_otp = genarateRandomeNumber(1111, 9999);

    let today = new Date();
    let expiresIn = new Date(
        new Date().setSeconds(today.getSeconds() + otp_expiry)
    );
    let resendIn = new Date(
        new Date().setSeconds(today.getSeconds() + otp_resend)
    );

    let lo_otp = {
        value: li_otp.toString(),
        expiry_datetime: expiresIn,
        resend_datetime: resendIn,
        attempt_count: li_newAttemptCount,
    };

    if (lo_otp.attempt_count == max_otp_attempt_count) {
        let requestOpeningTime = new Date(
            new Date().setSeconds(
                today.getSeconds() + request_block_time_after_max_attempt
            )
        );

        lo_otp = {
            ...lo_otp,
            block_datetime: requestOpeningTime,
        };
    }

    return lo_otp;
};