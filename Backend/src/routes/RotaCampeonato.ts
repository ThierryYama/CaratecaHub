import { Router } from "express";

import * as CampeonatoController from '../controllers/CampeonatoController';

const router = Router();

router.post('/cadastrarCampeonato', CampeonatoController.cadastrarCampeonato);
router.put('/atualizarCampeonato/:id', CampeonatoController.atualizarCampeonato);
router.delete('/deletarCampeonato/:id', CampeonatoController.deletarCampeonato);
router.get('/listarCampeonatos', CampeonatoController.listarCampeonatos);
router.get('/listarCampeonatosPorIdDeAssociacao/:id', CampeonatoController.listarCampeonatoPorIdDeAssociacao);
router.post('/adicionarCategoriaAoCampeonato/:idCampeonato', CampeonatoController.adicionarCategoriaAoCampeonato);
router.delete('/removerCategoriaDeCampeonato/:idCampeonato/:idCategoria', CampeonatoController.removerCategoriaDeCampeonato);
router.get('/listarCategoriasDeCampeonato/:idCampeonato', CampeonatoController.listarCategoriasDeCampeonato);

export default router;