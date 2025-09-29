import { Request, Response } from "express";
import prisma from '../lib/prisma';


export const cadastrarEquipe = async (req: Request, res: Response) => {
  const { nome, descricao, idAssociacao, atletasIds, genero } = req.body;

  if (!nome || !idAssociacao || !atletasIds) {
    return res.status(400).json({ error: "Nome, idAssociacao e atletasIds são obrigatórios." });
  }

  try {
    const generoEquipe = (genero as string) || 'Misto';
    if (!['Masculino', 'Feminino', 'Outro', 'Misto'].includes(generoEquipe)) {
      return res.status(400).json({ error: "Gênero inválido para equipe." });
    }

    if (generoEquipe !== 'Misto') {
      const atletas = await prisma.atleta.findMany({
        where: { idAtleta: { in: atletasIds as number[] } },
        select: { idAtleta: true, genero: true },
      });
      const incompativel = atletas.find(a => a.genero !== generoEquipe);
      if (incompativel) {
        return res.status(400).json({ error: `Atleta ${incompativel.idAtleta} possui gênero '${incompativel.genero}' incompatível com equipe '${generoEquipe}'.` });
      }
    }

    const equipe = await prisma.equipe.create({
      data: ({
        nome,
        descricao,
        genero: generoEquipe,
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
      } as any),
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
  const { nome, descricao, genero } = req.body;

  try {
    let dataUpdate: any = { nome, descricao };
    if (genero) {
      if (!['Masculino', 'Feminino', 'Outro', 'Misto'].includes(genero)) {
        return res.status(400).json({ error: "Gênero inválido para equipe." });
      }
      dataUpdate.genero = genero;
    }
    const equipe = await prisma.equipe.update({
      where: { idEquipe: Number(id) },
      data: dataUpdate,
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
        const [equipe, atleta] = await Promise.all([
          prisma.equipe.findUnique({ where: { idEquipe: Number(idEquipe) } }),
          prisma.atleta.findUnique({ where: { idAtleta: Number(idAtleta) } }),
        ]);

        if (!equipe || !atleta) {
          return res.status(404).json({ error: "Equipe ou Atleta não encontrado." });
        }

        const generoEquipe = ((equipe as any).genero ?? 'Misto') as string;
        const generoAtleta = ((atleta as any).genero ?? 'Outro') as string;
        if (generoEquipe !== 'Misto' && generoAtleta !== generoEquipe) {
          return res.status(400).json({ error: `Gênero do atleta (${generoAtleta}) incompatível com equipe (${generoEquipe}).` });
        }

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


