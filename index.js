import compression from 'compression';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { listen, loadDatabase, loadModularRoutes } from './bootstrap/index.js';
import { errorHandler } from './utility/index.js';
import { configDotenv } from 'dotenv';

configDotenv();

const main = async() => {

    const app = express();
    app.use(compression());
    app.use(cors());
    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(fileUpload());
    await loadDatabase(app);

    await loadModularRoutes(app);
    app.use(errorHandler)

    await listen(app);
}

main().then(r => {});