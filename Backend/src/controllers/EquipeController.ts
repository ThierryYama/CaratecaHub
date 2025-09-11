import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const cadastrarEquipe = async (req: Request, res: Response) => {
  const { nome, descricao, idAssociacao, atletasIds } = req.body;

  if (!nome || !idAssociacao || !atletasIds) {
    return res.status(400).json({ error: "Nome, idAssociacao e atletasIds são obrigatórios." });
  }

  try {
    const equipe = await prisma.equipe.create({
      data: {
        nome,
        descricao,
        associacao: {
          connect: { idAssociacao: Number(idAssociacao) }
        },
        membros: {
          create: atletasIds.map((idAtleta: number) => ({
            atleta: {
              connect: { idAtleta: idAtleta },
            },
          })),
        },
      },
      include: {
        membros: {
          include: {
            atleta: true,
          },
        },
      },
    });
    return res.status(201).json(equipe);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível criar a equipe." });
  }
};

export const listarTodasEquipes = async (req: Request, res: Response) => {
  try {
    const equipes = await prisma.equipe.findMany({
      include: {
        membros: {
          include: {
            atleta: true,
          },
        },
      },
    });
    return res.status(200).json(equipes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível obter as equipes." });
  }
};


export const atualizarEquipe = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  try {
    const equipe = await prisma.equipe.update({
      where: { idEquipe: Number(id) },
      data: {
        nome,
        descricao,
      },
    });
    return res.status(200).json(equipe);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível atualizar a equipe." });
  }
};

export const deletarEquipe = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.equipe.delete({
      where: { idEquipe: Number(id) },
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível deletar a equipe." });
  }
};

export const adicionarAtletaAEquipe = async (req: Request, res: Response) => {
    const { idEquipe, idAtleta } = req.params;

    try {
        const equipeAtleta = await prisma.equipeAtleta.create({
            data: {
                equipe: { connect: { idEquipe: Number(idEquipe) } },
                atleta: { connect: { idAtleta: Number(idAtleta) } }
            }
        });
        return res.status(201).json(equipeAtleta);
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return res.status(409).json({ error: "Atleta já pertence a esta equipe." });
        }
        return res.status(500).json({ error: "Não foi possível adicionar o atleta à equipe." });
    }
};

export const deletarAtletaDaEquipe = async (req: Request, res: Response) => {
    const { idEquipe, idAtleta } = req.params;

    try {
        await prisma.equipeAtleta.delete({
            where: {
                idEquipe_idAtleta: {
                    idEquipe: Number(idEquipe),
                    idAtleta: Number(idAtleta)
                }
            }
        });
        return res.status(204).send();
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ error: "Associação entre atleta e equipe não encontrada." });
        }
        return res.status(500).json({ error: "Não foi possível remover o atleta da equipe." });
    }
};


