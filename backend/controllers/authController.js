import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Helper function to generate JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Function Register User
export const register = async (req, res) => {
    try {
      const { fullName, email, password, role, regNumber, specialization } = req.body;
  
      // Check if user exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ 
          message: 'User already exists. Please log in.',
          redirectToLogin: true // Send flag for redirection
        });
      }
  
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create user
      const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role,
        ...(role === 'student' && { regNumber }),
        ...(role === 'lecturer' && { specialization })
      });
  
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
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  };
  

// Funcion Login User
export const login = async (req, res) => {
    try {
      let { email, password, role } = req.body;
      email = email.toLowerCase(); // Ensure email is in lowercase
  
      console.log('Login attempt:', { email, role });
  
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
  
      // Function to Check if user exists with the given email
      const user = await User.findOne({ email });
      console.log("User found in DB:", user);
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials - User not found' });
      }
  
      // Check if role matches
      if (user.role !== role) {
        console.log("Role mismatch! Expected:", role, "Found:", user.role);
        return res.status(400).json({ message: 'Invalid credentials - Role mismatch' });
      }
  
      // Compare password using the model's comparePassword method
      const isMatch = await user.comparePassword(password);
      console.log("Password comparison:", isMatch);
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials - Password mismatch' });
      }
  
      // Generate token
      const token = generateToken(user._id, user.role);
  
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        }
      });
  
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  };
  
  

// Function Get User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email ? req.body.email.toLowerCase() : user.email;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
