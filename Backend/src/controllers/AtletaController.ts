import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const listarAtletas = async (req: Request, res: Response) => {
    try {
        const atletas = await prisma.atleta.findMany({ orderBy: { idAtleta: 'asc' } });
        res.json(atletas);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar atletas', error: String(err) });
    }
};

export const listarAtletaPorId = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const atleta = await prisma.atleta.findUnique({ where: { idAtleta: id } });
        if (!atleta) return res.status(404).json({ message: 'Atleta não encontrado' });
        res.json(atleta);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar atleta', error: String(err) });
    }
};

export const cadastrarAtleta = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const atleta = await prisma.atleta.create({ data });
        res.status(201).json(atleta);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao criar atleta', error: String(err) });
    }
};

export const atualizarAtleta = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const atleta = await prisma.atleta.update({ where: { idAtleta: id }, data });
        res.json(atleta);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar atleta', error: String(err) });
    }
};

export const deletarAtleta = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await prisma.atleta.delete({ where: { idAtleta: id } });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ message: 'Erro ao remover atleta', error: String(err) });
    }
};

