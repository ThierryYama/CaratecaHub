import { Router } from 'express';
import * as PerfilController from '../controllers/PerfilController';

const router = Router();

router.get('/perfil', PerfilController.obterPerfil);
router.put('/perfil', PerfilController.atualizarPerfil);
router.delete('/perfil', PerfilController.deletarPerfil);

export default router;
