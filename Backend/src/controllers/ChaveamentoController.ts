import { Request, Response } from 'express';
import prisma from '../lib/prisma';
const MODALIDADES_EQUIPE = new Set(['KATA_EQUIPE', 'KUMITE_EQUIPE']);

const isEquipeModalidade = (modalidade?: string | null) => MODALIDADES_EQUIPE.has(modalidade ?? '');

async function refreshCampeonatoChaveamentoStatus(idCampeonato: number) {
	const camp = await prisma.campeonato.findUnique({
		where: { idCampeonato },
		select: { chaveamentoGerado: true },
	});
	if (!camp) return;

	const modalidades = await prisma.campeonatoModalidade.findMany({
		where: { idCampeonato },
		include: { categoria: true },
	});

	if (!modalidades.length) {
		if (camp.chaveamentoGerado) {
			await prisma.campeonato.update({ where: { idCampeonato }, data: { chaveamentoGerado: false } });
		}
		return;
	}

	const resolvedFlags = await Promise.all(
		modalidades.map(async (modalidade) => {
			const equipe = isEquipeModalidade(modalidade.categoria?.modalidade);
			if (equipe) {
				const finalMatch = await prisma.partidaEquipe.findFirst({
					where: { idCampeonatoModalidade: modalidade.idCampeonatoModalidade },
					orderBy: [{ round: 'desc' }, { position: 'asc' }],
				});
				return !!finalMatch?.resultado;
			}
			const finalMatch = await prisma.partidaAtleta.findFirst({
				where: { idCampeonatoModalidade: modalidade.idCampeonatoModalidade },
				orderBy: [{ round: 'desc' }, { position: 'asc' }],
			});
			return !!finalMatch?.resultado;
		}),
	);

	const allChampionsDefined = resolvedFlags.length > 0 && resolvedFlags.every(Boolean);

	if (camp.chaveamentoGerado !== allChampionsDefined) {
		await prisma.campeonato.update({
			where: { idCampeonato },
			data: { chaveamentoGerado: allChampionsDefined },
		});
	}
}

function shuffle<T>(array: T[]): T[] {
	const a = array.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const tmp = a[i];
			a[i] = a[j] as T;
			a[j] = tmp as T;
		}
	return a;
}

async function getCategoriaModalidadeOr404(idCampeonatoModalidade: number) {
	const cm = await prisma.campeonatoModalidade.findUnique({
		where: { idCampeonatoModalidade },
		include: { categoria: true, campeonato: true }
	});
	if (!cm) throw Object.assign(new Error('Categoria não encontrada'), { status: 404 });
	return cm;
}

function createAssociationBuckets<T extends { associacaoId?: number }>(items: T[]): Array<{ key: string | number; bucket: T[] }> {
	let uniqueCounter = 0;
	const groups = new Map<string | number, T[]>();
	for (const item of shuffle(items)) {
		const key = item.associacaoId != null ? `assoc:${item.associacaoId}` : `unique:${uniqueCounter++}`;
		const bucket = groups.get(key);
		if (bucket) bucket.push(item);
		else groups.set(key, [item]);
	}
	return Array.from(groups.entries()).map(([key, bucket]) => ({ key, bucket: shuffle(bucket) }));
}

function distributeParticipants<T>(heap: Array<{ key: string | number; bucket: T[] }>): T[] {
	const ordered: T[] = [];
	let prev: { key: string | number; bucket: T[] } | null = null;
	const sortHeap = () => {
		heap.sort((a, b) => {
			const diff = b.bucket.length - a.bucket.length;
			if (diff !== 0) return diff;
			return Math.random() - 0.5;
		});
	};
	while (heap.length > 0) {
		sortHeap();
		const current = heap.shift()!;
		const participant = current.bucket.shift()!;
		ordered.push(participant);
		if (prev && prev.bucket.length > 0) heap.push(prev);
		prev = current.bucket.length > 0 ? current : null;
	}
	if (prev && prev.bucket.length > 0) ordered.push(...prev.bucket);
	return ordered;
}

function toPairs<T>(ordered: T[]): Array<[T | null, T | null]> {
	const pairs: Array<[T | null, T | null]> = [];
	for (let i = 0; i < ordered.length; i += 2) {
		pairs.push([ordered[i] ?? null, ordered[i + 1] ?? null]);
	}
	return pairs;
}

function pairWithAssociationSeparation<T extends { associacaoId?: number }>(items: T[]): Array<[T | null, T | null]> {
	if (items.length === 0) return [];
	const heap = createAssociationBuckets(items);
	const ordered = distributeParticipants(heap);
	return toPairs(ordered);
}

function countRoundsFromMatches(matchCount: number): number {
	if (matchCount <= 0) return 0;
	let rounds = 1; 
	let size = matchCount;
	while (size > 1) {
		size = Math.ceil(size / 2);
		rounds += 1;
	}
	return rounds;
}

function httpError(status: number, message: string): never {
	const error = new Error(message);
	(error as any).status = status;
	throw error;
}

type Participant = { id: number; associacaoId?: number };
type Pair = [Participant | null, Participant | null];

interface BracketOps {
	createMany(args: any): Promise<any>;
	update(args: any): Promise<any>;
	makeRound1Row(pair: Pair, index: number): any;
	makeEmptyRow(round: number, position: number): any;
	makeByeUpdateArgs(targetRound: number, position: number, slot: 1 | 2, winnerId: number): { where: any; data: any };
}

async function propagateByes(idCampeonatoModalidade: number, ops: BracketOps, lastRound: number) {
	for (let round = 2; round <= lastRound; round++) {
		const currentRoundMatches = await (ops as any).findMany({
			where: { idCampeonatoModalidade, round }
		});

		for (const match of currentRoundMatches) {
			const hasPlayer1 = (ops as any).hasPlayer1(match);
			const hasPlayer2 = (ops as any).hasPlayer2(match);

			const exactlyOnePlayer = (hasPlayer1 && !hasPlayer2) || (!hasPlayer1 && hasPlayer2);
			if (!exactlyOnePlayer || match.resultado) continue;

			const nextRound = round + 1;
			const winnerId = hasPlayer1 ? (ops as any).getPlayer1Id(match) : (ops as any).getPlayer2Id(match);

			if (round < lastRound) {
				await ops.update({
					where: (ops as any).getMatchWhere(match),
					data: { resultado: 'BYE' }
				});
			}

			if (nextRound <= lastRound) {
				const nextPos = Math.ceil(match.position / 2);
				const slot: 1 | 2 = match.position % 2 === 1 ? 1 : 2;
				await ops.update(ops.makeByeUpdateArgs(nextRound, nextPos, slot, winnerId));
			}
		}
	}
}

async function buildBracket(firstRoundPairs: Pair[], ops: BracketOps) {
	const round1Rows = firstRoundPairs.map((pair, idx) => ops.makeRound1Row(pair, idx));
	if (round1Rows.length) await ops.createMany({ data: round1Rows, skipDuplicates: true });

	const lastRound = countRoundsFromMatches(firstRoundPairs.length);
	for (let round = 2; round <= lastRound; round++) {
		const positions = Math.ceil(firstRoundPairs.length / (2 ** (round - 1)));
		if (positions <= 0) continue;
		const rows = Array.from({ length: positions }, (_, idx) => ops.makeEmptyRow(round, idx + 1));
		if (rows.length) await ops.createMany({ data: rows, skipDuplicates: true });
	}

	if (lastRound >= 2) {
		const updates = firstRoundPairs
			.map((pair, idx) => {
				if (!pair) return null;
				const [a, b] = pair;
				if (!a || b) return null;
				const nextPos = Math.ceil((idx + 1) / 2);
				const slot: 1 | 2 = (idx + 1) % 2 === 1 ? 1 : 2;
				return ops.update(ops.makeByeUpdateArgs(2, nextPos, slot, a.id));
			})
			.filter(Boolean) as Promise<any>[];
		if (updates.length) await Promise.all(updates);
	}

	return lastRound;
}

async function generateEquipeBracket(idCampeonatoModalidade: number) {
	const inscritos = await prisma.inscricaoEquipe.findMany({
		where: { idCampeonatoModalidade, status: 'INSCRITO' },
		include: { equipe: true }
	});
	if (inscritos.length < 2) httpError(400, 'Inscrições insuficientes para gerar chaveamento');
	const enriched: Participant[] = inscritos.map(i => ({ id: i.idInscricaoEquipe, associacaoId: i.equipe?.idAssociacao }));
	const firstRoundPairs = pairWithAssociationSeparation(enriched);
	const ops = {
		createMany: (args: any) => prisma.partidaEquipe.createMany(args),
		update: (args: any) => prisma.partidaEquipe.update(args),
		findMany: (args: any) => prisma.partidaEquipe.findMany(args),
		hasPlayer1: (match: any) => match.idInscricaoEquipe1 !== null,
		hasPlayer2: (match: any) => match.idInscricaoEquipe2 !== null,
		getPlayer1Id: (match: any) => match.idInscricaoEquipe1,
		getPlayer2Id: (match: any) => match.idInscricaoEquipe2,
		getMatchWhere: (match: any) => ({
			idCampeonatoModalidade_round_position: {
				idCampeonatoModalidade: match.idCampeonatoModalidade,
				round: match.round,
				position: match.position
			}
		}),
		makeRound1Row: (pair: Pair, idx: number) => {
			const [a, b] = pair;
			return {
				idCampeonatoModalidade,
				round: 1,
				position: idx + 1,
				idInscricaoEquipe1: a?.id ?? null,
				idInscricaoEquipe2: b?.id ?? null,
				resultado: a && !b ? 'BYE' : null,
			};
		},
		makeEmptyRow: (round: number, position: number) => ({
			idCampeonatoModalidade,
			round,
			position,
		}),
		makeByeUpdateArgs: (round: number, position: number, slot: 1 | 2, winnerId: number) => ({
			where: ({ idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round, position } } as any),
			data: ({ [slot === 1 ? 'idInscricaoEquipe1' : 'idInscricaoEquipe2']: winnerId } as any),
		}),
	};
	const lastRound = await buildBracket(firstRoundPairs, ops);
	await propagateByes(idCampeonatoModalidade, ops, lastRound);
	return 'Chaveamento (equipes) criado com rounds';
}

async function generateAtletaBracket(idCampeonatoModalidade: number) {
	const inscritos = await prisma.inscricaoAtleta.findMany({
		where: { idCampeonatoModalidade, status: 'INSCRITO' },
		include: { atleta: true }
	});
	if (inscritos.length < 2) httpError(400, 'Inscrições insuficientes para gerar chaveamento');
	const enriched: Participant[] = inscritos.map(i => ({ id: i.idInscricaoAtleta, associacaoId: i.atleta?.idAssociacao }));
	const firstRoundPairs = pairWithAssociationSeparation(enriched);
	const ops = {
		createMany: (args: any) => prisma.partidaAtleta.createMany(args),
		update: (args: any) => prisma.partidaAtleta.update(args),
		findMany: (args: any) => prisma.partidaAtleta.findMany(args),
		hasPlayer1: (match: any) => match.idInscricaoAtleta1 !== null,
		hasPlayer2: (match: any) => match.idInscricaoAtleta2 !== null,
		getPlayer1Id: (match: any) => match.idInscricaoAtleta1,
		getPlayer2Id: (match: any) => match.idInscricaoAtleta2,
		getMatchWhere: (match: any) => ({
			idCampeonatoModalidade_round_position: {
				idCampeonatoModalidade: match.idCampeonatoModalidade,
				round: match.round,
				position: match.position
			}
		}),
		makeRound1Row: (pair: Pair, idx: number) => {
			const [a, b] = pair;
			return {
				idCampeonatoModalidade,
				round: 1,
				position: idx + 1,
				idInscricaoAtleta1: a?.id ?? null,
				idInscricaoAtleta2: b?.id ?? null,
				resultado: a && !b ? 'BYE' : null,
			};
		},
		makeEmptyRow: (round: number, position: number) => ({
			idCampeonatoModalidade,
			round,
			position,
		}),
		makeByeUpdateArgs: (round: number, position: number, slot: 1 | 2, winnerId: number) => ({
			where: ({ idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round, position } } as any),
			data: ({ [slot === 1 ? 'idInscricaoAtleta1' : 'idInscricaoAtleta2']: winnerId } as any),
		}),
	};
	const lastRound = await buildBracket(firstRoundPairs, ops);
	await propagateByes(idCampeonatoModalidade, ops, lastRound);
	return 'Chaveamento (atletas) criado com rounds';
}

async function resetEquipeBracket(idCampeonatoModalidade: number) {
	await prisma.partidaEquipe.deleteMany({ where: { idCampeonatoModalidade } });
}

async function resetAtletaBracket(idCampeonatoModalidade: number) {
	await prisma.partidaAtleta.deleteMany({ where: { idCampeonatoModalidade } });
}

export default {
	async gerar(req: Request, res: Response) {
		try {
			const idCampeonatoModalidade = Number(req.params.idCampeonatoModalidade);
			if (!idCampeonatoModalidade) return res.status(400).json({ message: 'Categoria inválida' });
			const cm = await getCategoriaModalidadeOr404(idCampeonatoModalidade);
			const mod = cm.categoria?.modalidade;
			const isEquipe = isEquipeModalidade(mod);
			const existingMatches = isEquipe
				? await prisma.partidaEquipe.count({ where: { idCampeonatoModalidade } })
				: await prisma.partidaAtleta.count({ where: { idCampeonatoModalidade } });
			if (existingMatches > 0) return res.status(409).json({ message: 'Chaveamento já foi gerado para esta categoria' });

			const message = isEquipe
				? await generateEquipeBracket(idCampeonatoModalidade)
				: await generateAtletaBracket(idCampeonatoModalidade);
			await refreshCampeonatoChaveamentoStatus(cm.idCampeonato);
			return res.json({ message });
		} catch (err: any) {
			const status = err?.status || 500;
			return res.status(status).json({ message: err?.message || 'Erro ao gerar chaveamento' });
		}
	},

	async reset(req: Request, res: Response) {
		try {
			const idCampeonatoModalidade = Number(req.params.idCampeonatoModalidade);
			if (!idCampeonatoModalidade) return res.status(400).json({ message: 'Categoria inválida' });
			const cm = await getCategoriaModalidadeOr404(idCampeonatoModalidade);
			const mod = cm.categoria?.modalidade;
			const isEquipe = isEquipeModalidade(mod);
			if (isEquipe) await resetEquipeBracket(idCampeonatoModalidade);
			else await resetAtletaBracket(idCampeonatoModalidade);
			await refreshCampeonatoChaveamentoStatus(cm.idCampeonato);
			return res.status(204).send();
		} catch (err: any) {
			const status = err?.status || 500;
			return res.status(status).json({ message: err?.message || 'Erro ao resetar chaveamento' });
		}
	},

	async listarPartidasAtletaPorCategoria(req: Request, res: Response) {
		try {
			const idCampeonatoModalidade = Number(req.params.idCampeonatoModalidade);
			if (!idCampeonatoModalidade) return res.status(400).json({ message: 'Categoria inválida' });
			const partidas = await prisma.partidaAtleta.findMany({
				where: { idCampeonatoModalidade },
				include: {
					inscricaoAtleta1: { 
						include: { 
							atleta: {
								include: {
									associacao: true,
								},
							},
							campeonatoModalidade: true,
						},
					},
					inscricaoAtleta2: { 
						include: { 
							atleta: {
								include: {
									associacao: true,
								},
							},
							campeonatoModalidade: true,
						},
					},
				},
				orderBy: [{ round: 'asc' }, { position: 'asc' }],
			});
			return res.json(partidas);
		} catch (err: any) {
			return res.status(500).json({ message: err?.message || 'Erro ao listar partidas de atleta' });
		}
	},

	async listarPartidasEquipePorCategoria(req: Request, res: Response) {
		try {
			const idCampeonatoModalidade = Number(req.params.idCampeonatoModalidade);
			if (!idCampeonatoModalidade) return res.status(400).json({ message: 'Categoria inválida' });
			const partidas = await prisma.partidaEquipe.findMany({
				where: { idCampeonatoModalidade },
				include: {
					inscricaoEquipe1: { 
						include: { 
							equipe: {
								include: {
									associacao: true,
								},
							},
							campeonatoModalidade: true,
						},
					},
					inscricaoEquipe2: { 
						include: { 
							equipe: {
								include: {
									associacao: true,
								},
							},
							campeonatoModalidade: true,
						},
					},
				},
				orderBy: [{ round: 'asc' }, { position: 'asc' }],
			});
			return res.json(partidas);
		} catch (err: any) {
			return res.status(500).json({ message: err?.message || 'Erro ao listar partidas de equipe' });
		}
	},

	async avancarAtleta(req: Request, res: Response) {
		try {
			const { idPartida, vencedor } = req.body as { idPartida: number; vencedor: 1 | 2 };
			if (!idPartida || (vencedor !== 1 && vencedor !== 2)) return res.status(400).json({ message: 'Parâmetros inválidos' });
			const partida = await prisma.partidaAtleta.findUnique({ where: { idPartidaAtleta: idPartida }, include: { inscricaoAtleta1: true, inscricaoAtleta2: true } });
			if (!partida) return res.status(404).json({ message: 'Partida não encontrada' });
			const vencedorId = vencedor === 1 ? partida.idInscricaoAtleta1 : partida.idInscricaoAtleta2;
			if (!vencedorId) return res.status(400).json({ message: 'Partida sem adversário válido' });
			await prisma.partidaAtleta.update({ where: { idPartidaAtleta: idPartida }, data: { resultado: `VENCEDOR_${vencedor}` } });
			const { idCampeonatoModalidade, round, position } = partida as any;
			const nextRound = round + 1;
			const nextPos = Math.ceil(position / 2);
			const side = position % 2 === 1 ? 1 : 2; 
			const nextMatch = await prisma.partidaAtleta.findUnique({ where: ({
				idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
			} as any) });
			if (!nextMatch) {
				const cm = await prisma.campeonatoModalidade.findUnique({
					where: { idCampeonatoModalidade },
					select: { idCampeonato: true },
				});
				if (cm) await refreshCampeonatoChaveamentoStatus(cm.idCampeonato);
				return res.json({ championId: vencedorId });
			}
			const nextField = side === 1 ? 'idInscricaoAtleta1' : 'idInscricaoAtleta2';
			const updated = await prisma.partidaAtleta.update({ where: ({
				idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
			} as any), data: ({ [nextField]: vencedorId } as any) });
			return res.json({ nextId: updated.idPartidaAtleta });
		} catch (err: any) {
			return res.status(500).json({ message: err?.message || 'Erro ao avançar atleta' });
		}
	},

	async avancarEquipe(req: Request, res: Response) {
		try {
			const { idPartida, vencedor } = req.body as { idPartida: number; vencedor: 1 | 2 };
			if (!idPartida || (vencedor !== 1 && vencedor !== 2)) return res.status(400).json({ message: 'Parâmetros inválidos' });
			const partida = await prisma.partidaEquipe.findUnique({ where: { idPartidaEquipe: idPartida }, include: { inscricaoEquipe1: true, inscricaoEquipe2: true } });
			if (!partida) return res.status(404).json({ message: 'Partida não encontrada' });
			const vencedorId = vencedor === 1 ? partida.idInscricaoEquipe1 : partida.idInscricaoEquipe2;
			if (!vencedorId) return res.status(400).json({ message: 'Partida sem adversário válido' });
			await prisma.partidaEquipe.update({ where: { idPartidaEquipe: idPartida }, data: { resultado: `VENCEDOR_${vencedor}` } });
			const { idCampeonatoModalidade, round, position } = partida as any;
			const nextRound = round + 1;
			const nextPos = Math.ceil(position / 2);
			const side = position % 2 === 1 ? 1 : 2;
			const nextMatch = await prisma.partidaEquipe.findUnique({ where: ({
				idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
			} as any) });
			if (!nextMatch) {
				const cm = await prisma.campeonatoModalidade.findUnique({
					where: { idCampeonatoModalidade },
					select: { idCampeonato: true },
				});
				if (cm) await refreshCampeonatoChaveamentoStatus(cm.idCampeonato);
				return res.json({ championId: vencedorId });
			}
			const nextField = side === 1 ? 'idInscricaoEquipe1' : 'idInscricaoEquipe2';
			const updated = await prisma.partidaEquipe.update({ where: ({
				idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
			} as any), data: ({ [nextField]: vencedorId } as any) });
			return res.json({ nextId: updated.idPartidaEquipe });
		} catch (err: any) {
			return res.status(500).json({ message: err?.message || 'Erro ao avançar equipe' });
		}
	},

	async desfazerAtleta(req: Request, res: Response) {
		try {
			const { idPartida } = req.body as { idPartida: number };
			if (!idPartida) return res.status(400).json({ message: 'ID da partida é obrigatório' });
			
			const partida = await prisma.partidaAtleta.findUnique({ 
				where: { idPartidaAtleta: idPartida },
			});
			if (!partida) return res.status(404).json({ message: 'Partida não encontrada' });
			if (!partida.resultado || partida.resultado === 'BYE') {
				return res.status(400).json({ message: 'Esta partida não possui resultado para desfazer' });
			}

			const { idCampeonatoModalidade, round, position } = partida as any;
			
			const nextRound = round + 1;
			const nextPos = Math.ceil(position / 2);
			const nextMatch = await prisma.partidaAtleta.findUnique({ 
				where: ({
					idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
				} as any)
			});
			
			if (nextMatch?.resultado && nextMatch.resultado !== 'BYE') {
				return res.status(400).json({ 
					message: 'Não é possível desfazer. A próxima partida já possui resultado definido.' 
				});
			}

			await prisma.partidaAtleta.update({ 
				where: { idPartidaAtleta: idPartida }, 
				data: { resultado: null } 
			});

			if (nextMatch) {
				const side = position % 2 === 1 ? 1 : 2;
				const nextField = side === 1 ? 'idInscricaoAtleta1' : 'idInscricaoAtleta2';
				await prisma.partidaAtleta.update({ 
					where: ({
						idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
					} as any), 
					data: ({ [nextField]: null } as any) 
				});
			}

			const cm = await prisma.campeonatoModalidade.findUnique({
				where: { idCampeonatoModalidade },
				select: { idCampeonato: true },
			});
			if (cm) await refreshCampeonatoChaveamentoStatus(cm.idCampeonato);

			return res.json({ message: 'Resultado desfeito com sucesso' });
		} catch (err: any) {
			return res.status(500).json({ message: err?.message || 'Erro ao desfazer resultado' });
		}
	},

	async desfazerEquipe(req: Request, res: Response) {
		try {
			const { idPartida } = req.body as { idPartida: number };
			if (!idPartida) return res.status(400).json({ message: 'ID da partida é obrigatório' });
			
			const partida = await prisma.partidaEquipe.findUnique({ 
				where: { idPartidaEquipe: idPartida },
			});
			if (!partida) return res.status(404).json({ message: 'Partida não encontrada' });
			if (!partida.resultado || partida.resultado === 'BYE') {
				return res.status(400).json({ message: 'Esta partida não possui resultado para desfazer' });
			}

			const { idCampeonatoModalidade, round, position } = partida as any;
			
			const nextRound = round + 1;
			const nextPos = Math.ceil(position / 2);
			const nextMatch = await prisma.partidaEquipe.findUnique({ 
				where: ({
					idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
				} as any)
			});
			
			if (nextMatch?.resultado && nextMatch.resultado !== 'BYE') {
				return res.status(400).json({ 
					message: 'Não é possível desfazer. A próxima partida já possui resultado definido.' 
				});
			}

			await prisma.partidaEquipe.update({ 
				where: { idPartidaEquipe: idPartida }, 
				data: { resultado: null } 
			});

			if (nextMatch) {
				const side = position % 2 === 1 ? 1 : 2;
				const nextField = side === 1 ? 'idInscricaoEquipe1' : 'idInscricaoEquipe2';
				await prisma.partidaEquipe.update({ 
					where: ({
						idCampeonatoModalidade_round_position: { idCampeonatoModalidade, round: nextRound, position: nextPos }
					} as any), 
					data: ({ [nextField]: null } as any) 
				});
			}

			const cm = await prisma.campeonatoModalidade.findUnique({
				where: { idCampeonatoModalidade },
				select: { idCampeonato: true },
			});
			if (cm) await refreshCampeonatoChaveamentoStatus(cm.idCampeonato);

			return res.json({ message: 'Resultado desfeito com sucesso' });
		} catch (err: any) {
			return res.status(500).json({ message: err?.message || 'Erro ao desfazer resultado' });
		}
	},
};
