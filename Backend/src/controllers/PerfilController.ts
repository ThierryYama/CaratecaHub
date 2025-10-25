import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const obterPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const idAssociacao = req.user!.idAssociacao;
    const associacao = await prisma.associacao.findUnique({
      where: { idAssociacao },
      select: {
        idAssociacao: true,
        nome: true,
        cnpj: true,
        telefone: true,
        email: true,
        sigla: true,
        createdAt: true,
      }
    });

    if (!associacao) {
      return res.status(404).json({ message: 'Associação não encontrada' });
    }

    const endereco = await prisma.endereco.findFirst({
      where: { idAssociacao, campeonatos: { none: {} } },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ ...associacao, endereco });
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ message: 'Erro ao buscar perfil', error: String(err) });
  }
};

export const atualizarPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const idAssociacao = req.user!.idAssociacao;
    const { nome, telefone, email, sigla, senha, endereco } = req.body;

    if (!nome || !telefone || !email) {
      return res.status(400).json({ message: 'Nome, telefone e email são obrigatórios' });
    }

    if (email) {
      const emailEmUso = await prisma.associacao.findFirst({
        where: {
          email,
          NOT: { idAssociacao }
        }
      });
      if (emailEmUso) {
        return res.status(409).json({ message: 'Este email já está em uso por outra associação' });
      }
    }

    const dataUpdate: any = {
      nome,
      telefone,
      email,
      sigla: sigla ?? null
    };

    if (senha && senha.trim() !== '') {
      dataUpdate.senha = await bcrypt.hash(senha, 10);
    }

    const associacaoAtualizada = await prisma.associacao.update({
      where: { idAssociacao },
      data: dataUpdate,
      select: {
        idAssociacao: true,
        nome: true,
        cnpj: true,
        telefone: true,
        email: true,
        sigla: true
      }
    });

    let enderecoAtualizado = null;
    if (endereco && endereco.rua && endereco.numero && endereco.bairro && endereco.cidade && endereco.estado && endereco.cep) {
      const enderecoExistente = await prisma.endereco.findFirst({
        where: { idAssociacao, campeonatos: { none: {} } },
        orderBy: { createdAt: 'desc' }
      });

      if (enderecoExistente) {
        enderecoAtualizado = await prisma.endereco.update({
          where: { idEndereco: enderecoExistente.idEndereco },
          data: {
            rua: endereco.rua,
            numero: endereco.numero,
            complemento: endereco.complemento ?? null,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep
          }
        });
      } else {
        enderecoAtualizado = await prisma.endereco.create({
          data: {
            rua: endereco.rua,
            numero: endereco.numero,
            complemento: endereco.complemento ?? null,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep,
            idAssociacao
          }
        });
      }
    }

    res.status(200).json({ 
      ...associacaoAtualizada, 
      endereco: enderecoAtualizado 
    });
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar perfil', error: String(err) });
  }
};

export const deletarPerfil = async (req: AuthRequest, res: Response) => {
  try {
    const idAssociacao = req.user!.idAssociacao;

    const [campeonatos, atletas, equipes] = await Promise.all([
      prisma.campeonato.count({ where: { idAssociacao } }),
      prisma.atleta.count({ where: { idAssociacao } }),
      prisma.equipe.count({ where: { idAssociacao } })
    ]);

    if (campeonatos > 0 || atletas > 0 || equipes > 0) {
      return res.status(409).json({ 
        message: 'Não é possível excluir a conta pois existem dados vinculados (campeonatos, atletas ou equipes)',
        details: { campeonatos, atletas, equipes }
      });
    }

    await prisma.endereco.deleteMany({ where: { idAssociacao } });

    await prisma.categoria.deleteMany({ where: { idAssociacao } });

    await prisma.associacao.delete({ where: { idAssociacao } });

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: 'Erro ao deletar perfil', error: String(err) });
  }
};
