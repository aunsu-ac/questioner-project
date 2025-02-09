'use strict';

import express from 'express';

import { expressValidate } from '../middlewares/index.js';
import { registerUser, resendUserRegistrationOTP, verifyEmailOtp, login, } from './controller.js';
import { loginSchemaUser, registerSchemaUser, resendOTPSchemaUser, verifyEmailOTPSchemaUser } from './middleware.js';

const router = express.Router();
router.post('/register', registerSchemaUser, expressValidate, registerUser);
router.post('/resend-otp', resendOTPSchemaUser, expressValidate, resendUserRegistrationOTP);
router.post('/verify-otp', verifyEmailOTPSchemaUser, expressValidate, verifyEmailOtp);
router.post('/login', loginSchemaUser, expressValidate, login);

export default router;