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

export const adicionarCategoriaAoCampeonato = async (req: Request, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        const { idCategoria } = req.body as { idCategoria?: number };

        if (!idCategoria) {
            return res.status(400).json({ message: 'idCategoria é obrigatório' });
        }

        const [campeonato, categoria] = await Promise.all([
            prisma.campeonato.findUnique({ where: { idCampeonato } }),
            prisma.categoria.findUnique({ where: { idCategoria } })
        ]);

        if (!campeonato) return res.status(404).json({ message: 'Campeonato não encontrado' });
        if (!categoria) return res.status(404).json({ message: 'Categoria não encontrada' });

        const existente = await prisma.campeonatoModalidade.findFirst({
            where: { idCampeonato, idCategoria }
        });
        if (existente) {
            return res.status(409).json({ message: 'Categoria já vinculada a este campeonato', data: existente });
        }

        const link = await prisma.campeonatoModalidade.create({
            data: { idCampeonato, idCategoria }
        });
        res.status(201).json(link);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao vincular categoria ao campeonato', error: String(err) });
    }
};

export const removerCategoriaDeCampeonato = async (req: Request, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        const idCategoria = Number(req.params.idCategoria);

        if (isNaN(idCampeonato) || isNaN(idCategoria)) {
            return res.status(400).json({ message: 'Parâmetros inválidos' });
        }

        const existente = await prisma.campeonatoModalidade.findFirst({
            where: { idCampeonato, idCategoria }
        });
        if (!existente) {
            return res.status(404).json({ message: 'Vínculo não encontrado' });
        }

        await prisma.campeonatoModalidade.delete({ where: { idCampeonatoModalidade: existente.idCampeonatoModalidade } });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ message: 'Erro ao remover categoria do campeonato', error: String(err) });
    }
};

export const listarCategoriasDeCampeonato = async (req: Request, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        if (isNaN(idCampeonato)) {
            return res.status(400).json({ message: 'Parâmetro idCampeonato inválido' });
        }

        const campeonato = await prisma.campeonato.findUnique({ where: { idCampeonato } });
        if (!campeonato) return res.status(404).json({ message: 'Campeonato não encontrado' });

        const categorias = await prisma.campeonatoModalidade.findMany({
            where: { idCampeonato },
            include: { categoria: true },
            orderBy: { idCampeonatoModalidade: 'asc' }
        });

        res.status(200).json(categorias.map(cm => cm.categoria));
    } catch (err) {
        res.status(400).json({ message: 'Erro ao listar categorias do campeonato', error: String(err) });
    }
};

