import { Router } from 'express';
import { body } from 'express-validator';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { authRequired } from '../middleware/auth.js';
import { TASK_STATUS, TASK_TYPE } from '../models/Task.js';

const router = Router();

router.use(authRequired);

router.get('/', listTasks);

router.get('/:id', getTask);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('taskType')
      .isIn(Object.values(TASK_TYPE))
      .withMessage('Task type must be personal or assigned'),
    body('status')
      .optional()
      .isIn(Object.values(TASK_STATUS))
      .withMessage('Invalid status'),
    body('assigneeId').optional().isMongoId().withMessage('Invalid assignee'),
  ],
  createTask
);

router.patch('/:id', updateTask);

router.delete('/:id', deleteTask);

export default router;
