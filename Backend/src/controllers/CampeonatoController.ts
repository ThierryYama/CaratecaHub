import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const listarCampeonatos = async (req: AuthRequest, res: Response) => {
    try {
        const idAssociacao = req.user!.idAssociacao;
        const campeonatos = await prisma.campeonato.findMany({ where: { idAssociacao }, orderBy: { idCampeonato: 'asc' } });
        res.status(200).json(campeonatos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar campeonatos', error: String(err) });
    }
};

export const listarCampeonatosPublicos = async (req: AuthRequest, res: Response) => {
    try {
        const idAssociacao = req.user!.idAssociacao;
        const campeonatos = await prisma.campeonato.findMany({
            where: { idAssociacao: { not: idAssociacao } },
            orderBy: { idCampeonato: 'asc' },
            include: {
                associacao: true,
                endereco: true,
                modalidades: {
                    include: { categoria: true }
                }
            }
        });
        res.status(200).json(campeonatos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar campeonatos públicos', error: String(err) });
    }
};

export const listarCampeonatoPorIdDeAssociacao = async (req: AuthRequest, res: Response) => {
    try {
        const tokenAssociacao = req.user!.idAssociacao;
        const paramId = Number(req.params.id);
        if (!Number.isNaN(paramId) && paramId !== tokenAssociacao) {
            return res.status(403).json({ message: 'Acesso negado: associação inválida.' });
        }
        const campeonatos = await prisma.campeonato.findMany({
            where: { idAssociacao: tokenAssociacao },
            orderBy: { idCampeonato: 'asc' }
        });
        res.status(200).json(campeonatos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar campeonatos por ID de associação', error: String(err) });
    }
};

export const listarCampeonatoPorId = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const idAssociacao = req.user!.idAssociacao;
        const campeonato = await prisma.campeonato.findFirst({
            where: { idCampeonato: id, idAssociacao },
            include: {
                associacao: true,
                endereco: true,
                modalidades: {
                    include: {
                        categoria: true
                    }
                }
            }
        });
        if (!campeonato) {
            return res.status(404).json({ message: 'Campeonato não encontrado' });
        }
        res.status(200).json(campeonato);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar campeonato', error: String(err) });
    }
};

export const listarCampeonatoPublicoPorId = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const campeonato = await prisma.campeonato.findFirst({
            where: { idCampeonato: id },
            include: {
                associacao: true,
                endereco: true,
                modalidades: {
                    include: {
                        categoria: true
                    }
                }
            }
        });
        if (!campeonato) {
            return res.status(404).json({ message: 'Campeonato não encontrado' });
        }
        res.status(200).json(campeonato);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar campeonato público', error: String(err) });
    }
};

export const cadastrarCampeonato = async (req: AuthRequest, res: Response) => {
    try {
    const { endereco, idEndereco, dataInicio, dataFim, idAssociacao: _, ...campeonatoData } = req.body;
        const idAssociacao = req.user!.idAssociacao;

        if (!endereco && !idEndereco) {
            return res.status(400).json({ message: 'Você deve fornecer um objeto "endereco" para criar um novo ou um "idEndereco" para vincular a um existente.' });
        }

        if (endereco && idEndereco) {
            return res.status(400).json({ message: 'Forneça apenas "endereco" ou "idEndereco", não ambos.' });
        }

        const dataCreate: any = {
            ...campeonatoData,
            dataInicio: new Date(dataInicio),
            associacao: {
                connect: {
                    idAssociacao: Number(idAssociacao)
                }
            }
        };

        if (dataFim) {
            dataCreate.dataFim = new Date(dataFim);
        }

        if (endereco) {
            const { idAssociacao: _endId, ...enderecoData } = endereco;
            dataCreate.endereco = {
                create: {
                    ...enderecoData
                }
            };
        } else if (idEndereco) {
            dataCreate.endereco = {
                connect: { idEndereco: Number(idEndereco) }
            };
        }

        const campeonato = await prisma.campeonato.create({
            data: dataCreate,
            include: {
                endereco: true
            }
        });

        res.status(201).json(campeonato);

    } catch (err: any) {
        console.error('Erro ao criar campeonato:', err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: `Associação ou Endereço com o ID informado não foi encontrado.`, error: String(err) });
        }
        res.status(400).json({ message: 'Erro ao criar campeonato', error: String(err) });
    }
};

export const atualizarCampeonato = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const idAssociacao = req.user!.idAssociacao;
        const data: any = { ...req.body };
        delete data.idAssociacao;
        const result = await prisma.campeonato.updateMany({ where: { idCampeonato: id, idAssociacao }, data });
        if (result.count === 0) return res.status(404).json({ message: 'Campeonato não encontrado' });
        const campeonato = await prisma.campeonato.findFirst({ where: { idCampeonato: id, idAssociacao } });
        res.status(200).json(campeonato);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar campeonato', error: String(err) });
    }
};

export const deletarCampeonato = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        const idAssociacao = req.user!.idAssociacao;
        const result = await prisma.campeonato.deleteMany({ where: { idCampeonato: id, idAssociacao } });
        if (result.count === 0) return res.status(404).json({ message: 'Campeonato não encontrado' });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ message: 'Erro ao remover campeonato', error: String(err) });
    }
};

export const adicionarCategoriaAoCampeonato = async (req: AuthRequest, res: Response) => {
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
        if (campeonato.categoriasConfirmadas) {
            return res.status(409).json({ message: 'Categorias já confirmadas. Alterações bloqueadas.' });
        }
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

export const removerCategoriaDeCampeonato = async (req: AuthRequest, res: Response) => {
    try {
    const idCampeonato = Number(req.params.idCampeonato);
    const idCategoria = Number(req.params.idCategoria);

        if (Number.isNaN(idCampeonato) || Number.isNaN(idCategoria)) {
            return res.status(400).json({ message: 'Parâmetros inválidos' });
        }

        const campeonato = await prisma.campeonato.findUnique({ where: { idCampeonato } });
        if (!campeonato) return res.status(404).json({ message: 'Campeonato não encontrado' });
        if (campeonato.categoriasConfirmadas) {
            return res.status(409).json({ message: 'Categorias já confirmadas. Alterações bloqueadas.' });
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

export const listarCategoriasDeCampeonato = async (req: AuthRequest, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        if (Number.isNaN(idCampeonato)) {
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

export const atualizarEnderecoCampeonato = async (req: AuthRequest, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        if (Number.isNaN(idCampeonato)) {
            return res.status(400).json({ message: 'Parâmetro idCampeonato inválido' });
        }

    const campos = req.body;
        if (!campos || Object.keys(campos).length === 0) {
            return res.status(400).json({ message: 'Informe campos para atualização do endereço' });
        }

        const campeonato = await prisma.campeonato.findUnique({
            where: { idCampeonato },
            select: { idEndereco: true }
        });
        if (!campeonato) return res.status(404).json({ message: 'Campeonato não encontrado' });

        const enderecoAtualizado = await prisma.endereco.update({
            where: { idEndereco: campeonato.idEndereco },
            data: campos
        });
        return res.status(200).json({ message: 'Endereço atualizado', endereco: enderecoAtualizado });
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar endereço do campeonato', error: String(err) });
    }
};

export const confirmarCategorias = async (req: AuthRequest, res: Response) => {
    try {
    const idCampeonato = Number(req.params.idCampeonato);
        const camp = await prisma.campeonato.findUnique({ where: { idCampeonato }, include: { modalidades: true } });
        if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
        if (camp.categoriasConfirmadas) return res.status(409).json({ message: 'Etapa já confirmada' });
        if ((camp.modalidades?.length ?? 0) === 0) {
            return res.status(400).json({ message: 'Vincule ao menos uma categoria antes de confirmar' });
        }
        const updated = await prisma.campeonato.update({ where: { idCampeonato }, data: { categoriasConfirmadas: true } });
        return res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao confirmar categorias', error: String(err) });
    }
};

export const confirmarInscricoes = async (req: AuthRequest, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        const camp = await prisma.campeonato.findUnique({ where: { idCampeonato } });
        if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
        if (!camp.categoriasConfirmadas) return res.status(400).json({ message: 'Confirme categorias antes de confirmar inscrições' });
        if (camp.inscricoesConfirmadas) return res.status(409).json({ message: 'Etapa já confirmada' });

        const [countAtletas, countEquipes] = await Promise.all([
            prisma.inscricaoAtleta.count({ where: { campeonatoModalidade: { idCampeonato } } }),
            prisma.inscricaoEquipe.count({ where: { campeonatoModalidade: { idCampeonato } } }),
        ]);
        if (countAtletas + countEquipes === 0) return res.status(400).json({ message: 'É necessário ter ao menos uma inscrição para confirmar' });

        const updated = await prisma.campeonato.update({ where: { idCampeonato }, data: { inscricoesConfirmadas: true } });
        return res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao confirmar inscrições', error: String(err) });
    }
};

export const VerificarEtapasDoCampeonato = async (req: AuthRequest, res: Response) => {
    try {
        const idCampeonato = Number(req.params.idCampeonato);
        const camp = await prisma.campeonato.findUnique({ where: { idCampeonato } });
        if (!camp) return res.status(404).json({ message: 'Campeonato não encontrado' });
        const modalidades = await prisma.campeonatoModalidade.count({ where: { idCampeonato } });
        const countAtletas = await prisma.inscricaoAtleta.count({ where: { campeonatoModalidade: { idCampeonato } } });
        const countEquipes = await prisma.inscricaoEquipe.count({ where: { campeonatoModalidade: { idCampeonato } } });

        return res.status(200).json({
            idCampeonato,
            modalidades,
            inscricoesAtleta: countAtletas,
            inscricoesEquipe: countEquipes,
            categoriasConfirmadas: camp.categoriasConfirmadas ?? false,
            inscricoesConfirmadas: camp.inscricoesConfirmadas ?? false,
            chaveamentoGerado: camp.chaveamentoGerado ?? false,
        });
    } catch (err) {
        res.status(400).json({ message: 'Erro ao obter etapas do campeonato', error: String(err) });
    }
};

