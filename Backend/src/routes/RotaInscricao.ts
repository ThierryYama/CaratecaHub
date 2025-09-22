import { Router } from 'express';
import * as InscricaoController from '../controllers/InscricaoController';

const router = Router();

router.post('/cadastrarInscricaoAtleta', InscricaoController.cadastrarInscricaoAtleta);
router.put('/atualizarInscricaoAtleta/:id', InscricaoController.atualizarInscricaoAtleta);
router.get('/listarInscricoesAtletas', InscricaoController.listarInscricoesAtletas);
router.get('/listarInscricaoAtleta/:id', InscricaoController.listarInscricoesAtletaPorId);
router.get('/listarInscricoesAtletaPorAtleta/:idAtleta', InscricaoController.listarInscricoesAtletaPorAtleta);
router.get(
  '/listarInscricoesAtletaPorCampeonato/:idCampeonatoModalidade',
  InscricaoController.listarInscricoesAtletaPorCampeonato
);

router.post('/cadastrarInscricaoEquipe', InscricaoController.cadastrarInscricaoEquipe);
router.put('/atualizarInscricaoEquipe/:id', InscricaoController.atualizarInscricaoEquipe);
router.get('/listarInscricoesEquipes', InscricaoController.listarInscricoesEquipes);
router.get('/listarInscricaoEquipe/:id', InscricaoController.listarInscricoesEquipePorId);
router.get('/listarInscricoesEquipePorEquipe/:idEquipe', InscricaoController.listarInscricoesEquipePorEquipe);
router.get(
  '/listarInscricoesEquipePorCampeonato/:idCampeonatoModalidade',
  InscricaoController.listarInscricoesEquipePorCampeonato
);

export default router;
