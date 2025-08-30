import { Router } from "express";

import * as CategoriaController from '../controllers/CategoriaController';

const router = Router();

router.post('/cadastrarCategoria', CategoriaController.cadastrarCategoria);
router.put('/atualizarCategoria/:id', CategoriaController.atualizarCategoria);
router.delete('/deletarCategoria/:id', CategoriaController.deletarCategoria);
router.get('/listarCategorias', CategoriaController.listarCategorias);
router.get('/listarCategoria/:id', CategoriaController.listarCategoriaPorId);


export default router;