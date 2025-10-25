import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Trophy,
  Filter,
  Eye,
  Play,
  RotateCcw,
  RefreshCcw,
  Loader2,
  GitBranch,
  Crown,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChaveamentoBracket, {
  BracketParticipant,
  BracketRound,
  NormalizedBracket,
  BracketType,
} from '@/components/chaveamento/ChaveamentoBracket';
import { useSidebar } from '@/context/SidebarContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CampeonatoDetalhado,
  CampeonatoModalidadeWithCategoria,
  fetchCampeonatoDetalhado,
  fetchPartidasAtletaPorCategoria,
  fetchPartidasEquipePorCategoria,
  gerarChaveamentoCategoria,
  Modalidade,
  PartidaAtletaResponse,
  PartidaEquipeResponse,
  AdvanceResult,
  avancarPartidaAtleta,
  avancarPartidaEquipe,
  desfazerPartidaAtleta,
  desfazerPartidaEquipe,
  resetChaveamentoCategoria,
  fetchEtapas,
} from '@/services/api';
import { cn } from '@/lib/utils';

interface StatusValue {
  generated: boolean;
  loading: boolean;
  bracket: NormalizedBracket | null;
  error: string | null;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if ((error as AxiosError)?.response) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

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
    return {
      idInscricao: null,
      nome: isBye ? 'Sem adversário (BYE)' : fallbackParticipantLabel(partida.round),
      isBye,
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
    return {
      idInscricao: null,
      nome: isBye ? 'Sem adversário (BYE)' : fallbackParticipantLabel(partida.round),
      isBye,
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

  const finalRound = rounds[rounds.length - 1];
  let champion: BracketParticipant | null = null;
  if (finalRound) {
    const finalMatch = finalRound.matches[0];
    if (finalMatch && finalMatch.vencedorSlot) {
      const candidate = finalMatch.participants[finalMatch.vencedorSlot - 1];
      champion = candidate && !candidate.isBye ? candidate : null;
    }
  }

  return {
    type,
    rounds,
    totalParticipants,
    champion,
  };
};

const ChaveamentosGerencia: React.FC = () => {
  const { isCollapsed: isSidebarCollapsed, toggle: toggleSidebar, setCollapsed: setSidebarCollapsed } = useSidebar();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const params = useParams<{ id?: string }>();
  const persistedId = typeof window !== 'undefined' ? localStorage.getItem('currentCampeonatoId') ?? undefined : undefined;
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    if (persistedId) return Number(persistedId);
    return undefined;
  }, [params.id, persistedId]);

  useEffect(() => {
    if (params.id && typeof window !== 'undefined') {
      localStorage.setItem('currentCampeonatoId', params.id);
    }
  }, [params.id]);

  const {
    data: campeonatoDetalhado,
    isFetching: modalidadesFetching,
    isLoading: campeonatoLoading,
    error: campeonatoError,
  } = useQuery<CampeonatoDetalhado>({
    queryKey: ['campeonato-detalhado', campeonatoId],
    queryFn: () => fetchCampeonatoDetalhado(campeonatoId!),
    enabled: !!campeonatoId,
    staleTime: 60 * 1000,
  });

  const { data: etapasStatus } = useQuery({
    queryKey: ['etapas', campeonatoId],
    queryFn: () => (campeonatoId ? fetchEtapas(campeonatoId) : Promise.resolve(undefined)),
    enabled: !!campeonatoId,
  });

  const categorias = useMemo(() => {
    if (!campeonatoDetalhado?.modalidades) return [] as CampeonatoModalidadeWithCategoria[];
    return [...campeonatoDetalhado.modalidades].sort((a, b) =>
      (a.categoria?.nome ?? '').localeCompare(b.categoria?.nome ?? ''),
    );
  }, [campeonatoDetalhado]);

  const [statusMap, setStatusMap] = useState<Record<number, StatusValue>>({});
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [isBracketDialogOpen, setBracketDialogOpen] = useState(false);
  const [selectedModalidade, setSelectedModalidade] = useState<CampeonatoModalidadeWithCategoria | null>(null);
  const [selectedBracket, setSelectedBracket] = useState<NormalizedBracket | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [advancingMatchId, setAdvancingMatchId] = useState<number | null>(null);
  const [undoingMatchId, setUndoingMatchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const campeoesDefinidos = !!etapasStatus?.chaveamentoGerado;
  const prevCampeoesDefinidos = useRef<boolean>(false);

  useEffect(() => {
    if (campeonatoId && campeoesDefinidos && !prevCampeoesDefinidos.current) {
      prevCampeoesDefinidos.current = true;
      navigate(`/meu-campeonato/${campeonatoId}`);
      return;
    }
    if (!campeoesDefinidos) {
      prevCampeoesDefinidos.current = false;
    }
  }, [campeonatoId, campeoesDefinidos, navigate]);

  useEffect(() => {
    if (!campeonatoId) {
      setStatusMap({});
    }
  }, [campeonatoId]);

  const fetchAndNormalize = useCallback(
    async (modalidade: CampeonatoModalidadeWithCategoria, force = false) => {
      const equipe = isEquipeModalidade(modalidade.categoria?.modalidade);
      const type: BracketType = equipe ? 'EQUIPE' : 'ATLETA';
      const queryKey = ['chaveamento', modalidade.idCampeonatoModalidade, type] as const;

      if (force) {
        await queryClient.invalidateQueries({ queryKey, exact: true });
      }

      const data = await queryClient.fetchQuery<PartidaAtletaResponse[] | PartidaEquipeResponse[]>({
        queryKey,
        queryFn: () =>
          equipe
            ? fetchPartidasEquipePorCategoria(modalidade.idCampeonatoModalidade)
            : fetchPartidasAtletaPorCategoria(modalidade.idCampeonatoModalidade),
      });

      return normalizeMatches(data, type);
    },
    [queryClient],
  );

  const invalidateEtapasStatus = useCallback(async () => {
    if (!campeonatoId) return;
    await queryClient.invalidateQueries({ queryKey: ['etapas', campeonatoId], exact: true });
  }, [campeonatoId, queryClient]);

  const refreshStatuses = useCallback(
    async (force = false) => {
      if (!categorias.length) {
        setStatusMap({});
        return;
      }

      setStatusMap((prev) => {
        const next: Record<number, StatusValue> = {};
        categorias.forEach((modalidade) => {
          const existing = prev[modalidade.idCampeonatoModalidade];
          next[modalidade.idCampeonatoModalidade] = {
            generated: existing?.generated ?? false,
            loading: true,
            bracket: existing?.bracket ?? null,
            error: existing?.error ?? null,
          };
        });
        return next;
      });

      const results = await Promise.all(
        categorias.map(async (modalidade) => {
          try {
            const bracket = await fetchAndNormalize(modalidade, force);
            return { modalidadeId: modalidade.idCampeonatoModalidade, bracket, error: null as string | null };
          } catch (error) {
            return {
              modalidadeId: modalidade.idCampeonatoModalidade,
              bracket: null,
              error: getApiErrorMessage(error, 'Erro ao carregar chaveamento'),
            };
          }
        }),
      );

      setStatusMap((prev) => {
        const next = { ...prev };
        results.forEach(({ modalidadeId, bracket, error }) => {
          next[modalidadeId] = {
            generated: !!bracket,
            loading: false,
            bracket: bracket ?? null,
            error,
          };
        });
        return next;
      });

      const errorResult = results.find((result) => result.error);
      if (errorResult) {
        toast({
          title: 'Erro ao atualizar chaveamentos',
          description: errorResult.error ?? 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      }
    },
    [categorias, fetchAndNormalize, toast],
  );

  const updateModalidadeStatus = useCallback(
    async (modalidade: CampeonatoModalidadeWithCategoria) => {
      try {
        const bracket = await fetchAndNormalize(modalidade, true);
        setStatusMap((prev) => ({
          ...prev,
          [modalidade.idCampeonatoModalidade]: {
            generated: !!bracket,
            loading: false,
            bracket: bracket ?? null,
            error: null,
          },
        }));
        return bracket;
      } catch (error) {
        setStatusMap((prev) => ({
          ...prev,
          [modalidade.idCampeonatoModalidade]: {
            generated: false,
            loading: false,
            bracket: null,
            error: getApiErrorMessage(error, 'Erro ao carregar chaveamento'),
          },
        }));
        throw error;
      }
    },
    [fetchAndNormalize],
  );

  useEffect(() => {
    if (!campeonatoId || modalidadesFetching) return;
    void refreshStatuses();
  }, [campeonatoId, categorias, modalidadesFetching, refreshStatuses]);

  const generateMutation = useMutation({
    mutationFn: (id: number) => gerarChaveamentoCategoria(id),
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) => resetChaveamentoCategoria(id),
  });

  const handleGenerate = async (modalidade: CampeonatoModalidadeWithCategoria) => {
    const id = modalidade.idCampeonatoModalidade;
    if (campeoesDefinidos) {
      toast({
        title: 'Campeões já definidos',
        description: 'Não é possível gerar novas chaves após a definição dos campeões.',
      });
      return;
    }
    if (statusMap[id]?.generated) {
      toast({
        title: 'Chaveamento já gerado',
        description: 'Utilize o botão de visualizar ou reset para refazer.',
      });
      return;
    }

    setGeneratingId(id);
    try {
      await generateMutation.mutateAsync(id);
      toast({
        title: 'Chaveamento gerado com sucesso',
        description: modalidade.categoria?.nome ?? 'Categoria atualizada.',
      });
      await refreshStatuses(true);
      await invalidateEtapasStatus();
    } catch (error) {
      toast({
        title: 'Erro ao gerar chaveamento',
        description: getApiErrorMessage(error, 'Verifique se há inscrições suficientes.'),
        variant: 'destructive',
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleReset = async (modalidade: CampeonatoModalidadeWithCategoria) => {
    const id = modalidade.idCampeonatoModalidade;
    if (campeoesDefinidos) {
      toast({
        title: 'Campeões já definidos',
        description: 'Não é possível resetar chaveamentos após a definição dos campeões.',
      });
      return;
    }
    setResettingId(id);
    try {
      await resetMutation.mutateAsync(id);
      queryClient.removeQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'chaveamento' && query.queryKey[1] === id,
      });
      toast({
        title: 'Chaveamento resetado',
        description: 'Agora você pode gerar novamente esta chave.',
      });
      await refreshStatuses(true);
      await invalidateEtapasStatus();
    } catch (error) {
      toast({
        title: 'Erro ao resetar chaveamento',
        description: getApiErrorMessage(error, 'Tente novamente em instantes.'),
        variant: 'destructive',
      });
    } finally {
      setResettingId(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!campeonatoId) {
      toast({ title: 'Acesse esta página pelo menu "Meu Campeonato".' });
      return;
    }

    if (campeoesDefinidos) {
      toast({
        title: 'Campeões já definidos',
        description: 'Todos os campeões foram definidos. Geração em massa indisponível.',
      });
      return;
    }

    const pendentes = categorias.filter((modalidade) => !statusMap[modalidade.idCampeonatoModalidade]?.generated);
    if (!pendentes.length) {
      toast({ title: 'Todos os chaveamentos já foram gerados.' });
      return;
    }

    setBulkGenerating(true);
    const results = await Promise.allSettled(
      pendentes.map((modalidade) => gerarChaveamentoCategoria(modalidade.idCampeonatoModalidade)),
    );
    setBulkGenerating(false);

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failureResults = results.filter((result) => result.status === 'rejected') as PromiseRejectedResult[];

    if (successCount) {
      toast({
        title: `${successCount} chaveamento(s) gerado(s) com sucesso`,
        description: 'Os dados foram atualizados.',
      });
    }

    if (failureResults.length) {
      toast({
        title: 'Alguns chaveamentos não foram gerados',
        description: getApiErrorMessage(failureResults[0].reason, 'Verifique as inscrições pendentes.'),
        variant: 'destructive',
      });
    }

    await refreshStatuses(true);
    await invalidateEtapasStatus();
  };

  const handleAdvance = async (
    modalidade: CampeonatoModalidadeWithCategoria,
    match: BracketRound['matches'][number],
    vencedor: 1 | 2,
  ) => {
    const winnerParticipant = match.participants[vencedor - 1];
    if (!winnerParticipant?.idInscricao) {
      toast({
        title: 'Participante inválido',
        description: 'Não foi possível identificar o vencedor desta partida.',
        variant: 'destructive',
      });
      return;
    }

    const isEquipe = isEquipeModalidade(modalidade.categoria?.modalidade);
    setAdvancingMatchId(match.id);
    try {
      const result: AdvanceResult = isEquipe
        ? await avancarPartidaEquipe(match.id, vencedor)
        : await avancarPartidaAtleta(match.id, vencedor);

      const updatedBracket = await updateModalidadeStatus(modalidade);
      if (selectedModalidade?.idCampeonatoModalidade === modalidade.idCampeonatoModalidade) {
        setSelectedBracket(updatedBracket ?? null);
      }

      await invalidateEtapasStatus();

      if (result?.championId) {
        toast({
          title: 'Campeão definido!',
          description: `${winnerParticipant.nome} conquistou o título desta categoria.`,
        });
      } else {
        toast({
          title: 'Vencedor avançado',
          description: `${winnerParticipant.nome} avançou para a próxima fase.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao avançar competidor',
        description: getApiErrorMessage(error, 'Tente novamente em instantes.'),
        variant: 'destructive',
      });
    } finally {
      setAdvancingMatchId(null);
    }
  };

  const handleUndo = async (
    modalidade: CampeonatoModalidadeWithCategoria,
    match: BracketRound['matches'][number],
  ) => {
    if (!globalThis.confirm('Tem certeza que deseja desfazer este resultado? Esta ação irá reverter o vencedor desta partida.')) {
      return;
    }

    const isEquipe = isEquipeModalidade(modalidade.categoria?.modalidade);
    setUndoingMatchId(match.id);
    try {
      await (isEquipe ? desfazerPartidaEquipe(match.id) : desfazerPartidaAtleta(match.id));

      const updatedBracket = await updateModalidadeStatus(modalidade);
      if (selectedModalidade?.idCampeonatoModalidade === modalidade.idCampeonatoModalidade) {
        setSelectedBracket(updatedBracket ?? null);
      }

      await invalidateEtapasStatus();

      toast({
        title: 'Resultado desfeito',
        description: 'O resultado da partida foi revertido com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao desfazer resultado',
        description: getApiErrorMessage(error, 'Tente novamente em instantes.'),
        variant: 'destructive',
      });
    } finally {
      setUndoingMatchId(null);
    }
  };

  const handleOpenBracket = async (modalidade: CampeonatoModalidadeWithCategoria) => {
    setSelectedModalidade(modalidade);
    setBracketDialogOpen(true);
    setBracketLoading(true);
    setSelectedBracket(null);
    try {
      const bracket = await updateModalidadeStatus(modalidade);
      setSelectedBracket(bracket ?? null);
    } catch (error) {
      toast({
        title: 'Erro ao carregar chaveamento',
        description: getApiErrorMessage(error, 'Tente novamente mais tarde.'),
        variant: 'destructive',
      });
      setBracketDialogOpen(false);
    } finally {
      setBracketLoading(false);
    }
  };

  const handleCloseBracket = () => {
    setBracketDialogOpen(false);
    setSelectedModalidade(null);
    setSelectedBracket(null);
    setAdvancingMatchId(null);
    setUndoingMatchId(null);
  };

  const categoriasFiltradas = useMemo(() => {
    let filtered = categorias;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((modalidade) =>
        (modalidade.categoria?.nome ?? '').toLowerCase().includes(query)
      );
    }

    if (modalidadeFilter !== 'all') {
      filtered = filtered.filter((modalidade) => 
        modalidade.categoria?.modalidade === modalidadeFilter
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((modalidade) => {
        const id = modalidade.idCampeonatoModalidade;
        const status = statusMap[id];
        
        if (statusFilter === 'pendente') {
          return !status?.generated;
        }
        if (statusFilter === 'gerado') {
          return status?.generated && !status?.bracket?.champion;
        }
        if (statusFilter === 'campeao') {
          return !!status?.bracket?.champion;
        }
        if (statusFilter === 'erro') {
          return !!status?.error;
        }
        return true;
      });
    }

    return filtered;
  }, [categorias, searchTerm, modalidadeFilter, statusFilter, statusMap]);

  const totalCategorias = categoriasFiltradas.length;
  const gerados = categoriasFiltradas.reduce(
    (acc, modalidade) => acc + (statusMap[modalidade.idCampeonatoModalidade]?.generated ? 1 : 0),
    0,
  );
  const pendentes = totalCategorias - gerados;
  const carregandoAlgum = categoriasFiltradas.some(
    (modalidade) => statusMap[modalidade.idCampeonatoModalidade]?.loading,
  );
  const totalComCampeao = categoriasFiltradas.reduce(
    (acc, modalidade) => acc + (statusMap[modalidade.idCampeonatoModalidade]?.bracket?.champion ? 1 : 0),
    0,
  );

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
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Chaveamentos</h1>
            <p className="text-gray-600 max-w-2xl">
              Gere, visualize e redefina os chaveamentos por categoria de cada campeonato. Utilize a geração em massa para agilizar o processo quando todas as inscrições estiverem prontas.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Categorias</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalCategorias}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Gerados</p>
                  <p className="text-2xl font-semibold text-gray-900">{gerados}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Pendentes</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendentes}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Campeões</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalComCampeao}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Campeonato selecionado</p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {campeonatoLoading
                    ? 'Carregando campeonato…'
                    : campeonatoDetalhado?.nome ?? 'Nenhum campeonato selecionado'}
                </h2>
                <p className="text-sm text-gray-600 max-w-xl">
                  Os chaveamentos desta página utilizam diretamente as categorias do campeonato corrente. Acesse esta tela pelo menu “Meu Campeonato” para garantir o contexto correto.
                </p>
                {campeonatoError && campeonatoId && (
                  <p className="text-sm text-red-600">
                    {getApiErrorMessage(campeonatoError, 'Não foi possível carregar os dados do campeonato.')}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => refreshStatuses(true)}
                  disabled={!campeonatoId || modalidadesFetching || carregandoAlgum || campeonatoLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar status
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                  onClick={handleGenerateAll}
                  disabled={!campeonatoId || !categorias.length || bulkGenerating || campeonatoLoading || campeoesDefinidos}
                >
                  {bulkGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Gerar todos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-red-600" />
                Filtros de Pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="searchCategoria" className="text-xs">Buscar por categoria</Label>
                  <Input
                    id="searchCategoria"
                    type="text"
                    placeholder="Nome da categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filterModalidade" className="text-xs">Modalidade</Label>
                  <Select value={modalidadeFilter} onValueChange={setModalidadeFilter}>
                    <SelectTrigger id="filterModalidade" className="h-9 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as modalidades</SelectItem>
                      <SelectItem value={Modalidade.KATA}>Kata Individual</SelectItem>
                      <SelectItem value={Modalidade.KUMITE}>Kumite Individual</SelectItem>
                      <SelectItem value={Modalidade.KATA_EQUIPE}>Kata por Equipe</SelectItem>
                      <SelectItem value={Modalidade.KUMITE_EQUIPE}>Kumite por Equipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="filterStatus" className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="filterStatus" className="h-9 text-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="gerado">Gerado</SelectItem>
                      <SelectItem value="campeao">Campeão Definido</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchTerm || modalidadeFilter !== 'all' || statusFilter !== 'all') && (
                <div className="mt-3 text-xs text-gray-600">
                  Mostrando {totalCategorias} de {categorias.length} categoria(s)
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-red-600" />
                Chaveamentos por categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!campeonatoId ? (
                <div className="text-center py-12">
                  <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Selecione um campeonato
                  </h3>
                  <p className="text-gray-600">
                    Abra o menu “Meu Campeonato”, escolha o campeonato desejado e acesse a opção “Chaveamentos”.
                  </p>
                </div>
              ) : campeonatoLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando campeonato…
                </div>
              ) : campeonatoError ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-red-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar dados</h3>
                  <p className="text-red-600">
                    {getApiErrorMessage(campeonatoError, 'Tente novamente mais tarde.')}
                  </p>
                </div>
              ) : modalidadesFetching ? (
                <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando categorias…
                </div>
              ) : !categorias.length ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma categoria vinculada
                  </h3>
                  <p className="text-gray-600">
                    Vincule categorias ao campeonato selecionado para gerar chaveamentos.
                  </p>
                </div>
              ) : !categoriasFiltradas.length ? (
                <div className="text-center py-12">
                  <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma categoria encontrada
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros de pesquisa para encontrar categorias.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead className="text-center">Participantes</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriasFiltradas.map((modalidade) => {
                        const id = modalidade.idCampeonatoModalidade;
                        const status = statusMap[id] ?? {
                          generated: false,
                          loading: true,
                          bracket: null,
                          error: null,
                        };
                        const isEquipe = isEquipeModalidade(modalidade.categoria?.modalidade);
                        const participantsCount = status.bracket?.totalParticipants ?? '—';
                        const hasChampion = !!status.bracket?.champion;
                        const statusColor = status.error
                          ? 'bg-red-100 text-red-700 hover:bg-red-100'
                          : hasChampion
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                            : status.generated
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';

                        return (
                          <TableRow key={id} className={hasChampion ? 'bg-amber-50/30' : ''}>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  {hasChampion && (
                                    <Crown className="h-4 w-4 text-amber-500" aria-label="Campeão definido" />
                                  )}
                                  <span className="font-semibold text-gray-900">
                                    {modalidade.categoria?.nome ?? 'Categoria'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {isEquipe ? 'Disputa por equipes' : 'Disputa individual'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="whitespace-nowrap">
                                {formatModalidade(modalidade.categoria?.modalidade)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {status.loading ? (
                                <Loader2 className="h-4 w-4 animate-spin inline" />
                              ) : (
                                participantsCount
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {status.loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400 mx-auto" />
                              ) : (
                                <Badge className={cn(statusColor, 'inline-flex items-center gap-1')}>
                                  {hasChampion && <Crown className="h-3 w-3" />}
                                  {hasChampion ? 'Campeão Definido' : status.generated ? 'Gerado' : status.error ? 'Erro' : 'Pendente'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenBracket(modalidade)}
                                  disabled={!status.generated || bracketLoading}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReset(modalidade)}
                                  disabled={!status.generated || resettingId === id || campeoesDefinidos}
                                  className="flex items-center gap-1"
                                >
                                  {resettingId === id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4" />
                                  )}
                                  Resetar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                                  onClick={() => handleGenerate(modalidade)}
                                  disabled={generatingId === id || status.generated || campeoesDefinidos}
                                >
                                  {generatingId === id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                  Gerar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isBracketDialogOpen} onOpenChange={(open) => (open ? null : handleCloseBracket())}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedModalidade?.categoria?.nome ?? 'Chaveamento'}
            </DialogTitle>
            <DialogDescription>
              {formatModalidade(selectedModalidade?.categoria?.modalidade)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <ChaveamentoBracket
              titulo={selectedModalidade?.categoria?.nome ?? 'Categoria'}
              modalidade={formatModalidade(selectedModalidade?.categoria?.modalidade)}
              bracket={selectedBracket}
              loading={bracketLoading}
              onAdvance={selectedModalidade ? (match, vencedor) => handleAdvance(selectedModalidade, match, vencedor) : undefined}
              onUndo={selectedModalidade ? (match) => handleUndo(selectedModalidade, match) : undefined}
              advancingMatchId={advancingMatchId}
              undoingMatchId={undoingMatchId}
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

export default ChaveamentosGerencia;
