import { Router } from "express";

import * as CampeonatoController from '../controllers/CampeonatoController';

const router = Router();

router.post('/cadastrarCampeonato', CampeonatoController.cadastrarCampeonato);
router.put('/atualizarCampeonato/:id', CampeonatoController.atualizarCampeonato);
router.delete('/deletarCampeonato/:id', CampeonatoController.deletarCampeonato);
router.get('/listarCampeonatos', CampeonatoController.listarCampeonatos);
router.get('/listarCampeonatosPublicos', CampeonatoController.listarCampeonatosPublicos);
router.get('/listarCampeonatosPorIdDeAssociacao/:id', CampeonatoController.listarCampeonatoPorIdDeAssociacao);
router.get('/listarCampeonato/:id', CampeonatoController.listarCampeonatoPorId);
router.get('/listarCampeonatoPublico/:id', CampeonatoController.listarCampeonatoPublicoPorId);
router.post('/adicionarCategoriaAoCampeonato/:idCampeonato', CampeonatoController.adicionarCategoriaAoCampeonato);
router.delete('/removerCategoriaDeCampeonato/:idCampeonato/:idCategoria', CampeonatoController.removerCategoriaDeCampeonato);
router.get('/listarCategoriasDeCampeonato/:idCampeonato', CampeonatoController.listarCategoriasDeCampeonato);
router.put('/atualizarEnderecoCampeonato/:idCampeonato', CampeonatoController.atualizarEnderecoCampeonato);
router.post('/confirmarCategorias/:idCampeonato', CampeonatoController.confirmarCategorias);
router.post('/confirmarInscricoes/:idCampeonato', CampeonatoController.confirmarInscricoes);
router.get('/etapas/:idCampeonato', CampeonatoController.VerificarEtapasDoCampeonato);

export default router;