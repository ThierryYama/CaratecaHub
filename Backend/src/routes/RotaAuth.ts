import { Router } from 'express';
import * as LoginController from '../controllers/LoginController';

const router = Router();

router.post('/auth/registrar', LoginController.registrar);
router.post('/auth/login', LoginController.login);

export default router;
