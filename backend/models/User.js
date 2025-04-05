import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'lecturer'],
    required: true
  },
  avatar: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.fullName)}&background=random`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
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
  course: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  
  // Lecturer fields
  department: {
    type: String,
    required: function() {
      return this.role === 'lecturer';
    },
    trim: true
  },
  specialization: {
    type: String,
    required: function() {
      return this.role === 'lecturer';
    },
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxLength: [500, 'Bio cannot be longer than 500 characters']
  },
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }]
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ regNumber: 1 }, { sparse: true });

// Virtual for full name
userSchema.virtual('displayName').get(function() {
  return `${this.title || ''} ${this.fullName}`.trim();
});

// Virtual for appointment schedule
userSchema.virtual('schedule').get(function() {
  if (this.role !== 'lecturer') return null;
  return {
    officeHours: this.officeHours,
    appointments: this.appointments,
    isAvailable: this.isAvailable
  };
});

// Method to check lecturer availability
userSchema.methods.isAvailableAt = function(date, time) {
  if (this.role !== 'lecturer' || !this.isAvailable) return false;

  const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
  const officeHour = this.officeHours.find(oh => oh.day === dayOfWeek);
  
  if (!officeHour) return false;

  const requestedTime = time.split(':').map(Number);
  const startTime = officeHour.startTime.split(':').map(Number);
  const endTime = officeHour.endTime.split(':').map(Number);

  return (
    (requestedTime[0] > startTime[0] || 
     (requestedTime[0] === startTime[0] && requestedTime[1] >= startTime[1])) &&
    (requestedTime[0] < endTime[0] || 
     (requestedTime[0] === endTime[0] && requestedTime[1] <= endTime[1]))
  );
};

// Pre-save middleware for validation
userSchema.pre('save', function(next) {
  // Validate role-specific fields
  if (this.role === 'student') {
    if (!this.regNumber) {
      throw new Error('Registration number is required for students');
    }
    if (!this.course) {
      throw new Error('Course is required for students');
    }
   
  }

  if (this.role === 'lecturer') {
    if (!this.specialization) {
      throw new Error('Specialization is required for lecturers');
    }
    if (!this.department) {
      throw new Error('Department is required for lecturers');
    }
  }

  // Validate office hours
  if (this.role === 'lecturer' && this.officeHours) {
    this.officeHours.forEach(oh => {
      const start = oh.startTime.split(':').map(Number);
      const end = oh.endTime.split(':').map(Number);
      
      if (start[0] > end[0] || (start[0] === end[0] && start[1] >= end[1])) {
        throw new Error('End time must be after start time');
      }
    });
  }

  next();
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', userSchema);