import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import dotenv from 'dotenv';
import appointmentRoutes from './routes/AppointmentRoute.js';
import errorHandler from './middleware/error.js';
import taskRoutes from './routes/taskRoutes.js';
import studentdashboardRoutes from './routes/studentdashboardRoutes.js';
import slotRoutes from './routes/slotRoute.js';
import { cleanupFile } from './middleware/fileUpload.js';
import fs  from 'fs';
import testRoutes from './routes/slotRoute.js';
import protectedRoute from './routes/protectedRoute.js';
import { upload } from './middleware/fileUpload.js';
import HistoryRoute from './routes/HistoryRoute.js';
import analytics from './routes/analytics.js'



dotenv.config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("REFRESH_SECRET:", process.env.REFRESH_SECRET);

const app = express();


app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
if (!fs.cleanupFile) {
  fs.cleanupFile = cleanupFile;
}



app.use('/uploads', express.static('uploads'));

connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/studentdashboard', studentdashboardRoutes);
app.use('/api/slot', slotRoutes);
app.use('/api/history', HistoryRoute);
app.use('/api/analytics', analytics);
app.use(errorHandler);
app.use('/api', testRoutes);
app.use('/api', protectedRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));