import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Ordem padrão de graduação (Kyu -> Dan)
const ORDEM_GRADUACAO_PADRAO = [
  '10º KYU','9º KYU','8º KYU','7º KYU','6º KYU','5º KYU','4º KYU','3º KYU','2º KYU','1º KYU',
  '1º DAN','2º DAN','3º DAN','4º DAN','5º DAN','6º DAN','7º DAN','8º DAN','9º DAN','10º DAN'
];

const getGraduacaoIndex = (g: string | null | undefined) => {
  const n = (g || '').trim().toUpperCase();
  const i = ORDEM_GRADUACAO_PADRAO.indexOf(n);
  return i === -1 ? ORDEM_GRADUACAO_PADRAO.length + 1 : i;
};

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
        atleta: {
          include: {
            associacao: true,
          },
        },
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

    const cm = await prisma.campeonatoModalidade.findUnique({ where: { idCampeonatoModalidade: Number(idCampeonatoModalidade) }, include: { categoria: true } });
    if (!cm) return res.status(404).json({ message: 'CampeonatoModalidade não encontrado' });
    const camp = await prisma.campeonato.findUnique({ where: { idCampeonato: cm.idCampeonato } });
    if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
    if (camp.inscricoesConfirmadas) {
      return res.status(409).json({ message: 'Inscrições já confirmadas. Alterações bloqueadas.' });
    }

    const categoria = cm.categoria;
    if (!categoria) {
      return res.status(404).json({ message: 'Categoria da modalidade não encontrada' });
    }

    const atleta = await prisma.atleta.findUnique({ where: { idAtleta: Number(idAtleta) } });
    if (!atleta) return res.status(404).json({ message: 'Atleta não encontrado' });

    const reasons: Record<string, string> = {};

    const referenceDate = camp.dataInicio || new Date();
    const ref = new Date(referenceDate);
    const nascimento = new Date(atleta.dataNascimento);
    let idade = ref.getFullYear() - nascimento.getFullYear();
    const mDiff = ref.getMonth() - nascimento.getMonth();
    if (mDiff < 0 || (mDiff === 0 && ref.getDate() < nascimento.getDate())) idade--;

    if (categoria.faixaIdadeMin != null && idade < categoria.faixaIdadeMin) {
      reasons.idade = `Idade (${idade}) abaixo do mínimo (${categoria.faixaIdadeMin})`;
    }
    if (categoria.faixaIdadeMax != null && idade > categoria.faixaIdadeMax) {
      reasons.idade = `Idade (${idade}) acima do máximo (${categoria.faixaIdadeMax})`;
    }

    if (categoria.modalidade === 'KUMITE') {
      const pesoNumber = Number(atleta.peso);
      if (categoria.pesoMin != null && pesoNumber < Number(categoria.pesoMin)) {
        reasons.peso = `Peso (${pesoNumber}kg) abaixo do mínimo (${categoria.pesoMin}kg)`;
      }
      if (categoria.pesoMax != null && pesoNumber > Number(categoria.pesoMax)) {
        reasons.peso = `Peso (${pesoNumber}kg) acima do máximo (${categoria.pesoMax}kg)`;
      }
    }

    const idx = (g: string | null | undefined) => {
      const n = (g || '').trim().toUpperCase();
      const i = ORDEM_GRADUACAO_PADRAO.indexOf(n);
      return i === -1 ? ORDEM_GRADUACAO_PADRAO.length + 1 : i; // desconhecida fica fora
    };
    if (categoria.graduacaoMin) {
      if (idx(atleta.graduacao) < idx(categoria.graduacaoMin)) {
        reasons.graduacao = `Graduação (${atleta.graduacao}) abaixo do mínimo (${categoria.graduacaoMin})`;
      }
    }
    if (categoria.graduacaoMax) {
      if (idx(atleta.graduacao) > idx(categoria.graduacaoMax)) {
        reasons.graduacao = `Graduação (${atleta.graduacao}) acima do máximo (${categoria.graduacaoMax})`;
      }
    }

    if (categoria.genero && categoria.genero !== 'Misto' && atleta.genero !== categoria.genero) {
      reasons.genero = `Gênero (${atleta.genero}) diferente do exigido (${categoria.genero})`;
    }

    if (Object.keys(reasons).length) {
      return res.status(400).json({
        message: 'Atleta fora dos critérios da categoria',
        reasons,
      });
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
        equipe: {
          include: {
            associacao: true,
          },
        },
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

    const cm = await prisma.campeonatoModalidade.findUnique({ where: { idCampeonatoModalidade: Number(idCampeonatoModalidade) }, include: { categoria: true } });
    if (!cm) return res.status(404).json({ message: 'CampeonatoModalidade não encontrado' });
    const camp = await prisma.campeonato.findUnique({ where: { idCampeonato: cm.idCampeonato } });
    if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
    if (camp.inscricoesConfirmadas) {
      return res.status(409).json({ message: 'Inscrições já confirmadas. Alterações bloqueadas.' });
    }

    const categoria = cm.categoria;
    const equipe = await prisma.equipe.findUnique({ where: { idEquipe: Number(idEquipe) }, include: { membros: { include: { atleta: true } } } });
    if (!equipe) return res.status(404).json({ message: 'Equipe não encontrada' });
    if ((categoria?.genero && categoria.genero !== 'Misto') && equipe.genero !== categoria.genero) {
      return res.status(400).json({ message: 'Equipe fora dos critérios de gênero da categoria', reasons: { genero: `Gênero da equipe (${equipe.genero}) difere de (${categoria.genero})` } });
    }

    if (!categoria) return res.status(404).json({ message: 'Categoria não encontrada' });
    const membros = equipe.membros || [];
    if (membros.length === 0) {
      return res.status(400).json({ message: 'Equipe sem membros não pode ser inscrita' });
    }
    const reasons: Record<string, string> = {};
    const referenceDate = (await prisma.campeonato.findUnique({ where: { idCampeonato: cm.idCampeonato } }))?.dataInicio || new Date();
    const ref = new Date(referenceDate);

    const idades = membros.map(m => {
      const n = new Date(m.atleta.dataNascimento);
      let idade = ref.getFullYear() - n.getFullYear();
      const md = ref.getMonth() - n.getMonth();
      if (md < 0 || (md === 0 && ref.getDate() < n.getDate())) idade--;
      return idade;
    });
    const minIdade = Math.min(...idades);
    const maxIdade = Math.max(...idades);
    if (categoria.faixaIdadeMin != null && minIdade < categoria.faixaIdadeMin) {
      reasons.idade = `Idade mínima dos membros (${minIdade}) abaixo do mínimo (${categoria.faixaIdadeMin})`;
    }
    if (categoria.faixaIdadeMax != null && maxIdade > categoria.faixaIdadeMax) {
      reasons.idade = `Idade máxima dos membros (${maxIdade}) acima do máximo (${categoria.faixaIdadeMax})`;
    }

    const idxEquipe = (g: string | null | undefined) => {
      const n = (g || '').trim().toUpperCase();
      const i = ORDEM_GRADUACAO_PADRAO.indexOf(n);
      return i === -1 ? ORDEM_GRADUACAO_PADRAO.length + 1 : i;
    };
    if (categoria.graduacaoMin || categoria.graduacaoMax) {
      const indices = membros.map(m => idxEquipe(m.atleta.graduacao));
      const minIdx = Math.min(...indices);
      const maxIdx = Math.max(...indices);
      if (categoria.graduacaoMin && minIdx < idxEquipe(categoria.graduacaoMin)) {
        reasons.graduacao = `Há membro(s) com graduação abaixo do mínimo (${categoria.graduacaoMin})`;
      }
      if (categoria.graduacaoMax && maxIdx > idxEquipe(categoria.graduacaoMax)) {
        reasons.graduacao = `Há membro(s) com graduação acima do máximo (${categoria.graduacaoMax})`;
      }
    }

    if (categoria.modalidade === 'KUMITE_EQUIPE') {
      const pesos = membros.map(m => Number(m.atleta.peso));
      const minPeso = Math.min(...pesos);
      const maxPeso = Math.max(...pesos);
      if (categoria.pesoMin != null && minPeso < Number(categoria.pesoMin)) {
        reasons.peso = `Peso mínimo dos membros (${minPeso}kg) abaixo do mínimo (${categoria.pesoMin}kg)`;
      }
      if (categoria.pesoMax != null && maxPeso > Number(categoria.pesoMax)) {
        reasons.peso = `Peso máximo dos membros (${maxPeso}kg) acima do máximo (${categoria.pesoMax}kg)`;
      }
    }

    if (Object.keys(reasons).length) {
      return res.status(400).json({ message: 'Equipe fora dos critérios da categoria', reasons });
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


