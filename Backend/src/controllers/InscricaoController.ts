import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const listarInscricoesAtletas = async (req: Request, res: Response) => {
  try {
    const inscricoes = await prisma.inscricaoAtleta.findMany({
      orderBy: { idInscricaoAtleta: 'asc' },
      include: {
        atleta: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    res.status(200).json(inscricoes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar inscrições de atletas', error: String(err) });
  }
};

export const listarInscricoesAtletaPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const insc = await prisma.inscricaoAtleta.findUnique({
      where: { idInscricaoAtleta: id },
      include: {
        atleta: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    if (!insc) return res.status(404).json({ message: 'Inscrição de atleta não encontrada' });
    res.status(200).json(insc);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar inscrição de atleta', error: String(err) });
  }
};

export const listarInscricoesAtletaPorAtleta = async (req: Request, res: Response) => {
  try {
    const idAtleta = Number(req.params.idAtleta);
    const inscricoes = await prisma.inscricaoAtleta.findMany({
      where: { idAtleta },
      orderBy: { idInscricaoAtleta: 'asc' },
      include: {
        atleta: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    res.status(200).json(inscricoes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar inscrições do atleta', error: String(err) });
  }
};

export const listarInscricoesAtletaPorCampeonato = async (req: Request, res: Response) => {
  try {
    const idCampeonatoModalidade = Number(req.params.idCampeonatoModalidade);
    const inscricoes = await prisma.inscricaoAtleta.findMany({
      where: { idCampeonatoModalidade },
      orderBy: { idInscricaoAtleta: 'asc' },
      include: {
        atleta: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    res.status(200).json(inscricoes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar inscrições por campeonato modalidade', error: String(err) });
  }
};

export const cadastrarInscricaoAtleta = async (req: Request, res: Response) => {
  try {
    const { idAtleta, idCampeonatoModalidade, status } = req.body as {
      idAtleta?: number; idCampeonatoModalidade?: number; status?: any
    };
    if (!idAtleta || !idCampeonatoModalidade) {
      return res.status(400).json({ message: 'idAtleta e idCampeonatoModalidade são obrigatórios' });
    }

    const cm = await prisma.campeonatoModalidade.findUnique({ where: { idCampeonatoModalidade: Number(idCampeonatoModalidade) } });
    if (!cm) return res.status(404).json({ message: 'CampeonatoModalidade não encontrado' });
    const camp = await prisma.campeonato.findUnique({ where: { idCampeonato: cm.idCampeonato } });
    if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
    if (camp.inscricoesConfirmadas) {
      return res.status(409).json({ message: 'Inscrições já confirmadas. Alterações bloqueadas.' });
    }

    const existente = await prisma.inscricaoAtleta.findFirst({ where: { idAtleta, idCampeonatoModalidade } });
    if (existente) {
      return res.status(409).json({ message: 'Inscrição de atleta já existente para esta modalidade do campeonato', data: existente });
    }

    const created = await prisma.inscricaoAtleta.create({
      data: { idAtleta, idCampeonatoModalidade, status },
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Inscrição duplicada (atleta já inscrito nesta modalidade)', error: String(err) });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Atleta ou CampeonatoModalidade não encontrado', error: String(err) });
    }
    res.status(400).json({ message: 'Erro ao cadastrar inscrição de atleta', error: String(err) });
  }
};

export const atualizarInscricaoAtleta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    
    const existente = await prisma.inscricaoAtleta.findUnique({ where: { idInscricaoAtleta: id }, include: { campeonatoModalidade: true } });
    if (!existente) return res.status(404).json({ message: 'Inscrição de atleta não encontrada' });
    const camp = await prisma.campeonato.findUnique({ where: { idCampeonato: existente.campeonatoModalidade.idCampeonato } });
    if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
    if (camp.inscricoesConfirmadas) {
      return res.status(409).json({ message: 'Inscrições já confirmadas. Alterações bloqueadas.' });
    }
    const updated = await prisma.inscricaoAtleta.update({ where: { idInscricaoAtleta: id }, data });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar inscrição de atleta', error: String(err) });
  }
};


export const listarInscricoesEquipes = async (req: Request, res: Response) => {
  try {
    const inscricoes = await prisma.inscricaoEquipe.findMany({
      orderBy: { idInscricaoEquipe: 'asc' },
      include: {
        equipe: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    res.status(200).json(inscricoes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar inscrições de equipes', error: String(err) });
  }
};

export const listarInscricoesEquipePorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const insc = await prisma.inscricaoEquipe.findUnique({
      where: { idInscricaoEquipe: id },
      include: {
        equipe: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    if (!insc) return res.status(404).json({ message: 'Inscrição de equipe não encontrada' });
    res.status(200).json(insc);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar inscrição de equipe', error: String(err) });
  }
};

export const listarInscricoesEquipePorEquipe = async (req: Request, res: Response) => {
  try {
    const idEquipe = Number(req.params.idEquipe);
    const inscricoes = await prisma.inscricaoEquipe.findMany({
      where: { idEquipe },
      orderBy: { idInscricaoEquipe: 'asc' },
      include: {
        equipe: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    res.status(200).json(inscricoes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar inscrições da equipe', error: String(err) });
  }
};

export const listarInscricoesEquipePorCampeonato = async (req: Request, res: Response) => {
  try {
    const idCampeonatoModalidade = Number(req.params.idCampeonatoModalidade);
    const inscricoes = await prisma.inscricaoEquipe.findMany({
      where: { idCampeonatoModalidade },
      orderBy: { idInscricaoEquipe: 'asc' },
      include: {
        equipe: true,
        campeonatoModalidade: { include: { categoria: true, campeonato: true } },
      },
    });
    res.status(200).json(inscricoes);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar inscrições por campeonato modalidade', error: String(err) });
  }
};

export const cadastrarInscricaoEquipe = async (req: Request, res: Response) => {
  try {
    const { idEquipe, idCampeonatoModalidade, status } = req.body as {
      idEquipe?: number; idCampeonatoModalidade?: number; status?: any
    };
    if (!idEquipe || !idCampeonatoModalidade) {
      return res.status(400).json({ message: 'idEquipe e idCampeonatoModalidade são obrigatórios' });
    }

    const cm = await prisma.campeonatoModalidade.findUnique({ where: { idCampeonatoModalidade: Number(idCampeonatoModalidade) } });
    if (!cm) return res.status(404).json({ message: 'CampeonatoModalidade não encontrado' });
    const camp = await prisma.campeonato.findUnique({ where: { idCampeonato: cm.idCampeonato } });
    if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
    if (camp.inscricoesConfirmadas) {
      return res.status(409).json({ message: 'Inscrições já confirmadas. Alterações bloqueadas.' });
    }

    const existente = await prisma.inscricaoEquipe.findFirst({ where: { idEquipe, idCampeonatoModalidade } });
    if (existente) {
      return res.status(409).json({ message: 'Inscrição de equipe já existente para esta modalidade do campeonato', data: existente });
    }

    const created = await prisma.inscricaoEquipe.create({
      data: { idEquipe, idCampeonatoModalidade, status },
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Inscrição duplicada (equipe já inscrita nesta modalidade)', error: String(err) });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Equipe ou CampeonatoModalidade não encontrado', error: String(err) });
    }
    res.status(400).json({ message: 'Erro ao cadastrar inscrição de equipe', error: String(err) });
  }
};

export const atualizarInscricaoEquipe = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const existente = await prisma.inscricaoEquipe.findUnique({ where: { idInscricaoEquipe: id }, include: { campeonatoModalidade: true } });
    if (!existente) return res.status(404).json({ message: 'Inscrição de equipe não encontrada' });
    const camp = await prisma.campeonato.findUnique({ where: { idCampeonato: existente.campeonatoModalidade.idCampeonato } });
    if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
    if (camp.inscricoesConfirmadas) {
      return res.status(409).json({ message: 'Inscrições já confirmadas. Alterações bloqueadas.' });
    }
    const updated = await prisma.inscricaoEquipe.update({ where: { idInscricaoEquipe: id }, data });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar inscrição de equipe', error: String(err) });
  }
};


