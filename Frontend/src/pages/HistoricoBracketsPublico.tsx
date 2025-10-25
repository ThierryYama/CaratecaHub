import React, { useState, useMemo } from 'react';
import {
  Trophy,
  History,
  Eye,
  GitBranch,
  Loader2,
  Crown,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChaveamentoBracket, {
  BracketParticipant,
  BracketRound,
  NormalizedBracket,
  BracketType,
} from '@/components/chaveamento/ChaveamentoBracket';
import { useSidebar } from '@/context/SidebarContext';
import { useToast } from '@/hooks/use-toast';
import {
  CampeonatoDetalhado,
  CampeonatoModalidadeWithCategoria,
  fetchCampeonatoDetalhadoPublico,
  fetchPartidasAtletaPorCategoria,
  fetchPartidasEquipePorCategoria,
  Modalidade,
  PartidaAtletaResponse,
  PartidaEquipeResponse,
  Status,
} from '@/services/api';

const isEquipeModalidade = (modalidade?: Modalidade) =>
  modalidade === Modalidade.KATA_EQUIPE || modalidade === Modalidade.KUMITE_EQUIPE;

const formatModalidade = (modalidade?: Modalidade) => {
  switch (modalidade) {
    case Modalidade.KATA:
      return 'Kata Individual';
    case Modalidade.KUMITE:
      return 'Kumite Individual';
    case Modalidade.KATA_EQUIPE:
      return 'Kata por Equipe';
    case Modalidade.KUMITE_EQUIPE:
      return 'Kumite por Equipe';
    default:
      return 'Modalidade';
  }
};

const winnerSlotFromResultado = (resultado: string | null): 1 | 2 | null => {
  if (!resultado) return null;
  if (resultado === 'BYE') return 1;
  if (resultado.toUpperCase().endsWith('_1')) return 1;
  if (resultado.toUpperCase().endsWith('_2')) return 2;
  return null;
};

const fallbackParticipantLabel = (round: number) =>
  round === 1 ? 'Vaga disponível' : 'Aguardando vencedor';

const createAtletaParticipant = (
  partida: PartidaAtletaResponse,
  slot: 1 | 2,
): BracketParticipant => {
  const inscricao = slot === 1 ? partida.inscricaoAtleta1 : partida.inscricaoAtleta2;
  if (!inscricao || !inscricao.atleta) {
    const isBye = partida.resultado === 'BYE' && slot === 2;
    const isAwaiting = partida.round > 1; // Aguardando vencedor em rodadas posteriores
    return {
      idInscricao: null,
      nome: isBye ? 'Sem adversário (BYE)' : fallbackParticipantLabel(partida.round),
      isBye: isBye || isAwaiting, // Trata "Aguardando vencedor" como BYE visual
    };
  }
  return {
    idInscricao: inscricao.idInscricaoAtleta,
    nome: inscricao.atleta.nome,
    associacao: inscricao.atleta.associacao 
      ? (inscricao.atleta.associacao.nome || inscricao.atleta.associacao.sigla)
      : undefined,
    detalhe: undefined,
    isBye: false,
  };
};

const createEquipeParticipant = (
  partida: PartidaEquipeResponse,
  slot: 1 | 2,
): BracketParticipant => {
  const inscricao = slot === 1 ? partida.inscricaoEquipe1 : partida.inscricaoEquipe2;
  if (!inscricao || !inscricao.equipe) {
    const isBye = partida.resultado === 'BYE' && slot === 2;
    const isAwaiting = partida.round > 1; // Aguardando vencedor em rodadas posteriores
    return {
      idInscricao: null,
      nome: isBye ? 'Sem adversário (BYE)' : fallbackParticipantLabel(partida.round),
      isBye: isBye || isAwaiting, // Trata "Aguardando vencedor" como BYE visual
    };
  }
  return {
    idInscricao: inscricao.idInscricaoEquipe,
    nome: inscricao.equipe.nome,
    associacao: inscricao.equipe.associacao 
      ? (inscricao.equipe.associacao.nome || inscricao.equipe.associacao.sigla)
      : undefined,
    detalhe: undefined,
    isBye: false,
  };
};

const normalizeMatches = (
  raw: PartidaAtletaResponse[] | PartidaEquipeResponse[],
  type: BracketType,
): NormalizedBracket | null => {
  if (!raw.length) return null;

  const matches = raw.map((match) => {
    const vencedorSlot = winnerSlotFromResultado(match.resultado);
    let participants: [BracketParticipant, BracketParticipant];

    if (type === 'ATLETA') {
      const partida = match as PartidaAtletaResponse;
      participants = [
        createAtletaParticipant(partida, 1),
        createAtletaParticipant(partida, 2),
      ];
    } else {
      const partida = match as PartidaEquipeResponse;
      participants = [
        createEquipeParticipant(partida, 1),
        createEquipeParticipant(partida, 2),
      ];
    }

    const id = 'idPartidaAtleta' in match ? match.idPartidaAtleta : match.idPartidaEquipe;

    return {
      id,
      round: match.round,
      position: match.position,
      resultado: match.resultado,
      vencedorSlot,
      participants,
    } satisfies BracketRound['matches'][number];
  });

  const roundsMap = new Map<number, BracketRound['matches']>();
  matches.forEach((match) => {
    const current = roundsMap.get(match.round) ?? [];
    current.push(match);
    roundsMap.set(match.round, current);
  });

  const rounds: BracketRound[] = Array.from(roundsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => ({
      round,
      matches: roundMatches.sort((a, b) => a.position - b.position),
    }));

  const firstRound = rounds.find((round) => round.round === 1);
  const participantSet = new Map<number, BracketParticipant>();
  firstRound?.matches.forEach((match) => {
    match.participants.forEach((participant) => {
      if (participant.idInscricao) {
        participantSet.set(participant.idInscricao, participant);
      }
    });
  });

  const fallbackTotal = firstRound
    ? firstRound.matches.reduce(
        (total, match) =>
          total + match.participants.filter((participant) => participant.idInscricao && !participant.isBye).length,
        0,
      )
    : 0;
  const totalParticipants = participantSet.size > 0 ? participantSet.size : fallbackTotal;
  
  // Calcula quantas rodadas deveriam existir e preenche vazias
  const expectedRounds = totalParticipants > 0 ? Math.ceil(Math.log2(totalParticipants)) : rounds.length;
  const completeRounds: BracketRound[] = [];
  for (let i = 1; i <= expectedRounds; i++) {
    const existingRound = rounds.find(r => r.round === i);
    completeRounds.push(existingRound || { round: i, matches: [] });
  }

  const finalRound = completeRounds[completeRounds.length - 1];
  let champion: BracketParticipant | null = null;
  if (finalRound) {
    const finalMatch = finalRound.matches[0];
    const hasRealResult = finalMatch && finalMatch.resultado && finalMatch.resultado !== 'BYE';
    if (hasRealResult && finalMatch.vencedorSlot) {
      const candidate = finalMatch.participants[finalMatch.vencedorSlot - 1];
      champion = candidate && !candidate.isBye ? candidate : null;
    }
  }

  return {
    type,
    rounds: completeRounds,
    totalParticipants,
    champion,
  };
};

const HistoricoBracketsPublico: React.FC = () => {
  const { isCollapsed: isSidebarCollapsed, setCollapsed: setSidebarCollapsed } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();

  const params = useParams<{ id?: string }>();
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    return undefined;
  }, [params.id]);

  const {
    data: campeonatoDetalhado,
    isLoading: campeonatoLoading,
    error: campeonatoError,
  } = useQuery<CampeonatoDetalhado>({
    queryKey: ['campeonato-detalhado-publico', campeonatoId],
    queryFn: () => fetchCampeonatoDetalhadoPublico(campeonatoId!),
    enabled: !!campeonatoId,
    staleTime: 60 * 1000,
  });

  const categorias = useMemo(() => {
    if (!campeonatoDetalhado?.modalidades) return [] as CampeonatoModalidadeWithCategoria[];
    
    const isFinalizado = campeonatoDetalhado.status === Status.FINALIZADO;
    
    if (isFinalizado) {
      return [...campeonatoDetalhado.modalidades]
        .sort((a, b) => (a.categoria?.nome ?? '').localeCompare(b.categoria?.nome ?? ''));
    }
    
    return [...campeonatoDetalhado.modalidades]
      .sort((a, b) => (a.categoria?.nome ?? '').localeCompare(b.categoria?.nome ?? ''));
  }, [campeonatoDetalhado]);

  const [categoriasComCampeao, setCategoriasComCampeao] = useState<Set<number>>(new Set());
  const [selectedModalidade, setSelectedModalidade] = useState<string>('');
  const [isBracketDialogOpen, setBracketDialogOpen] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState<NormalizedBracket | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);

  const isCampeonatoFinalizado = campeonatoDetalhado?.status === Status.FINALIZADO;

  useQuery({
    queryKey: ['verificar-campeoes-publico', campeonatoId],
    queryFn: async () => {
      if (!categorias.length || isCampeonatoFinalizado) return new Set<number>();
      
      const results = await Promise.all(
        categorias.map(async (modalidade) => {
          try {
            const equipe = isEquipeModalidade(modalidade.categoria?.modalidade);
            const partidas = equipe
              ? await fetchPartidasEquipePorCategoria(modalidade.idCampeonatoModalidade)
              : await fetchPartidasAtletaPorCategoria(modalidade.idCampeonatoModalidade);
            
            const bracket = normalizeMatches(partidas, equipe ? 'EQUIPE' : 'ATLETA');
            return { id: modalidade.idCampeonatoModalidade, temCampeao: !!bracket?.champion };
          } catch {
            return { id: modalidade.idCampeonatoModalidade, temCampeao: false };
          }
        })
      );
      
      const comCampeao = new Set(
        results.filter(r => r.temCampeao).map(r => r.id)
      );
      setCategoriasComCampeao(comCampeao);
      return comCampeao;
    },
    enabled: !!campeonatoId && categorias.length > 0 && !isCampeonatoFinalizado,
  });

  const categoriasDisponiveis = useMemo(() => {
    if (isCampeonatoFinalizado) return categorias;
    return categorias.filter(cat => categoriasComCampeao.has(cat.idCampeonatoModalidade));
  }, [categorias, categoriasComCampeao, isCampeonatoFinalizado]);

  const selectedCategoria = useMemo(() => {
    return categoriasDisponiveis.find(cat => cat.idCampeonatoModalidade.toString() === selectedModalidade);
  }, [categoriasDisponiveis, selectedModalidade]);

  const {
    data: bracketsData,
    isLoading: bracketsLoading,
  } = useQuery<PartidaAtletaResponse[] | PartidaEquipeResponse[]>({
    queryKey: ['historico-brackets-publico', selectedModalidade],
    queryFn: async () => {
      if (!selectedCategoria) return [];
      const equipe = isEquipeModalidade(selectedCategoria.categoria?.modalidade);
      return equipe
        ? fetchPartidasEquipePorCategoria(selectedCategoria.idCampeonatoModalidade)
        : fetchPartidasAtletaPorCategoria(selectedCategoria.idCampeonatoModalidade);
    },
    enabled: !!selectedCategoria,
  });

  const normalizedBracket = useMemo(() => {
    if (!bracketsData || !selectedCategoria) return null;
    const equipe = isEquipeModalidade(selectedCategoria.categoria?.modalidade);
    const type: BracketType = equipe ? 'EQUIPE' : 'ATLETA';
    return normalizeMatches(bracketsData, type);
  }, [bracketsData, selectedCategoria]);

  const handleViewBracket = () => {
    if (!normalizedBracket) {
      toast({
        title: 'Chaveamento não encontrado',
        description: 'Nenhum chaveamento foi gerado para esta categoria.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedBracket(normalizedBracket);
    setBracketDialogOpen(true);
  };

  const handleCloseBracket = () => {
    setBracketDialogOpen(false);
    setSelectedBracket(null);
  };

  return (
    <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
      <Sidebar
        onItemClick={() => {
          if (window.innerWidth < 1024) setSidebarCollapsed(true);
        }}
      />
      {!isSidebarCollapsed && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          aria-label="Fechar menu lateral"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/campeonatos-publicos')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Chaveamentos do Campeonato</h1>
              <p className="text-gray-600 max-w-2xl mt-2">
                {isCampeonatoFinalizado 
                  ? 'Visualize todos os chaveamentos finalizados deste campeonato.'
                  : 'Visualize apenas as categorias com campeão já definido.'}
              </p>
            </div>
            <History className="h-10 w-10 text-blue-600" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {isCampeonatoFinalizado ? 'Total de Categorias' : 'Categorias com Campeão'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">{categoriasDisponiveis.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status do Campeonato</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {isCampeonatoFinalizado ? 'Finalizado' : 'Em Andamento'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Campeonato</p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {campeonatoLoading
                    ? 'Carregando campeonato…'
                    : campeonatoDetalhado?.nome ?? 'Campeonato'}
                </h2>
                <p className="text-sm text-gray-600 max-w-xl">
                  {campeonatoDetalhado?.associacao?.nome && (
                    <>Organizado por: {campeonatoDetalhado.associacao.nome}</>
                  )}
                </p>
                {campeonatoError && (
                  <p className="text-sm text-red-600">
                    Erro ao carregar campeonato. Tente novamente.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {campeonatoLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : categoriasDisponiveis.length > 0 ? (
                  <Select value={selectedModalidade} onValueChange={setSelectedModalidade}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDisponiveis.map((modalidade) => (
                        <SelectItem key={modalidade.idCampeonatoModalidade} value={modalidade.idCampeonatoModalidade.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {formatModalidade(modalidade.categoria?.modalidade)}
                            </Badge>
                            {modalidade.categoria?.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-gray-500">
                    {isCampeonatoFinalizado 
                      ? 'Nenhuma categoria cadastrada'
                      : 'Aguardando campeões...'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedCategoria && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  Chaveamento: {selectedCategoria.categoria?.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bracketsLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Carregando chaveamento…
                  </div>
                ) : normalizedBracket ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{normalizedBracket.totalParticipants}</div>
                          <div className="text-sm text-gray-600">Participantes</div>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{normalizedBracket.rounds.length}</div>
                          <div className="text-sm text-gray-600">Rodadas</div>
                        </CardContent>
                      </Card>
                      <Card className="border-yellow-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {normalizedBracket.champion ? 1 : 0}
                          </div>
                          <div className="text-sm text-gray-600">Campeão Definido</div>
                        </CardContent>
                      </Card>
                    </div>

                    {normalizedBracket.champion && (
                      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500 rounded-full">
                              <Crown className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-yellow-800">Campeão da Categoria</h3>
                              <p className="text-yellow-700">{normalizedBracket.champion.nome}</p>
                              {normalizedBracket.champion.associacao && (
                                <p className="text-sm text-yellow-600">{normalizedBracket.champion.associacao}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex justify-center">
                      <Button onClick={handleViewBracket} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Visualizar Chaveamento Completo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chaveamento não disponível
                    </h3>
                    <p className="text-gray-600">
                      {isCampeonatoFinalizado 
                        ? 'Nenhum chaveamento foi gerado para esta categoria.'
                        : 'Esta categoria ainda não tem um campeão definido.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedCategoria && (
            <Card>
              <CardContent className="text-center py-12">
                <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {categoriasDisponiveis.length === 0 
                    ? (isCampeonatoFinalizado 
                        ? 'Nenhuma categoria cadastrada' 
                        : 'Nenhum campeão definido ainda')
                    : 'Selecione uma categoria'}
                </h3>
                <p className="text-gray-600">
                  {categoriasDisponiveis.length === 0 
                    ? (isCampeonatoFinalizado 
                        ? 'Este campeonato não possui categorias vinculadas.' 
                        : 'Aguarde a finalização de pelo menos uma categoria para visualizar os chaveamentos.')
                    : 'Escolha uma categoria no seletor acima para visualizar o chaveamento.'}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={isBracketDialogOpen} onOpenChange={(open) => (open ? null : handleCloseBracket())}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCategoria?.categoria?.nome ?? 'Categoria'}
            </DialogTitle>
            <DialogDescription>
              {formatModalidade(selectedCategoria?.categoria?.modalidade)} - Visualização completa do chaveamento
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <ChaveamentoBracket
              titulo={selectedCategoria?.categoria?.nome ?? 'Categoria'}
              modalidade={formatModalidade(selectedCategoria?.categoria?.modalidade)}
              bracket={selectedBracket}
              loading={bracketLoading}
              onAdvance={undefined}
              advancingMatchId={null}
            />
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseBracket}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoricoBracketsPublico;
