'use strict';

import express from 'express';
const router = express.Router();
import auth_tokens from './auth_tokens/index.js';
import user from './user/index.js';
import common from './common/index.js';
import questionCategory from './question-category/index.js';
import question from './question/index.js';
import submissionHistory from './submission-history/index.js';



router.use('/auth-tokens', auth_tokens);
router.use('/user', user);
router.use('/common', common);
router.use('/question-category', questionCategory);
router.use('/question', question);
router.use('/submission-history', submissionHistory);

export default router;