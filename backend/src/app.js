import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

const allowedOrigins = Array.isArray(env.clientUrl)
  ? env.clientUrl
  : [env.clientUrl];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (env.nodeEnv === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} not allowed by CORS policy`),
        false
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to HR Recruitment Management System API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
