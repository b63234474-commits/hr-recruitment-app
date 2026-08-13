import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';

const router = Router();

router.use(protect);
router.route('/').get(getEmployees).post(authorize('Admin', 'HR', 'Recruiter'), createEmployee);
router.route('/:id')
  .get(getEmployeeById)
  .put(authorize('Admin', 'HR', 'Recruiter'), updateEmployee)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deleteEmployee);

export default router;
