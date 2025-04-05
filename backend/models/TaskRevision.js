import mongoose from "mongoose";

const taskRevisionSchema = new mongoose.Schema({
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    revisionNumber: {
        type: Number,
        required: true
    },
    submittedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lecturerFeedback: {
        comment: String,
        suggestedChanges: [String],
        submittedAt: Date
    },
    studentComments: String,
}, { timestamps: true });
  
  export default mongoose.model('TaskRevision', taskRevisionSchema);