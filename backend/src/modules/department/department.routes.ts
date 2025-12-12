import { Router } from 'express';
import * as departmentController from './department.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);
router.post('/', departmentController.create);
router.put('/:id', departmentController.update);
router.delete('/:id', departmentController.remove);

export default router;
