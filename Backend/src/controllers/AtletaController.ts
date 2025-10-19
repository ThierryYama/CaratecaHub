import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const listarAtletas = async (req: AuthRequest, res: Response) => {
    try {
        const idAssociacao = req.user!.idAssociacao;
        const atletas = await prisma.atleta.findMany({ 
            where: { idAssociacao }, 
            orderBy: { idAtleta: 'asc' },
            include: {
                associacao: true,
            },
        });
        res.status(200).json(atletas);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar atletas', error: String(err) });
    }
};

export const listarAtletaPorId = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const idAssociacao = req.user!.idAssociacao;
        const atleta = await prisma.atleta.findFirst({ where: { idAtleta: id, idAssociacao } });
        if (!atleta) return res.status(404).json({ message: 'Atleta não encontrado' });
        res.status(200).json(atleta);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar atleta', error: String(err) });
    }
};

export const cadastrarAtleta = async (req: AuthRequest, res: Response) => {
    try {
        const idAssociacao = req.user!.idAssociacao;
        const data = { ...req.body, idAssociacao };
        const atleta = await prisma.atleta.create({ data });
        res.status(201).json(atleta);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao criar atleta', error: String(err) });
    }
};

export const atualizarAtleta = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const idAssociacao = req.user!.idAssociacao;
    const data: any = { ...req.body };
    delete data.idAssociacao;
        const result = await prisma.atleta.updateMany({ where: { idAtleta: id, idAssociacao }, data });
        if (result.count === 0) return res.status(404).json({ message: 'Atleta não encontrado' });
        const atleta = await prisma.atleta.findFirst({ where: { idAtleta: id, idAssociacao } });
        res.status(200).json(atleta);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar atleta', error: String(err) });
    }
};

export const deletarAtleta = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const idAssociacao = req.user!.idAssociacao;
        const result = await prisma.atleta.deleteMany({ where: { idAtleta: id, idAssociacao } });
        if (result.count === 0) return res.status(404).json({ message: 'Atleta não encontrado' });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ message: 'Erro ao remover atleta', error: String(err) });
    }
};

