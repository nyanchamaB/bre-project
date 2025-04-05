import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
   
    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      
    },
    endTime: {
      type: String,
      required: true,
      
    },
    maxStudents: {
      type: Number,
      default: 1,
      min: [1, 'At least one student should be allowed to book'],
    },
    status: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available',
    },
    bookedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
}, { timestamps: true });


export default mongoose.model('Slot', slotSchema);
