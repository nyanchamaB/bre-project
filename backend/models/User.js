import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Common fields
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['student', 'lecturer'],
    required: true
  },

  // Student fields
  regNumber: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true
  },
  specialization: {
    type: String,
    required: function() {
      return this.role === 'lecturer';
    }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Validate password - Not storing confirmPassword in DB
userSchema.pre('save', function(next) {
  if (this.role === 'student' && !this.regNumber) {
    throw new Error('Registration number is required for students');
  }
  if (this.role === 'lecturer' && !this.specialization) {
    throw new Error('Specialization is required');
  }
  next();
});

export default mongoose.model('User', userSchema);