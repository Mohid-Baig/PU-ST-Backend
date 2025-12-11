import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { logger } from './middleware/logger.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import userRoutes from './routes/User.js';
import issuesRoutes from './routes/IssuesRoute.js';
import LostFoundRoute from './routes/LostFoundRoute.js';
import feedbackRoutes from './routes/FeedBackRoute.js';
import helpboardRoutes from './routes/HelpBoardRoute.js';
import votepollRoutes from './routes/pollRoutes.js';
import anonymousRoutes from './routes/anonymousRoute.js';
import eventRoutes from './routes/eventnotificationRoute.js';
import basicAuth from 'express-basic-auth';
import { autoCloseExpiredPolls } from './config/pollcron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const SWAGGER_USERNAME = process.env.SWAGGER_USERNAME;
const SWAGGER_PASSWORD = process.env.SWAGGER_PASSWORD;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://uni-smart-tracker.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/puTracker-api-docs',
    (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    },
    basicAuth({
        users: { [SWAGGER_USERNAME]: SWAGGER_PASSWORD },
        challenge: true,
        unauthorizedResponse: 'Access denied - Please login again',
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use(logger);
app.use('/api/auth', userRoutes);
app.use('/api/report', issuesRoutes);
app.use('/api/lostfound', LostFoundRoute);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/helpboard', helpboardRoutes);
app.use('/api/polls', votepollRoutes);
app.use('/api/anonymous', anonymousRoutes);
app.use('/api/events', eventRoutes);
setInterval(autoCloseExpiredPolls, 60 * 1000);
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();