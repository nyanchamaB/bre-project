import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import * as dotenv from 'dotenv';
import appointmentRoutes from './routes/AppointmentRoute.js';
import errorHandler from './middleware/error.js';

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

// Connecting to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));