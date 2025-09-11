import {Request, Response} from 'express';
import prisma from '../lib/prisma';

export const listarCampeonatos = async (req: Request, res: Response) => {
    try {
        const campeonatos = await prisma.campeonato.findMany({orderBy: {idCampeonato: 'asc'}});
        res.status(200).json(campeonatos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar campeonatos', error: String(err) });
    }
};

export const listarCampeonatoPorIdDeAssociacao = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const campeonatos = await prisma.campeonato.findMany({
            where: { idAssociacao: id },
            orderBy: { idCampeonato: 'asc' }
        });
        res.status(200).json(campeonatos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar campeonatos por ID de associação', error: String(err) });
    }
};

export const cadastrarCampeonato = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const campeonato = await prisma.campeonato.create({data});
        res.status(201).json(campeonato);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao criar campeonato', error: String(err) });
    }
};

export const atualizarCampeonato = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        const campeonato = await prisma.campeonato.update({ where: { idCampeonato: id }, data });
        res.status(200).json(campeonato);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar campeonato', error: String(err) });
    }
};

export const deletarCampeonato = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await prisma.campeonato.delete({ where: { idCampeonato: id } });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ message: 'Erro ao remover campeonato', error: String(err) });
    }
};
