import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const listarCategorias = async (req: Request, res: Response) => {
	try {
		const categorias = await prisma.categoria.findMany({ orderBy: { idCategoria: 'asc' } });
		res.json(categorias);
	} catch (err) {
		res.status(500).json({ message: 'Erro ao listar categorias', error: String(err) });
	}
};

export const listarCategoriaPorId = async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const categoria = await prisma.categoria.findUnique({ where: { idCategoria: id } });
		if (!categoria) return res.status(404).json({ message: 'Categoria não encontrada' });
		res.json(categoria);
	} catch (err) {
		res.status(500).json({ message: 'Erro ao buscar categoria', error: String(err) });
	}
};

export const cadastrarCategoria = async (req: Request, res: Response) => {
	try {
		const data = req.body;
		const categoria = await prisma.categoria.create({ data });
		res.status(201).json(categoria);
	} catch (err) {
		res.status(400).json({ message: 'Erro ao criar categoria', error: String(err) });
	}
};

export const atualizarCategoria = async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const data = req.body;
		const categoria = await prisma.categoria.update({ where: { idCategoria: id }, data });
		res.json(categoria);
	} catch (err) {
		res.status(400).json({ message: 'Erro ao atualizar categoria', error: String(err) });
	}
};

export const deletarCategoria = async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await prisma.categoria.delete({ where: { idCategoria: id } });
		res.status(204).send();
	} catch (err) {
		res.status(400).json({ message: 'Erro ao remover categoria', error: String(err) });
	}
};

