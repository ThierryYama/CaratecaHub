import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const listarCategorias = async (req: AuthRequest, res: Response) => {
	try {
		const idAssociacao = req.user!.idAssociacao;
		const categorias = await prisma.categoria.findMany({ where: { idAssociacao }, orderBy: { idCategoria: 'asc' } });
		res.json(categorias);
	} catch (err) {
		res.status(500).json({ message: 'Erro ao listar categorias', error: String(err) });
	}
};

export const listarCategoriaPorId = async (req: AuthRequest, res: Response) => {
	try {
		const id = Number(req.params.id);
		const idAssociacao = req.user!.idAssociacao;
		const categoria = await prisma.categoria.findFirst({ where: { idCategoria: id, idAssociacao } });
		if (!categoria) return res.status(404).json({ message: 'Categoria não encontrada' });
		res.json(categoria);
	} catch (err) {
		res.status(500).json({ message: 'Erro ao buscar categoria', error: String(err) });
	}
};

export const cadastrarCategoria = async (req: AuthRequest, res: Response) => {
	try {
		const idAssociacao = req.user!.idAssociacao;
		const data = { ...req.body, idAssociacao };
		const categoria = await prisma.categoria.create({ data });
		res.status(201).json(categoria);
	} catch (err) {
		res.status(400).json({ message: 'Erro ao criar categoria', error: String(err) });
	}
};

export const atualizarCategoria = async (req: AuthRequest, res: Response) => {
	try {
		const id = Number(req.params.id);
		const idAssociacao = req.user!.idAssociacao;
		const data: any = { ...req.body };
		delete data.idAssociacao;
		const result = await prisma.categoria.updateMany({ where: { idCategoria: id, idAssociacao }, data });
		if (result.count === 0) return res.status(404).json({ message: 'Categoria não encontrada' });
		const categoria = await prisma.categoria.findFirst({ where: { idCategoria: id, idAssociacao } });
		res.json(categoria);
	} catch (err) {
		res.status(400).json({ message: 'Erro ao atualizar categoria', error: String(err) });
	}
};

export const deletarCategoria = async (req: AuthRequest, res: Response) => {
	try {
		const id = Number(req.params.id);
		const idAssociacao = req.user!.idAssociacao;
		const result = await prisma.categoria.deleteMany({ where: { idCategoria: id, idAssociacao } });
		if (result.count === 0) return res.status(404).json({ message: 'Categoria não encontrada' });
		res.status(204).send();
	} catch (err) {
		res.status(400).json({ message: 'Erro ao remover categoria', error: String(err) });
	}
};

