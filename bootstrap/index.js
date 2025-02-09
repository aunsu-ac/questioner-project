'use strict';

import * as database from '../database/index.js';
import mainApplication from '../src/index.js';
import { configDotenv } from 'dotenv';

configDotenv();

const loadModularRoutes = async(app) => new Promise((resolve, reject) => {
    console.log('Modular Routes Loaded');
    app.use('/', mainApplication);
    resolve(app);
});

const loadDatabase = async(app) => new Promise((resolve, reject) => {
    const logger = app.get('logger');
    database.connect().then(status => {
        console.log('Database Loaded');
        resolve(status);
    }, err => {
        logger.error(err.message);
        console.log(err.message);
        reject(err);
    });
});

const listen = async(app) => new Promise((resolve, reject) => {
    const PORT = process.env.PORT;

    app.listen(PORT, () => {
        console.log('Application started on port ' + PORT);
        resolve(app)
    }).on('error', err => {
        process.once("SIGUSR2", async() => {
            process.kill(process.pid, "SIGUSR2");
            await listen()
        });
        process.on("SIGINT", async() => {
            // this is only called on ctrl+c, not restart
            process.kill(process.pid, "SIGINT");
            await listen()
        });
        console.log(err.message);
        reject(err);
    });
});

export { loadModularRoutes, loadDatabase, listen };