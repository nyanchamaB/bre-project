import express, { Router } from 'express';
import Task from '../models/Task.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/fileUpload.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

const router = express.Router();


// Submit a new task (Student only)
router.post("/first-submit", protect, upload.single("file"), async (req, res) => {
  try {
    console.log("Received File:", req.file);
    console.log("Received Data:", req.body);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const { title, description, unitName, unitCode, lecturerEmail } = req.body;
    const status = req.body.status || "submitted"; 

    if (!title || !description || !unitName || !unitCode || !lecturerEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newTask = new Task({
      userId: req.user.id,
      title,
      description,
      unitName,
      unitCode,
      lecturerEmail,
      fileUrl: req.file.path,
      status,
    });

    await newTask.save();

    res.json({
      message: "Task submitted successfully!",
      fileUrl: req.file.path,
      status,
    });
  } catch (error) {
    console.error("Task submission error:", error);
    res.status(500).json({ message: "Error submitting task" });
  }
});

router.post("/submit", protect, upload.single("file"), async (req, res) => {
  try {
    console.log("Received File:", req.file);
    console.log("Received Data:", req.body);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const { title, description, unitName, unitCode, lecturerEmail } = req.body;
    const status = req.body.status || "submitted";

    if (!title || !description || !unitName || !unitCode || !lecturerEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fileUrl = `http://localhost:5000/uploads/${req.file.filename.replace(/\\/g, "/")}`;
    
    const newTask = new Task({
      userId: req.user.id,
      title,
      description,
      unitName,
      unitCode,
      lecturerEmail,
      fileUrl,
      status,
    });

    await newTask.save();

    res.json({
      message: "Task submitted successfully!",
      fileUrl,  // Return full file URL
      status,
    });
  } catch (error) {
    console.error("Task submission error:", error);
    res.status(500).json({ message: "Error submitting task" });
  }
});

//function for lecturer to retrieve task submitted by students
router.get('/tasks/lecturer', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const lecturerEmail = req.user.email; 

    const tasks = await Task.find({ lecturerEmail, status: 'submitted' }).populate('userId', 'regNumber course').sort({ submittedAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });

  } catch (error) {
    console.error('Error fetching tasks:', error);

    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
  }
});


router.get('/tasks/lecturer/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const lecturerEmail = req.user.email;
    const taskId = req.params.id;

    const task = await Task.findOne({ 
      _id: taskId, 
      lecturerEmail 
    }).populate('userId', 'regNumber course name email');

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: task });

  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
});



router.get('/lecturer', protect, async (req, res) => {
  try {
    const lecturerId = req.user.role === 'lecturer' ? req.user._id : userId;

    const tasks = await Task.find({ lecturerId, status: 'submitted' })
      .populate('userId', 'fullName registrationNumber') // 🔥 Populate student details
      .sort({ submittedAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});



router.get("/student", protect, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const tasks = await Task.find({ userId: req.user.id });

    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found" });
    }

    res.json({
      message: "Tasks retrieved successfully",
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error retrieving tasks" });
  }
});

router.delete('/delete', protect, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    if (!req.params.taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found or unauthorized to delete" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task" });
  }
});

router.delete('/delete/:taskId', protect, async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(String(taskId))) {
      return res.status(400).json({ message: "Invalid Task ID format" });
    }
    

    const task = await Task.findOneAndDelete({ _id: taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found or unauthorized to delete" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task" });
  }
});
     

//function for lecturer to grade task submitted by students
router.put("/grade/:taskId", protect, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const taskId = req.params.taskId;

    // Validate grade input
    if (grade < 0 || grade > 100) {
      return res.status(400).json({ message: "Grade must be between 0 and 100" });
    }

    // Find the task and update
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { grade, feedback, status: "graded", gradedAt: Date.now() },  // Updating status
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      success: true,
      message: "Grade submitted successfully!",
      task: updatedTask
    });

  } catch (error) {
    console.error("Error grading task:", error);
    res.status(500).json({ message: "Error grading task" });
  }
});

router.get("lecturer/grade/view/:taskId", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status !== "graded") {
      return res.status(400).json({ message: "Task is not graded yet" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching graded task:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/stats', protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    const totalTasks = await Task.countDocuments({ userId: studentId });
    const submittedTasks = await Task.countDocuments({ userId: studentId, status: 'submitted' });
    const gradedTasks = await Task.countDocuments({ userId: studentId, status: 'graded' });

    const pendingTasks = submittedTasks; 

    const gradedTaskScores = await Task.aggregate([
      { $match: { userId: studentId, status: 'graded', score: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: "$score" } } }
    ]);

    const averageScore = gradedTaskScores.length > 0 ? gradedTaskScores[0].avgScore : 0;

    res.json({
      success: true,
      total: totalTasks,
      submitted: submittedTasks,
      graded: gradedTasks,
      pending: pendingTasks,
      averageScore: averageScore.toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch task statistics' });
  }
});

router.get('/reports/pdf', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });

    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found to generate report" });
    }

    const doc = new PDFDocument();
    const fileName = `Task_Report_${Date.now()}.pdf`;
    const filePath = `./reports/${fileName}`;

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Task Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Student Name: ${req.user.fullName || 'N/A'}`);
    doc.text(`Registration Number: ${req.user.regNumber || 'N/A'}`);
    doc.text(`Course: ${req.user.course || 'N/A'}`);
    doc.moveDown();

    tasks.forEach((task, index) => {
      doc.fontSize(14).text(`Task ${index + 1}: ${task.title}`);
      doc.fontSize(12).text(`Description: ${task.description}`);
      doc.text(`Unit: ${task.unitName} (${task.unitCode})`);
      doc.text(`Lecturer: ${task.lecturerEmail}`);
      doc.text(`Submission Date: ${new Date(task.submissionDate).toLocaleString()}`);
      doc.text(`Status: ${task.status}`);
      doc.moveDown(2);
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

// function Get task analytics for student
router.get('/analytics/student/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate if the requesting user has access to this data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access this data" });
    }

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) }},
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageGrade: { $avg: '$grade' }
      }},
    ]);

    // Get time-based submission analytics
    const timeStats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) }},
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$submittedAt" }},
        count: { $sum: 1 }
      }},
      { $sort: { '_id': 1 }}
    ]);

    // Get unit performance
    const unitPerformance = await Task.aggregate([
      { $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        status: 'graded'
      }},
      { $group: {
        _id: '$unitCode',
        averageGrade: { $avg: '$grade' },
        totalTasks: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      data: {
        taskStats,
        timeStats,
        unitPerformance
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: "Error retrieving analytics data" });
  }
});



router.get('/analytics/lecturer/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (req.user.id !== userId || req.user.role !== 'lecturer') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to access this data" 
      });
    }

    const lecturerEmail = req.user.email;

    // Get analytics overview
    const overview = await Task.aggregate([
      {
        $match: { lecturerEmail }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $addToSet: '$userId' },
          totalTasks: { $sum: 1 },
          gradedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] }
          },
          averageGrade: { $avg: '$grade' }
        }
      }
    ]);

    // Get task status distribution
    const taskStats = await Task.aggregate([
      { 
        $match: { lecturerEmail }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get grade distribution
    const gradeDistribution = await Task.aggregate([
      {
        $match: {
          lecturerEmail,
          status: 'graded',
          grade: { $exists: true }
        }
      },
      {
        $bucket: {
          groupBy: '$grade',
          boundaries: [0, 40, 50, 60, 70, 80, 90, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Get timeline data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeline = await Task.aggregate([
      {
        $match: {
          lecturerEmail,
          submittedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' },
            day: { $dayOfMonth: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: overview[0] || {
          totalStudents: [],
          totalTasks: 0,
          gradedTasks: 0,
          averageGrade: 0
        },
        taskStats,
        gradeDistribution,
        timeline
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error retrieving analytics data" 
    });
  }
});

export default router;