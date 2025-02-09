import jwt from 'jsonwebtoken';
import crypto from "crypto";
import hbs from "nodemailer-express-handlebars";
import nodemailer from "nodemailer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { getCategoryIdsByNames } from '../src/question-category/schema.js';
const __dirname = path.resolve();

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

export const generateOtpNew = async(ls_attemptCount) => {
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

const getSmtpTransport = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
        },
    });
    return transporter;
};

export const sendEmail = async(lo_data, layout = "template") => {
    const options = {
        viewEngine: {
            extname: ".hbs",
            layoutsDir: "views/email/",
            defaultLayout: layout,
        },
        viewPath: "views/email/",
        extName: ".hbs",
    };

    const smtpTransport = getSmtpTransport();
    smtpTransport.use("compile", hbs(options));

    const lo_templateDetails = {
        template_subject: "Your Email Vrification OTP is [otp]",
        template_body: "Dear [user_name], Your Email Verification OTP is [otp]"
    };

    const ls_dynamicEmailSubject = getDynamicContentFromTemplate(lo_templateDetails.template_subject, lo_data);
    const ls_dynamicEmailBody = getDynamicContentFromTemplate(lo_templateDetails.template_body, lo_data);
    const tempContext = {};
    tempContext.email_body = ls_dynamicEmailBody;

    const ls_senderEmail = `<${process.env.EMAIL_FORM_EMAIL}>`;
    const ls_senderName = `${process.env.EMAIL_FORM_NAME}`;

    let ls_emailFrom = `${ls_senderName} ${ls_senderEmail}`;

    const mailOptions = {
        template: layout,
        from: ls_emailFrom,
        to: lo_data.email,
        subject: ls_dynamicEmailSubject,
        context: tempContext,
    };

    const result = await smtpTransport.sendMail(mailOptions);
    return result;
};

export const getDynamicContentFromTemplate = (emailTemplateString, mailData) => {
    var str = emailTemplateString.toString();
    var userData = JSON.parse(JSON.stringify(mailData));
    for (let key in userData) {
        const placeholder = "[" + key + "]";
        str = str.split(placeholder).join(userData[key]);
    }
    return str;
};
export const convertCsvToJson = async(ls_filePath = "") => {
    const la_dataArray = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(ls_filePath).pipe(csv())
            .on("data", (row) => la_dataArray.push(row))
            .on("end", () => resolve(la_dataArray))
            .on("error", (err) => reject(err));
    });
    return la_dataArray;
}
export const updateKeyName = async(la_rawData) => {
    const la_requiredCSVKeys = ["Question*", "Category ('|' pipe seperated)*", "Answers ('|' pipe seperated)*", "Valid Answer*"];
    const la_fileErrors = [];
    const la_updatedData = [];

    for (let index = 0; index < la_rawData.length; index++) {
        const item = la_rawData[index];
        const la_missingFields = la_requiredCSVKeys.filter(field => !item[field]);

        if (la_missingFields.length > 0) {
            la_fileErrors.push(`At row ${index + 2} ${la_missingFields.join(', ')} is required`.replaceAll('*', ''));
            continue;
        }

        const la_categoryNames = item[la_requiredCSVKeys[1]].split('|');
        const la_answers = item[la_requiredCSVKeys[2]].split('|');
        const la_categoryIds = await getCategoryIdsByNames(la_categoryNames);

        if (la_categoryNames.length === la_categoryIds.length && la_categoryIds.length > 0) {
            la_updatedData.push({
                question_title: item["Question*"],
                category_ids: la_categoryIds,
                answers: la_answers.map((answer) => answer.trim()),
                valid_answer: item["Valid Answer*"],
            });
        } else {
            la_fileErrors.push(`At row ${index + 2}, one or multiple categories are not recognized within our system.`);
        }
    }
    return {
        final_update_arr: la_updatedData,
        file_errors: la_fileErrors
    };
}