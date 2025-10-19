import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
	fetchCampeonatoPublicoById,
	fetchAtletas,
	fetchEquipes,
	createInscricaoAtleta,
	createInscricaoEquipe,
	fetchInscricoesAtletaPorIdDeCampeonatoModalidade,
	fetchInscricoesEquipePorIdDeCampeonatoModalidade,
	updateInscricaoAtleta,
	updateInscricaoEquipe,
	Modalidade,
	InscricaoAtleta,
	InscricaoEquipe,
	CampeonatoDetalhado,
	StatusInscricao,
} from '@/services/api';
import { 
	UserRound, 
	Users, 
	Trophy, 
	CalendarDays, 
	MapPin, 
	Building2, 
	Search, 
	CheckCircle2, 
	ArrowLeft,
	Filter,
	Award,
	Weight,
	UserCheck
} from 'lucide-react';

	const modalidadeLabel = (m?: Modalidade) => {
		const base = (m ?? '').toString().split('_').join(' ').toLowerCase();
		return base
			.split(' ')
			.map(w => (w && w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
			.join(' ');
	};
const isEquipeModalidade = (m?: string) => m === 'KATA_EQUIPE' || m === 'KUMITE_EQUIPE';
const isIndividualModalidade = (m?: string) => m === 'KATA' || m === 'KUMITE';

const InscreverAtletas: React.FC = () => {
	const { toggle } = useSidebar();
	const navigate = useNavigate();
	const [tab, setTab] = useState<'atletas' | 'equipes'>('atletas');
	const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const { toast } = useToast();

	const params = useParams<{ id?: string }>();
	const campeonatoId = useMemo(() => (params.id ? Number(params.id) : undefined), [params.id]);
	const queryClient = useQueryClient();

	const { data: camp } = useQuery<CampeonatoDetalhado>({
		queryKey: ['campeonatoPublico', campeonatoId],
		queryFn: () => {
			if (!campeonatoId) throw new Error('Campeonato não definido');
			return fetchCampeonatoPublicoById(campeonatoId);
		},
		enabled: !!campeonatoId,
		staleTime: 0,
	});

	const categoriasModalidades = camp?.modalidades ?? [];
	const modalidadesIndividuais = categoriasModalidades.filter(m => isIndividualModalidade(m.categoria?.modalidade));
	const modalidadesEquipe = categoriasModalidades.filter(m => isEquipeModalidade(m.categoria?.modalidade));

  

	const { data: inscricoesAtletas } = useQuery<InscricaoAtleta[]>({
		queryKey: ['inscricoesAtletasPorModalidade', selectedModalidadeId],
		queryFn: () => fetchInscricoesAtletaPorIdDeCampeonatoModalidade(Number(selectedModalidadeId)),
		enabled: tab === 'atletas' && selectedModalidadeId != null,
	});
	const { data: inscricoesEquipes } = useQuery<InscricaoEquipe[]>({
		queryKey: ['inscricoesEquipesPorModalidade', selectedModalidadeId],
		queryFn: () => fetchInscricoesEquipePorIdDeCampeonatoModalidade(Number(selectedModalidadeId)),
		enabled: tab === 'equipes' && selectedModalidadeId != null,
	});

	const inscreverAtleta = useMutation({
		mutationFn: async (vars: { idAtleta: number; idCampeonatoModalidade: number }) => {
			const created = await createInscricaoAtleta({ idAtleta: vars.idAtleta, idCampeonatoModalidade: vars.idCampeonatoModalidade });
			if (created?.idInscricaoAtleta && created.status !== StatusInscricao.INSCRITO) {
				return await updateInscricaoAtleta(created.idInscricaoAtleta, { status: StatusInscricao.INSCRITO });
			}
			return created;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['inscricoesAtletasPorModalidade', selectedModalidadeId] });
			toast({ title: 'Atleta inscrito com sucesso' });
		},
		onError: (e: any) => toast({ title: 'Falha ao inscrever atleta', description: e?.message || 'Tente novamente', variant: 'destructive' }),
	});

	const inscreverEquipe = useMutation({
		mutationFn: async (vars: { idEquipe: number; idCampeonatoModalidade: number }) => {
			const created = await createInscricaoEquipe({ idEquipe: vars.idEquipe, idCampeonatoModalidade: vars.idCampeonatoModalidade });
			if (created?.idInscricaoEquipe && created.status !== StatusInscricao.INSCRITO) {
				return await updateInscricaoEquipe(created.idInscricaoEquipe, { status: StatusInscricao.INSCRITO });
			}
			return created;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['inscricoesEquipesPorModalidade', selectedModalidadeId] });
			toast({ title: 'Equipe inscrita com sucesso' });
		},
		onError: (e: any) => toast({ title: 'Falha ao inscrever equipe', description: e?.message || 'Tente novamente', variant: 'destructive' }),
	});

	const selectableModalidades = tab === 'atletas' ? modalidadesIndividuais : modalidadesEquipe;
	const selectedModalidade = useMemo(() => {
		const id = typeof selectedModalidadeId === 'number' ? selectedModalidadeId : -1;
		return selectableModalidades.find(m => m.idCampeonatoModalidade === id);
	}, [selectableModalidades, selectedModalidadeId]);

	useEffect(() => {
		const list = selectableModalidades;
		if (!list.length) {
			setSelectedModalidadeId(null);
			return;
		}
		if (selectedModalidadeId == null || !list.some(m => m.idCampeonatoModalidade === selectedModalidadeId)) {
			setSelectedModalidadeId(list[0].idCampeonatoModalidade);
		}
	}, [tab, categoriasModalidades, selectableModalidades, selectedModalidadeId]);

	type ListItem = { idAtleta?: number; idEquipe?: number; genero?: string; nome?: string; graduacao?: string; peso?: number };

	const { data: atletasDisponiveis } = useQuery({ queryKey: ['atletasExternos'], queryFn: fetchAtletas });
	const { data: equipesDisponiveis } = useQuery({ queryKey: ['equipesExternas'], queryFn: fetchEquipes });

		const availableList = useMemo(() => {
			const baseList = (tab === 'atletas' ? (atletasDisponiveis ?? []) : (equipesDisponiveis ?? [])) as unknown as ListItem[];
			const catGenero = selectedModalidade?.categoria?.genero;

			// remove já inscritos
			const excludeSet = new Set(
				tab === 'atletas'
					? (inscricoesAtletas ?? []).map(i => i.idAtleta)
					: (inscricoesEquipes ?? []).map(i => i.idEquipe)
			);
			let list = baseList.filter((item: any) => (tab === 'atletas' ? !excludeSet.has(item.idAtleta) : !excludeSet.has(item.idEquipe)));

			// filtro por gênero conforme categoria
			if (catGenero) {
				if (tab === 'atletas') {
					if (catGenero !== 'Misto') list = list.filter((a: any) => a.genero === catGenero);
				} else {
					list = list.filter((e: any) => (catGenero === 'Misto' ? e.genero === 'Misto' : e.genero === catGenero));
				}
			}
			return list;
		}, [tab, selectedModalidade, inscricoesAtletas, inscricoesEquipes, atletasDisponiveis, equipesDisponiveis]);

	const filteredList = useMemo(() => {
		if (!search.trim()) return availableList;
		const q = search.toLowerCase();
		return availableList.filter((i: any) => (i.nome || '').toLowerCase().includes(q));
	}, [availableList, search]);

	const getGeneroBadgeClass = (g?: string) => {
		if (g === 'Masculino') return 'bg-blue-50 text-blue-600 border border-blue-200';
		if (g === 'Feminino') return 'bg-pink-50 text-pink-600 border border-pink-200';
		if (g === 'Misto') return 'bg-purple-50 text-purple-600 border border-purple-200';
		return 'bg-gray-50 text-gray-600 border border-gray-200';
	};

	return (
		<div className="min-h-screen flex w-full bg-background">
			<Sidebar />
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onToggleSidebar={toggle} />
				<main className="flex-1 overflow-y-auto p-8">
					<div className="max-w-7xl mx-auto space-y-8">
						{/* Header com informações do campeonato */}
						<div className="space-y-4">
							<Button
								variant="ghost"
								onClick={() => navigate('/campeonatos-publicos')}
								className="mb-2"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Voltar para Campeonatos Públicos
							</Button>

							<div className="flex justify-between items-start">
								<div className="space-y-2">
									<h1 className="text-3xl font-bold text-foreground">Inscrever Atletas/Equipes</h1>
									<p className="text-muted-foreground">Selecione a categoria e inscreva seus participantes</p>
								</div>
								<Trophy className="w-12 h-12 text-red-600" />
							</div>

							{/* Info do campeonato */}
							{camp && (
								<Card>
									<CardContent className="pt-6">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="flex items-center gap-3">
												<Trophy className="w-5 h-5 text-red-600" />
												<div>
													<p className="text-sm text-muted-foreground">Campeonato</p>
													<p className="font-semibold">{camp.nome}</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Building2 className="w-5 h-5 text-blue-600" />
												<div>
													<p className="text-sm text-muted-foreground">Organizador</p>
													<p className="font-semibold">
														{camp.associacao?.sigla ? `${camp.associacao.sigla} • ` : ''}{camp.associacao?.nome || `#${camp.idAssociacao}`}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<CalendarDays className="w-5 h-5 text-green-600" />
												<div>
													<p className="text-sm text-muted-foreground">Data</p>
													<p className="font-semibold">{new Date(camp.dataInicio).toLocaleDateString('pt-BR')}</p>
												</div>
											</div>
										</div>
										{camp.endereco && (
											<div className="mt-4 pt-4 border-t flex items-center gap-2 text-muted-foreground">
												<MapPin className="w-4 h-4" />
												<span className="text-sm">{camp.endereco.cidade} - {camp.endereco.estado}</span>
											</div>
										)}
									</CardContent>
								</Card>
							)}
						</div>

						{/* Seleção de tipo (Atletas/Equipes) */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Filter className="w-5 h-5" />
									Selecione o Tipo de Inscrição
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4">
									<button
										onClick={() => { setTab('atletas'); setSelectedModalidadeId(null); }}
										className={`p-6 rounded-lg border-2 transition-all ${
											tab === 'atletas'
												? 'border-red-600 bg-red-50 shadow-md'
												: 'border-gray-200 hover:border-gray-300'
										}`}
									>
										<div className="flex flex-col items-center gap-3">
											<UserRound className={`w-10 h-10 ${tab === 'atletas' ? 'text-red-600' : 'text-gray-400'}`} />
											<span className={`font-semibold text-lg ${tab === 'atletas' ? 'text-red-600' : 'text-gray-700'}`}>
												Atletas Individuais
											</span>
											<span className="text-sm text-muted-foreground">
												{modalidadesIndividuais.length} {modalidadesIndividuais.length === 1 ? 'categoria' : 'categorias'}
											</span>
										</div>
									</button>

									<button
										onClick={() => { setTab('equipes'); setSelectedModalidadeId(null); }}
										className={`p-6 rounded-lg border-2 transition-all ${
											tab === 'equipes'
												? 'border-red-600 bg-red-50 shadow-md'
												: 'border-gray-200 hover:border-gray-300'
										}`}
									>
										<div className="flex flex-col items-center gap-3">
											<Users className={`w-10 h-10 ${tab === 'equipes' ? 'text-red-600' : 'text-gray-400'}`} />
											<span className={`font-semibold text-lg ${tab === 'equipes' ? 'text-red-600' : 'text-gray-700'}`}>
												Equipes
											</span>
											<span className="text-sm text-muted-foreground">
												{modalidadesEquipe.length} {modalidadesEquipe.length === 1 ? 'categoria' : 'categorias'}
											</span>
										</div>
									</button>
								</div>
							</CardContent>
						</Card>

						{/* Seleção de Categoria (Cards visuais) */}
						{selectableModalidades.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Award className="w-5 h-5" />
										Selecione a Categoria
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{selectableModalidades.map((m) => {
											const isSelected = selectedModalidadeId === m.idCampeonatoModalidade;
											const cat = m.categoria;
											return (
												<button
													key={m.idCampeonatoModalidade}
													onClick={() => setSelectedModalidadeId(m.idCampeonatoModalidade)}
													className={`p-4 rounded-lg border-2 transition-all text-left ${
														isSelected
															? 'border-red-600 bg-red-50 shadow-md'
															: 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
													}`}
												>
													<div className="space-y-3">
														<div className="flex items-start justify-between gap-2">
															<h3 className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
																{cat?.nome}
															</h3>
															{isSelected && <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />}
														</div>

														<div className="space-y-2 text-sm">
															<div className="flex items-center gap-2 text-muted-foreground">
																<Trophy className="w-4 h-4 shrink-0" />
																<span>{modalidadeLabel(cat?.modalidade)}</span>
															</div>

															<div className="flex items-center gap-2">
																<Badge variant="outline" className={getGeneroBadgeClass(cat?.genero)}>
																	{cat?.genero}
																</Badge>
																<Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
																	{cat?.faixaIdadeMin} - {cat?.faixaIdadeMax} anos
																</Badge>
															</div>

															<div className="text-xs text-muted-foreground space-y-1">
																<div className="flex items-center gap-1">
																	<Award className="w-3 h-3" />
																	<span>{cat?.graduacaoMin} a {cat?.graduacaoMax}</span>
																</div>
																{Boolean(cat?.pesoMin || cat?.pesoMax) && (
																	<div className="flex items-center gap-1">
																		<Weight className="w-3 h-3" />
																		<span>
																			{(() => {
																				if (cat?.pesoMin && cat?.pesoMax) return `${cat.pesoMin}kg - ${cat.pesoMax}kg`;
																				if (cat?.pesoMin) return `≥ ${cat.pesoMin}kg`;
																				return `≤ ${cat?.pesoMax}kg`;
																			})()}
																		</span>
																	</div>
																)}
															</div>
														</div>
													</div>
												</button>
											);
										})}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Busca e lista de atletas/equipes disponíveis */}
						{selectedModalidadeId != null && (
							<>
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Search className="w-5 h-5" />
											Buscar {tab === 'atletas' ? 'Atletas' : 'Equipes'} Disponíveis
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="relative">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
											<Input
												id="buscarNome"
												type="text"
												value={search}
												onChange={(e) => setSearch(e.target.value)}
												className="pl-10"
												placeholder={tab === 'atletas' ? 'Digite o nome do atleta...' : 'Digite o nome da equipe...'}
											/>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center justify-between">
											<span className="flex items-center gap-2">
												{tab === 'atletas' ? <UserRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
												{tab === 'atletas' ? 'Atletas' : 'Equipes'} Disponíveis
											</span>
											<Badge variant="outline" className="text-sm">
												{filteredList.length} {filteredList.length === 1 ? 'disponível' : 'disponíveis'}
											</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent>
										{filteredList.length === 0 ? (
											<div className="text-center py-12 text-muted-foreground">
												<UserRound className="w-16 h-16 mx-auto mb-4 text-gray-300" />
												<p>Nenhum {tab === 'atletas' ? 'atleta' : 'equipe'} disponível para esta categoria.</p>
											</div>
										) : (
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												{filteredList.map((item: any) => {
													const assoc = item.associacao;
													const nomeAssociacao = assoc ? (assoc.nome || assoc.sigla || assoc.cnpj || `Assoc. #${item.idAssociacao}`) : null;
													
													return (
														<div key={(item.idAtleta ?? item.idEquipe)} className="p-4 border rounded-lg bg-card hover:shadow-md transition-all">
															<div className="space-y-3">
																<div className="flex items-start justify-between gap-2">
																	<div className="flex-1">
																		<h3 className="font-semibold text-card-foreground line-clamp-2" title={item.nome}>
																			{item.nome}
																		</h3>
																		<div className="flex flex-wrap gap-1 mt-1">
																			{item.genero && (
																				<Badge variant="outline" className={`${getGeneroBadgeClass(item.genero)}`}>
																					{item.genero}
																				</Badge>
																			)}
																			{nomeAssociacao && (
																				<Badge variant="outline" className="text-xs">
																					<Building2 className="w-3 h-3 mr-1" />
																					{nomeAssociacao}
																				</Badge>
																			)}
																		</div>
																	</div>
																</div>

																{tab === 'atletas' && (
																	<div className="space-y-2 text-sm text-muted-foreground">
																		<div className="flex items-center gap-2">
																			<Award className="w-4 h-4 shrink-0" />
																			<span>{item.graduacao}</span>
																		</div>
																		<div className="flex items-center gap-2">
																			<Weight className="w-4 h-4 shrink-0" />
																			<span>{item.peso} kg</span>
																		</div>
																	</div>
																)}

																<Button
																	disabled={selectedModalidadeId == null || inscreverAtleta.isPending || inscreverEquipe.isPending}
																	onClick={() => {
																		if (selectedModalidadeId == null) return;
																		const modId = Number(selectedModalidadeId);
																		if (tab === 'atletas') {
																			inscreverAtleta.mutate({ idAtleta: item.idAtleta, idCampeonatoModalidade: modId });
																		} else {
																			inscreverEquipe.mutate({ idEquipe: item.idEquipe, idCampeonatoModalidade: modId });
																		}
																	}}
																	className="w-full bg-red-600 hover:bg-red-700"
																>
																	<UserCheck className="w-4 h-4 mr-2" />
																	Inscrever
																</Button>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</CardContent>
								</Card>

								{/* Lista de inscritos */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<CheckCircle2 className="w-5 h-5 text-green-600" />
											Já Inscritos nesta Categoria
										</CardTitle>
									</CardHeader>
									<CardContent>
										{(() => {
											const currentInscricoes = tab === 'atletas' ? inscricoesAtletas : inscricoesEquipes;
											const inscricoesLength = (currentInscricoes ?? []).length;

											if (inscricoesLength === 0) {
												return (
													<div className="text-center py-8 text-muted-foreground">
														<p>Nenhuma inscrição realizada ainda nesta categoria.</p>
													</div>
												);
											}

											return (
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>{tab === 'atletas' ? 'Atleta' : 'Equipe'}</TableHead>
															<TableHead>Associação</TableHead>
															<TableHead>Status</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{(currentInscricoes ?? []).map((insc: any) => {
															const participante = tab === 'atletas' ? insc.atleta : insc.equipe;
															const assoc = participante?.associacao;
															const nomeAssociacao = assoc ? (assoc.nome || assoc.sigla || assoc.cnpj || `Assoc. #${participante.idAssociacao}`) : '-';
															
															return (
																<TableRow key={(insc.idInscricaoAtleta ?? insc.idInscricaoEquipe)}>
																	<TableCell className="font-medium">
																		{participante?.nome}
																	</TableCell>
																	<TableCell>
																		{assoc ? (
																			<Badge variant="outline" className="text-xs">
																				<Building2 className="w-3 h-3 mr-1" />
																				{nomeAssociacao}
																			</Badge>
																		) : (
																			<span className="text-muted-foreground text-xs">{nomeAssociacao}</span>
																		)}
																	</TableCell>
																	<TableCell>
																		<Badge className={insc.status === 'INSCRITO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
																			{insc.status}
																		</Badge>
																	</TableCell>
																</TableRow>
															);
														})}
													</TableBody>
												</Table>
											);
										})()}
									</CardContent>
								</Card>
							</>
						)}

						{/* Mensagem quando nenhuma categoria foi selecionada */}
						{!selectedModalidadeId && selectableModalidades.length > 0 && (
							<Card className="border-dashed">
								<CardContent className="pt-12 pb-12 text-center">
									<Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
									<p className="text-muted-foreground text-lg">
										Selecione uma categoria acima para começar a inscrever {tab === 'atletas' ? 'atletas' : 'equipes'}
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</main>
			</div>
		</div>
	);
};

export default InscreverAtletas;
