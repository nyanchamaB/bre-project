import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: String,
    lecturer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    students: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }, {
    timestamps: true
  });
 
  export default mongoose.model('Course', courseSchema);