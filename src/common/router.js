'use strict';

import express from 'express';
import { user_authorization } from '../middlewares/index.js';
import { logout, myProfile, updateProfile, tempFileUpload } from './controller.js';
const router = express.Router();

router.post('/logout', user_authorization([]), logout);
router.get('/my-profile', user_authorization([]), myProfile);
router.patch('/update-profile', user_authorization([]), updateProfile);
router.post('/temp-file-upload', user_authorization([]), tempFileUpload);

export default router;