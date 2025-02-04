import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

// The function for registering the students
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, regNumber, specialization } = req.body;
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
      // userData.specialization = specialization;
    }

    if (role === 'lecturer') {
      if (!specialization) {
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
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && { regNumber: user.regNumber }),
        ...(user.role === 'lecturer' && { specialization: user.specialization })
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

    // to retrieve the user details (student)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: role 
    });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // this is for sending the token and user details to the frontend
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// this fuction is for confirmig the user details
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});



//function for updating the user details
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    

    if (!fullName || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // this Checks if email is already in use
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        fullName, 
        email,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        ...(updatedUser.role === 'student' && { regNumber: updatedUser.regNumber }),
        ...(updatedUser.role === 'lecturer' && { specialization: updatedUser.specialization })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});


// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
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