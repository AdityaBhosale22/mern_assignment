import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Task, { TASK_STATUS, TASK_TYPE } from '../models/Task.js';
import User from '../models/User.js';

function canViewTask(task, userId) {
  const uid = userId.toString();
  if (task.taskType === TASK_TYPE.PERSONAL) {
    return task.createdBy.toString() === uid;
  }
  return (
    task.createdBy.toString() === uid ||
    (task.assignee && task.assignee.toString() === uid)
  );
}

function isAssigner(task, userId) {
  return task.createdBy.toString() === userId.toString();
}

function isAssignee(task, userId) {
  return task.assignee && task.assignee.toString() === userId.toString();
}

export async function listTasks(req, res, next) {
  try {
    const userId = req.userId;
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignee: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate('createdBy', 'email name')
      .populate('assignee', 'email name')
      .lean();
    res.json(tasks);
  } catch (e) {
    next(e);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'email name')
      .populate('assignee', 'email name');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!canViewTask(task, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(task);
  } catch (e) {
    next(e);
  }
}

export async function createTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { title, description, status, dueDate, taskType, assigneeId } = req.body;
    const userId = req.userId;

    if (taskType === TASK_TYPE.PERSONAL) {
      const task = await Task.create({
        title,
        description: description ?? '',
        status: status || TASK_STATUS.TODO,
        dueDate: dueDate ? new Date(dueDate) : null,
        taskType: TASK_TYPE.PERSONAL,
        createdBy: userId,
        assignee: null,
      });
      const populated = await Task.findById(task._id)
        .populate('createdBy', 'email name')
        .populate('assignee', 'email name');
      return res.status(201).json(populated);
    }

    if (taskType === TASK_TYPE.ASSIGNED) {
      if (!assigneeId || !mongoose.isValidObjectId(assigneeId)) {
        return res.status(400).json({ message: 'Valid assignee is required for assigned tasks' });
      }
      if (assigneeId === userId.toString()) {
        return res.status(400).json({ message: 'Cannot assign a task to yourself' });
      }
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        return res.status(400).json({ message: 'Assignee user not found' });
      }
      const task = await Task.create({
        title,
        description: description ?? '',
        status: status || TASK_STATUS.TODO,
        dueDate: dueDate ? new Date(dueDate) : null,
        taskType: TASK_TYPE.ASSIGNED,
        createdBy: userId,
        assignee: assigneeId,
      });
      const populated = await Task.findById(task._id)
        .populate('createdBy', 'email name')
        .populate('assignee', 'email name');
      return res.status(201).json(populated);
    }

    return res.status(400).json({ message: 'Invalid task type' });
  } catch (e) {
    next(e);
  }
}

export async function updateTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!canViewTask(task, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const body = req.body;

    if (task.taskType === TASK_TYPE.PERSONAL) {
      if (!isAssigner(task, req.userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (body.title !== undefined) task.title = body.title;
      if (body.description !== undefined) task.description = body.description;
      if (body.status !== undefined) task.status = body.status;
      if (body.dueDate !== undefined) task.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      await task.save();
      const populated = await Task.findById(task._id)
        .populate('createdBy', 'email name')
        .populate('assignee', 'email name');
      return res.json(populated);
    }

    // Assigned task
    const assigner = isAssigner(task, req.userId);
    const assignee = isAssignee(task, req.userId);

    if (assigner) {
      const forbiddenKeys = ['status', 'title', 'description', 'taskType', 'assigneeId'];
      for (const key of forbiddenKeys) {
        if (body[key] !== undefined) {
          return res.status(403).json({ message: 'Assigner can only update the due date' });
        }
      }
      if (body.dueDate === undefined) {
        return res.status(400).json({ message: 'Due date update required' });
      }
      task.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      await task.save();
      const populated = await Task.findById(task._id)
        .populate('createdBy', 'email name')
        .populate('assignee', 'email name');
      return res.json(populated);
    }

    if (assignee) {
      const keys = Object.keys(body);
      if (keys.length !== 1 || keys[0] !== 'status') {
        return res.status(403).json({ message: 'Assignee can only update task status' });
      }
      if (!Object.values(TASK_STATUS).includes(body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      task.status = body.status;
      await task.save();
      const populated = await Task.findById(task._id)
        .populate('createdBy', 'email name')
        .populate('assignee', 'email name');
      return res.json(populated);
    }

    return res.status(403).json({ message: 'Access denied' });
  } catch (e) {
    next(e);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (!canViewTask(task, req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (task.taskType === TASK_TYPE.PERSONAL) {
      if (!isAssigner(task, req.userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      if (!isAssigner(task, req.userId)) {
        return res.status(403).json({ message: 'Only the assigner can delete this task' });
      }
    }
    await Task.deleteOne({ _id: task._id });
    res.json({ message: 'Task deleted' });
  } catch (e) {
    next(e);
  }
}
