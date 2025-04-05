import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';


const router = express.Router();




// The function for registering the students
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, regNumber,course, specialization,department } = req.body;
    console.log('Registration attempt:', { email, role });

    // method for checking if the user exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // RBAC 
    const userData = {
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role
    };

    if (role === 'student') {
      if (!regNumber) {
       return res.status(400).json({ message: 'Registration number required for students' });
      }
      userData.regNumber = regNumber;
    }
    if (role === 'student') {
      if (!course) {
       return res.status(400).json({ message: 'Course information required for students' });
      }
      userData.course = course;
    }

    if (role === 'lecturer') {
      if ( !department) {
        return res.status(400).json({ message: 'Department required for Lecturer' });
      }
      userData.department = department;
    }

    if (role === 'lecturer') {
      if (!specialization ) {
        return res.status(400).json({ message: 'Specialization required for Lecturer' });
      }
      userData.specialization = specialization;
    }


    

    const user = await User.create(userData);
    console.log('User created:', user._id);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && { regNumber: user.regNumber }),
        ...(user.role === 'student' && { course: user.course }),
        ...(user.role === 'lecturer' && { specialization: user.specialization }),
        ...(user.role === 'lecturer' && { department: user.department })
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message 
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Retrieve the user (student or lecturer)
    const user = await User.findOne({ email, role }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate access token (short-lived)
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email,
        fullName: user.fullName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Short expiry (15 minutes)
    );


    res.json({
      token, // Frontend uses this token
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber,
        course: user.course,
        department: user.department,
        specialization: user.specialization
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});


router.get('/lecturers', protect, async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' }).select('-password').lean(); // Ensures plain JS objects
    res.json(lecturers);
  } catch (error) {
    console.error('Error fetching lecturers:', error);
    res.status(500).json({ message: 'Error fetching lecturers' });
  }
});


router.get('/students', protect, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').lean(); // Ensures plain JS objects
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});



router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentPassword && newPassword) {
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update the user's profile data
    user.fullName = fullName;
    user.email = email;
    user.updatedAt = Date.now();

    // If the role is 'student' or 'lecturer', update additional fields
    if (user.role === 'student') {
      user.regNumber = req.body.regNumber || user.regNumber;
    } else if (user.role === 'lecturer') {
      user.specialization = req.body.specialization || user.specialization;
    }

    user.updatedAt = Date.now();

    await user.save();

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber,
        course: user.course,
        department: user.department,
        specialization: user.specialization
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});


router.put('/student/update', protect, async (req, res) => {
  try {
    const { regNumber, fullName, course } = req.body;

    const user = await User.findOne({ regNumber });

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    user.fullName = fullName || user.fullName;
    user.course = course && course.trim() !== "" ? course : "Not Assigned";  // Default course if empty

    user.updatedAt = Date.now();  // Update timestamp

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber,
        course: user.course,  // Return updated course
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.put('/lecturer/academic-update', protect, async (req, res) => {
  try {
    const { fullName, department, specialization } = req.body;
    
    console.log('User ID from token:', req.user.userId);
    
    let userId;
    try {
      const mongoose = require('mongoose');
      userId = mongoose.Types.ObjectId(req.user.userId);
    } catch (error) {
      userId = req.user.userId;
    }
    
    const user = await User.findOne({
      $or: [
        { _id: userId },
        { email: req.user.email } 
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (fullName) user.fullName = fullName;
    if (department) user.department = department;
    if (specialization) user.specialization = specialization;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    console.log('User ID from token:', req.user.userId);
    
    let userId;
    try {
      const mongoose = require('mongoose');
      userId = mongoose.Types.ObjectId(req.user.userId);
    } catch (error) {
      userId = req.user.userId;
    }
    
    const user = await User.findOne({
      $or: [
        { _id: userId },
        { email: req.user.email } 
      ]
    }).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send reset email
    res.json({ message: 'Password reset instructions sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting password reset' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Invalid reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Delete account
router.delete('/account', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const newToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});





// Forgot Password (Lecturer resets password)
/*app.post('/lecturer/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const lecturer = await Lecturer.findOne({ email });
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found.' });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8); // 8-character random password

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    lecturer.password = hashedPassword;
    await lecturer.save();

    // Send the temporary password via email
    const subject = 'Password Reset Request';
    const text = `Hello ${lecturer.name},\n\nYour password has been reset. Here is your temporary password: ${tempPassword}\n\nPlease log in and change your password as soon as possible.`;

    await sendEmail(email, subject, text);

    res.status(200).json({ message: 'Password reset successful. A temporary password has been sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
});
*/

export default router;