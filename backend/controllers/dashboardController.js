import Task from '../models/Task.js';
import Appointment from '../models/Appointment.js';

export const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get all statistics in parallel
    const [totalTasks, pendingTasks, taskHistory, upcomingAppointments] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'submitted' }),
      Appointment.countDocuments({
        userId,
        date: { $gte: new Date() }
      })
    ]);

    res.json({
      totalTasks,
      pendingTasks,
      taskHistory,
      upcomingAppointments
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};