'use strict';

import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';

configDotenv();

const connect = async () => {
    return new Promise((resolve, reject) => {
        try {
            mongoose.connect(process.env.MONGO_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true
            });
            resolve('success');
        } catch (error) {
            reject(error);
        }
    })

};

export { connect };
