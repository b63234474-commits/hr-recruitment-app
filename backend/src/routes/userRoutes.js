import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser);

export default router;
