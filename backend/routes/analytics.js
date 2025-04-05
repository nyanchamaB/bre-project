import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Task from '../models/Task.js';
import mongoose from "mongoose";
import express from 'express';

const router = express.Router();


router.get('/student', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get appointment statistics
        const appointments = await Appointment.find({ studentId: userId });
        const totalAppointments = appointments.length;

        // Calculate response times
        const responseTimes = appointments.map(apt => {
            return (new Date(apt.updatedAt) - new Date(apt.createdAt)) / (1000 * 60 * 60);
        });
        const avgResponseTime = responseTimes.length ? 
            (responseTimes.reduce((a, b) => a + b) / responseTimes.length).toFixed(1) : 0;
            const tasks = await Task.find({ studentId: userId });
            const taskStats = {
                completed: tasks.filter(t => t.status === 'completed').length,
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length
            };
    
            // Format task data for chart
            const taskChartData = Object.entries(taskStats).map(([status, count]) => ({
                status,
                count
            }));
    
            res.json({
                tasks: taskChartData,
                totalAppointments,
                avgResponseTime
            });
    
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

export default router;



