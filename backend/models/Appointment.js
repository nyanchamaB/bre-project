import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Appointment title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Appointment description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
      
    status: {
      type: String,
      enum: ['booked', 'approved', 'cancelled'],
      default: 'booked',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);



// constraints to Check if the appointment is in the past
appointmentSchema.virtual('isPast').get(function () {
  return new Date(this.date) < new Date();
});

appointmentSchema.index({ user: 1, date: 1 });
appointmentSchema.index({ status: 1 });

export default mongoose.model('Appointment', appointmentSchema);
