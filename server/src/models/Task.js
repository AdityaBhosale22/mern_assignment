import mongoose from 'mongoose';

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

export const TASK_TYPE = {
  PERSONAL: 'personal',
  ASSIGNED: 'assigned',
};

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
    },
    dueDate: { type: Date, default: null },
    taskType: {
      type: String,
      enum: Object.values(TASK_TYPE),
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.index({ createdBy: 1, updatedAt: -1 });
taskSchema.index({ assignee: 1, updatedAt: -1 });

export default mongoose.model('Task', taskSchema);
