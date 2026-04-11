import { Router } from 'express';
import { listUsersForAssignment } from '../controllers/userController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, listUsersForAssignment);

export default router;
