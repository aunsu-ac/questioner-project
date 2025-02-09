import { body } from "express-validator";


// export const loginStepOneSchema = [
//     body('phone_number').trim().not().isEmpty().withMessage('Phone Number is required').custom((value) => {
//         const phoneRegex = /^\d{10}$/; // Regular expression for 10-digit phone number
//         if (!phoneRegex.test(value)) {
//             throw new Error('Invalid phone number');
//         }
//         return true;
//     })
// ]


// export const loginStepTwoSchema = [
//     body('phone_number').trim().not().isEmpty().withMessage('Phone Number is required').custom((value) => {
//         const phoneRegex = /^\d{10}$/; // Regular expression for 10-digit phone number
//         if (!phoneRegex.test(value)) {
//             throw new Error('Invalid phone number');
//         }
//         return true;
//     }),
//     body('otp').trim().not().isEmpty().withMessage('OTP is required')
// ]

export const loginSchemaUser = [
    body('email').trim().not().isEmpty().withMessage('Email is required').isEmail().withMessage("Invalid email").toLowerCase(),
    body('password').trim().not().isEmpty().withMessage('password is required')
]

export const registerSchemaUser = [
    body('email').trim().not().isEmpty().withMessage('Email is required').isEmail().withMessage("Invalid email").toLowerCase(),
    body('name').trim().not().isEmpty().withMessage('User Name is required'),
    body('password').trim().not().isEmpty().withMessage('password is required')
]

export const verifyEmailOTPSchemaUser = [
    body('email').trim().not().isEmpty().withMessage('Email is required').isEmail().withMessage("Invalid email").toLowerCase(),
    body('otp').trim().not().isEmpty().withMessage('OTP is required')
]

export const resendOTPSchemaUser = [
    body('email').trim().not().isEmpty().withMessage('Email is required').isEmail().withMessage("Invalid email").toLowerCase()
]