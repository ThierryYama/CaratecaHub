import { Router } from 'express';
import ChaveamentoController from '../controllers/ChaveamentoController';

const router = Router();

router.post('/chaveamento/gerar/:idCampeonatoModalidade', ChaveamentoController.gerar);

router.delete('/chaveamento/reset/:idCampeonatoModalidade', ChaveamentoController.reset);

router.post('/chaveamento/avancar/atleta', ChaveamentoController.avancarAtleta);

router.post('/chaveamento/avancar/equipe', ChaveamentoController.avancarEquipe);

router.get('/chaveamento/partidas/atleta/:idCampeonatoModalidade', ChaveamentoController.listarPartidasAtletaPorCategoria);
router.get('/chaveamento/partidas/equipe/:idCampeonatoModalidade', ChaveamentoController.listarPartidasEquipePorCategoria);

export default router;
