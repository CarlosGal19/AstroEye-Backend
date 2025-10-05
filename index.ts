import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';

import categoriesRouter from './src/routes/category.routes.js';
import sitesRouter from './src/routes/sites.routes.js';
import imagesRouter from './src/routes/images.routes.js';
import pointsRouter from './src/routes/points.routes.js';

const app = express();

configDotenv();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use('/categories', categoriesRouter);
app.use('/sites', sitesRouter);
app.use('/images', imagesRouter);
app.use('/points', pointsRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
