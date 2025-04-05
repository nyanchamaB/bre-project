import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No token provided");
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Extracted Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    req.user = await User.findById(new mongoose.Types.ObjectId(decoded.userId)).select('-password');
    console.log("User from DB (req.user):", req.user);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};



export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. ${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)}s cannot access this route.`,
      });
    }
    next();
  };
};

export default { protect, authorize };
