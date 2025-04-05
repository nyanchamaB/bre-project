import mongoose from 'mongoose';
import { type } from 'os';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  unitName: {
    type: String,
    required: [true, 'Unit name is required']
  },
  unitCode: {
    type: String,
    required: [true, 'Unit code is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lecturerEmail: {
    type: String,
    required: [true, 'Lecturer email is required']
  },


  
  fileUrl: { type: String, required: true }, 
  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted'
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  submissionDate: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
});

taskSchema.pre('remove', async function(next) {
  try {
    if (this.file && this.file.length > 0) {
      for (const filePath of this.file) {
        await new Promise((resolve, reject) => {
          fs.cleanupFile(filePath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

  
export default mongoose.model('Task', taskSchema);