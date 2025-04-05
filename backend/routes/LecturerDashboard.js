import express from 'express';
import auth from '../middleware/auth.js';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js';
import Appointment from '../models/Appointment.js';
import Grade from '../models/Grade.js';

const router = express.Router();

router.get('/:userId/dashboard', auth, async (req, res) => {
    try {
      const recentActivities = await Activity.find({ lecturerId: req.user.id })
        .sort({ timestamp: -1 })
        .limit(4);
  
      const pendingFeedback = await Task.find({
        lecturerId: req.user.id,
        status: 'submitted'
      }).limit(4);
  
      const appointments = await Appointment.find({
        lecturerId: req.user.id,
        date: { $gte: new Date() }
      }).sort({ date: 1 }).limit(4);
  
      const studentProgress = await Grade.aggregate([
        { $match: { lecturerId: req.user.id } },
        { $group: {
          _id: '$studentId',
          averageGrade: { $avg: '$grade' }
        }},
        { $limit: 4 }
      ]);
  
      res.json({
        recentActivities,
        pendingFeedback,
        appointments,
        studentProgress
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });