import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  maxStudents: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['available', 'booked'],
    default: 'available'
  },
  bookedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

export default mongoose.model('Slot', slotSchema);