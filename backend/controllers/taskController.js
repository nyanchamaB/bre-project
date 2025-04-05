import Task from '../models/Task.js';
import User from '../models/User.js'
export const submitTask = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { title, description, status } = req.body;

    const newTask = new Task({
      title,
      description,
      status: status || 'pending',
      user: req.user._id, // Assign the authenticated user's ID
    });

    await newTask.save();
    res.status(201).json({ message: 'Task created successfully', task: newTask });

  } catch (error) {
    console.error('Task submission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get tasks for a lecturer
const getLecturerTasks = async (req, res) => {
  try {
    const lecturerId = req.user._id;
    
    const tasks = await Task.find({ 
      lecturerId,
      status: 'submitted' 
    }).sort({ submissionDate: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get tasks for a student
const getStudentTasks = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const tasks = await Task.find({ userId: studentId })
      .sort({ submissionDate: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export { submitTask, getLecturerTasks, getStudentTasks };