import {Router} from "express";

import * as EquipeController from '../controllers/EquipeController';

const router = Router();

router.post('/cadastrarEquipe', EquipeController.cadastrarEquipe);
router.put('/atualizarEquipe/:id', EquipeController.atualizarEquipe);
router.delete('/deletarEquipe/:id', EquipeController.deletarEquipe);
router.get('/listarEquipes', EquipeController.listarTodasEquipes);
router.post('/vincularAtletaEquipe/:idEquipe/:idAtleta', EquipeController.adicionarAtletaAEquipe);
router.delete('/removerAtletaEquipe/:idEquipe/:idAtleta', EquipeController.deletarAtletaDaEquipe);

export default router;