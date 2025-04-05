import Task from '../models/Task.js';
import fs from 'fs';
export const validateTaskSubmission = (req, res, next) => {
    const { title, description, unitName, unitCode, lecturerEmail } = req.body;
  
    if (!title || !description || !unitName || !unitCode || !lecturerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
  
    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(lecturerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid lecturer email'
      });
    }
  
    next();
  };

  export const checkTaskExists = async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      req.task = task;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking task existence'
      });
    }
  };

  export const verifyTaskOwnership = async (req, res, next) => {
    try {
      const task = req.task;
      if (task.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this task'
        });
      }
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verifying task ownership'
      });
    }
  };

  export const canGradeTask = async (req, res, next) => {
    try {
      const task = req.task;
      if (task.lecturerEmail !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to grade this task'
        });
      }
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking grading permissions'
      });
    }
  };

  export const validateGrading = async (req, res, next) => {
    try {
      const { grade, feedback } = req.body;
  
      if (grade === undefined || feedback === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Grade and feedback are required'
        });
      }
  
      if (grade < 0 || grade > 100) {
        return res.status(400).json({
          success: false,
          message: 'Grade must be between 0 and 100'
        });
      }
      next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating grading data'
    });
  }
};



export const cleanupFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('File cleanup error:', error);
  }
};