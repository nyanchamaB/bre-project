import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/book', async (req, res) => {
  try {
      const { slotId, userId, date, title, description } = req.body;

      if (!slotId || !userId || !date || !title || !description) {
          return res.status(400).json({ message: "All fields are required" });
      }

      const existingAppointment = await Appointment.findOne({ slotId });
      if (existingAppointment) {
          return res.status(400).json({ message: "Slot is already booked" });
      }

      const appointment = new Appointment({
          slotId,
          user: userId,  
          date,
          title,
          description
      });

      await appointment.save();
      res.status(201).json({ message: "Appointment booked successfully", appointment });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
  }
});

router.get('/student/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      const { email } = req.query;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({
              success: false,
              message: 'Invalid user ID format'
          });
      }

      const query = { user: userId };
      console.log('Base query:', query); // Log the base query

      if (email) {
          query['slotId.userId.email'] = email;
          console.log('Query with email filter:', query); // Log the updated query
      }

      // Log the exact query before execution
      console.log('Final query to MongoDB:', JSON.stringify(query));

      // First check if the user exists
      const userExists = await mongoose.model('User').findById(userId).lean();
      console.log('User exists:', !!userExists);

      // Check if any appointments exist for this user without population
      const appointmentCount = await Appointment.countDocuments({ user: userId });
      console.log('Raw appointment count for user:', appointmentCount);

      const appointments = await Appointment.find(query)
          .populate({
              path: 'slotId',
              model: 'Slot',
              populate: {
                  path: 'userId',
                  model: 'User',
                  select: 'fullname email department'
              }
          })
          .sort({ date: 1 })
          .lean();

      console.log('Appointments after population:', appointments.length);


      // Transform the data to include all required fields
      const formattedAppointments = appointments.map(apt => ({
          _id: apt._id,
          date: apt.date,
          startTime: apt.slotId?.startTime || 'Not specified',
          endTime: apt.slotId?.endTime || 'Not specified',
          location: apt.slotId?.location || 'Not specified',
          title: apt.title || 'Appointment',
          description: apt.description,
          status: apt.status || 'pending',
          lecturer: {
              name: apt.slotId?.userId?.fullname || 'Unknown Lecturer',
              email: apt.slotId?.userId?.email || 'No email provided',
              department: apt.slotId?.userId?.department || 'Not specified'
          }
      }));

      return res.status(200).json({
          success: true,
          data: formattedAppointments,
          message: appointments.length ? 'Appointments found' : 'No appointments found'
      });

  } catch (error) {
      console.error('Appointment fetch error:', error);
      return res.status(500).json({
          success: false,
          message: 'Failed to fetch appointments',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
});



router.get('/lecturer/view', async (req, res) => {
  try {
    const { userId } = req.params;
    const appointments = await Appointment.find({ userId })
      .populate('user', 'fullname email');

    if (!appointments.length) {
      return res.status(404).json({ message: "No appointments found for this user" });
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/lecturer/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const appointments = await Appointment.find({})
            .populate({
                path: 'user', 
                model: 'User',
                select: 'fullname email'
            })
            .populate({
                path: 'slotId',
                model: 'Slot',
                populate: {
                    path: 'userId', 
                    model: 'User',
                    select: 'startTime endTime location' 

                }
            });

        const filteredAppointments = appointments.filter(apt => apt.slotId?.userId?._id.toString() === userId);

        if (!filteredAppointments.length) {
            return res.status(404).json({ message: "No appointments found for this lecturer" });
        }

        res.status(200).json(filteredAppointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});




router.delete('/cancel/:appointmentId', async (req, res) => {
  try {
      const { appointmentId } = req.params;

      const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId);

      if (!deletedAppointment) {
          return res.status(404).json({ message: "Appointment not found" });
      }

      res.status(200).json({ message: "Appointment canceled successfully" });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
});


router.put('/reschedule/:appointmentId', async (req, res) => {
  try {
      const { appointmentId } = req.params;
      const { newSlotId } = req.body;

      const existingAppointment = await Appointment.findOne({ slotId: newSlotId });
      if (existingAppointment) {
          return res.status(400).json({ message: "New slot is already booked" });
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          { slotId: newSlotId },
          { new: true }
      );

      if (!updatedAppointment) {
          return res.status(404).json({ message: "Appointment not found" });
      }

      res.status(200).json({ message: "Appointment rescheduled successfully", updatedAppointment });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
});

router.put('/approve/:appointmentId', async (req, res) => {
  try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
      }

      if (appointment.status === "approved") {
          return res.status(400).json({ message: "Appointment is already approved" });
      }

      appointment.status = "approved";
      await appointment.save();

      res.status(200).json({ message: "Appointment approved successfully", appointment });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
});


router.get('/analytics/student/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    const timeframe = req.query.timeframe || 'week'; // Options: 'day', 'week', 'month'
    
    // Verify user authorization
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access this data" });
    }

    // Get current date and start of timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 7); // Last 7 days
        break;
      case 'week':
        startDate.setDate(now.getDate() - 28); // Last 4 weeks
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 6); // Last 6 months
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get appointment statistics by status
    const appointmentStats = await Appointment.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          appointmentDate: { $gte: startDate }
        }
      },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily/weekly trends
    const timeStats = await Appointment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          appointmentDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$appointmentDate" },
            month: { $month: "$appointmentDate" },
            day: { $dayOfMonth: "$appointmentDate" },
            week: { $week: "$appointmentDate" }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          canceled: {
            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          completed: 1,
          canceled: 1,
          date: {
            $dateFromParts: {
              'year': '$_id.year',
              'month': '$_id.month',
              'day': '$_id.day'
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get lecturer statistics
    const lecturerStats = await Appointment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          appointmentDate: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'slots',
          localField: 'slotId',
          foreignField: '_id',
          as: 'slot'
        }
      },
      {
        $unwind: '$slot'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'slot.userId',
          foreignField: '_id',
          as: 'lecturer'
        }
      },
      {
        $unwind: '$lecturer'
      },
      {
        $group: {
          _id: '$lecturer._id',
          lecturerName: { $first: '$lecturer.fullname' },
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          canceledAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] }
          }
        }
      }
    ]);

    // Format time-based stats based on timeframe
    const formattedTimeStats = timeStats.map(stat => ({
      date: stat.date,
      week: stat._id.week,
      total: stat.count,
      completed: stat.completed,
      canceled: stat.canceled,
      pending: stat.count - (stat.completed + stat.canceled)
    }));

    res.json({
      success: true,
      timeframe,
      data: {
        appointmentStats,
        timeStats: formattedTimeStats,
        lecturerStats
      }
    });

  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({ message: "Error retrieving appointment analytics" });
  }
});


router.get('/analytics/lecturer/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify lecturer authorization
    if (req.user.id !== userId || req.user.role !== 'lecturer') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to access this data" 
      });
    }

    // Get overview stats
    const overview = await Appointment.aggregate([
      {
        $match: { 
          lecturerId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          canceled: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get status distribution
    const statusDistribution = await Appointment.aggregate([
      {
        $match: { 
          lecturerId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get weekly stats
    const weeklyStats = await Appointment.aggregate([
      {
        $match: { 
          lecturerId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: { 
            week: { $week: '$startTime' },
            year: { $year: '$startTime' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { 
          '_id.year': 1,
          '_id.week': 1
        }
      }
    ]);

    // Get popular time slots
    const popularSlots = await Appointment.aggregate([
      {
        $match: { 
          lecturerId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$startTime' },
            minute: { $minute: '$startTime' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          timeSlot: {
            $concat: [
              { $toString: '$_id.hour' },
              ':',
              {
                $cond: {
                  if: { $lt: ['$_id.minute', 10] },
                  then: { $concat: ['0', { $toString: '$_id.minute' }] },
                  else: { $toString: '$_id.minute' }
                }
              }
            ]
          },
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: overview[0] || {
          total: 0,
          completed: 0,
          canceled: 0
        },
        statusDistribution,
        weeklyStats,
        popularSlots
      }
    });

  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({
      success: false,
      message: "Error retrieving appointment analytics"
    });
  }
});

export default router;
