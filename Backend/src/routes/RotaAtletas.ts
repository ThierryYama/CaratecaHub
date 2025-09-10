import {Router} from "express";

import * as AtletaController from '../controllers/AtletaController';

const router = Router();

router.post('/cadastrarAtleta', AtletaController.cadastrarAtleta);
router.put('/atualizarAtleta/:id', AtletaController.atualizarAtleta);
router.delete('/deletarAtleta/:id', AtletaController.deletarAtleta);
router.get('/listarAtletas', AtletaController.listarAtletas);
router.get('/listarAtleta/:id', AtletaController.listarAtletaPorId);

export default router;  