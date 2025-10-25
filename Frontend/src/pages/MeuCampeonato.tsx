import React, { useState, useMemo, useEffect } from 'react';
import EstadoSelect from '@/components/ui/estado-select';
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Pencil,
  UserPlus,
  Medal,
  CheckCircle,
  Play,
  Square,
  Link,
  Target,
  Award
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCampeonatoById, 
  fetchCampeonatoDetalhado, 
  updateCampeonato, 
  atualizarEnderecoCampeonato, 
  fetchInscricoesAtletaPorIdDeCampeonatoModalidade,
  fetchInscricoesEquipePorIdDeCampeonatoModalidade,
  fetchPartidasAtletaPorCategoria,
  fetchPartidasEquipePorCategoria,
  Status, 
  Campeonato, 
  CampeonatoDetalhado, 
  fetchEtapas 
} from '@/services/api';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MeuCampeonato = () => {
  const { toggle: toggleSidebar } = useSidebar();
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();

  const persistedId = typeof window !== 'undefined' ? localStorage.getItem('currentCampeonatoId') : undefined;
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    if (persistedId) return Number(persistedId);
    return undefined;
  }, [params.id, persistedId]);


  const { data: campeonato, isLoading, isError, error } = useQuery<Campeonato | undefined>({
    queryKey: ['campeonato', campeonatoId],
    queryFn: () => campeonatoId ? fetchCampeonatoById(campeonatoId) : Promise.resolve(undefined),
    enabled: !!campeonatoId,
    refetchOnMount: 'always'
  });

  const { data: campeonatoDet } = useQuery<CampeonatoDetalhado | undefined>({
    queryKey: ['campeonatoDetalhado', campeonatoId],
    queryFn: () => campeonatoId ? fetchCampeonatoDetalhado(campeonatoId) : Promise.resolve(undefined),
    enabled: !!campeonatoId,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const [detalhesEstatisticas, setDetalhesEstatisticas] = useState<{
    inscricoesAtleta: number;
    inscricoesEquipe: number;
    partidasAtleta: number;
    partidasEquipe: number;
  }>({
    inscricoesAtleta: 0,
    inscricoesEquipe: 0,
    partidasAtleta: 0,
    partidasEquipe: 0,
  });

  const [detalhesPorModalidade, setDetalhesPorModalidade] = useState<{
    [key: string]: {
      categorias: number;
      inscricoes: number;
      partidas: number;
    };
  }>({});

  const { data: etapasStatus } = useQuery({
    queryKey: ['etapas', campeonatoId],
    queryFn: () => (campeonatoId ? fetchEtapas(campeonatoId) : Promise.resolve(undefined)),
    enabled: !!campeonatoId,
    refetchOnMount: 'always'
  });

  useEffect(() => {
    if (!campeonatoDet?.modalidades) return;
    
    let cancelado = false;
    
    async function carregarEstatisticas() {
      let totalInscricoesAtleta = 0;
      let totalInscricoesEquipe = 0;
      let totalPartidasAtleta = 0;
      let totalPartidasEquipe = 0;

      const detalhesModal: typeof detalhesPorModalidade = {
        KATA: { categorias: 0, inscricoes: 0, partidas: 0 },
        KUMITE: { categorias: 0, inscricoes: 0, partidas: 0 },
        KATA_EQUIPE: { categorias: 0, inscricoes: 0, partidas: 0 },
        KUMITE_EQUIPE: { categorias: 0, inscricoes: 0, partidas: 0 },
      };

      for (const modalidade of campeonatoDet.modalidades) {
        if (cancelado) break;
        
        const tipoModalidade = modalidade.categoria?.modalidade;
        if (!tipoModalidade) continue;

        detalhesModal[tipoModalidade].categorias += 1;
        
        try {
          const inscricoesAtleta = await fetchInscricoesAtletaPorIdDeCampeonatoModalidade(modalidade.idCampeonatoModalidade);
          totalInscricoesAtleta += inscricoesAtleta.length;
          if (tipoModalidade === 'KATA' || tipoModalidade === 'KUMITE') {
            detalhesModal[tipoModalidade].inscricoes += inscricoesAtleta.length;
          }
          
          const inscricoesEquipe = await fetchInscricoesEquipePorIdDeCampeonatoModalidade(modalidade.idCampeonatoModalidade);
          totalInscricoesEquipe += inscricoesEquipe.length;
          if (tipoModalidade === 'KATA_EQUIPE' || tipoModalidade === 'KUMITE_EQUIPE') {
            detalhesModal[tipoModalidade].inscricoes += inscricoesEquipe.length;
          }
          
          const partidasAtleta = await fetchPartidasAtletaPorCategoria(modalidade.idCampeonatoModalidade);
          totalPartidasAtleta += partidasAtleta.length;
          if (tipoModalidade === 'KATA' || tipoModalidade === 'KUMITE') {
            detalhesModal[tipoModalidade].partidas += partidasAtleta.length;
          }
          
          const partidasEquipe = await fetchPartidasEquipePorCategoria(modalidade.idCampeonatoModalidade);
          totalPartidasEquipe += partidasEquipe.length;
          if (tipoModalidade === 'KATA_EQUIPE' || tipoModalidade === 'KUMITE_EQUIPE') {
            detalhesModal[tipoModalidade].partidas += partidasEquipe.length;
          }
        } catch (error) {
          console.error('Erro ao carregar estatísticas:', error);
        }
      }

      if (!cancelado) {
        setDetalhesEstatisticas({
          inscricoesAtleta: totalInscricoesAtleta,
          inscricoesEquipe: totalInscricoesEquipe,
          partidasAtleta: totalPartidasAtleta,
          partidasEquipe: totalPartidasEquipe,
        });
        setDetalhesPorModalidade(detalhesModal);
      }
    }

    carregarEstatisticas();
    
    return () => { cancelado = true; };
  }, [campeonatoDet?.modalidades]);

  interface UpdateCorePayload { nome: string; dataInicio: string; dataFim?: string; descricao?: string }
  const updateCoreMutation = useMutation<Campeonato, Error, UpdateCorePayload>({
    mutationFn: async (payload: UpdateCorePayload) => {
      if (!campeonatoId) throw new Error('ID inválido');
      return updateCampeonato(campeonatoId, {
        nome: payload.nome,
        dataInicio: payload.dataInicio, // formato yyyy-mm-dd vindo do input date
        dataFim: payload.dataFim || undefined,
        descricao: payload.descricao || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campeonato', campeonatoId] });
    }
  });

  // Mutation: update address
  const updateAddressMutation = useMutation<any, Error, any>({
    mutationFn: async (payload) => {
      if (!campeonatoId) throw new Error('ID inválido');
      return atualizarEnderecoCampeonato(campeonatoId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campeonato', campeonatoId] });
    }
  });

  const cancelarMutation = useMutation<Campeonato, Error, void>({
    mutationFn: async () => {
      if (!campeonatoId) throw new Error('ID inválido');
      
      const totalPartidas = estatisticas.partidasAtleta + estatisticas.partidasEquipe;
      if (totalPartidas > 0) {
        throw new Error('Não é possível cancelar o campeonato pois já existem partidas registradas.');
      }
      
      return updateCampeonato(campeonatoId, { status: Status.CANCELADO });
    },
    onSuccess: () => {
      localStorage.removeItem('currentCampeonatoId');
      queryClient.invalidateQueries({ queryKey: ['campeonato', campeonatoId] });
      navigate('/campeonatos');
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const [estadoEndereco, setEstadoEndereco] = useState<string>(campeonato?.endereco?.estado || '');

  useEffect(() => {
    if (editOpen && campeonato?.endereco?.estado) {
      setEstadoEndereco(campeonato.endereco.estado);
    }
  }, [editOpen, campeonato?.endereco?.estado]);

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!campeonato) return;
    const formData = new FormData(e.currentTarget);
    const core = {
      nome: formData.get('nome') as string,
      dataInicio: formData.get('dataInicio') as string,
      dataFim: formData.get('dataFim') as string || undefined,
      descricao: formData.get('descricao') as string,
    };
    const endereco = {
      rua: formData.get('rua') as string,
      numero: formData.get('numero') as string,
      complemento: formData.get('complemento') as string || undefined,
      bairro: formData.get('bairro') as string,
      cidade: formData.get('cidade') as string,
      estado: estadoEndereco,
      cep: formData.get('cep') as string,
    };
    try {
      await updateCoreMutation.mutateAsync({ ...core });
      await updateAddressMutation.mutateAsync({ ...endereco });
      setEditOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const statusLabel = (s?: Status) => {
    if (!s) return '';
    return {
      PENDENTE: 'Pendente',
      EM_ANDAMENTO: 'Em andamento',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado'
    }[s];
  };

  const estatisticas = useMemo(() => {
    if (!campeonatoDet) {
      return {
        modalidades: 0,
        categorias: 0,
        inscricoesAtleta: 0,
        inscricoesEquipe: 0,
        partidasAtleta: 0,
        partidasEquipe: 0,
        chaveamentos: 0,
        resultadosDefinidos: 0
      };
    }

    const categorias = campeonatoDet.modalidades?.length || 0;
    const modalidadesUnicas = new Set(
      campeonatoDet.modalidades?.map(m => m.categoria?.modalidade).filter(Boolean) || []
    );
    const modalidades = modalidadesUnicas.size;

    return {
      modalidades,
      categorias,
      inscricoesAtleta: detalhesEstatisticas.inscricoesAtleta,
      inscricoesEquipe: detalhesEstatisticas.inscricoesEquipe,
      partidasAtleta: detalhesEstatisticas.partidasAtleta,
      partidasEquipe: detalhesEstatisticas.partidasEquipe,
      chaveamentos: categorias,
    };
  }, [campeonatoDet, detalhesEstatisticas]);


  const cadastroConcluida = !!campeonato;
  const temModalidades = (campeonatoDet?.modalidades?.length ?? 0) > 0;
  const categoriasConfirmadas = !!etapasStatus?.categoriasConfirmadas;
  const inscricoesConfirmadas = !!etapasStatus?.inscricoesConfirmadas;
  const campeoesDefinidos = !!etapasStatus?.chaveamentoGerado;

  const autoStatusMutation = useMutation<Campeonato, Error, Status>({
    mutationFn: async (novoStatus: Status) => {
      if (!campeonatoId) throw new Error('ID inválido');
      return updateCampeonato(campeonatoId, { status: novoStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campeonato', campeonatoId] });
    }
  });

  useEffect(() => {
    if (!campeonato || autoStatusMutation.isPending) return;
    if (inscricoesConfirmadas && campeonato.status === Status.PENDENTE) {
      autoStatusMutation.mutate(Status.EM_ANDAMENTO);
      return;
    }
    if (campeoesDefinidos && campeonato.status !== Status.FINALIZADO) {
      autoStatusMutation.mutate(Status.FINALIZADO);
    }
  }, [campeonato, inscricoesConfirmadas, campeoesDefinidos, autoStatusMutation.isPending, autoStatusMutation.mutate]);

  const etapas = useMemo(() => {
    return [
      { id: 1, nome: 'Cadastro do Campeonato', concluida: cadastroConcluida, ativa: !temModalidades },
      { id: 2, nome: 'Vincular Categorias', concluida: categoriasConfirmadas, ativa: temModalidades && !categoriasConfirmadas },
      { id: 3, nome: 'Inscrições (Atletas/Equipes)', concluida: inscricoesConfirmadas, ativa: categoriasConfirmadas && !inscricoesConfirmadas },
      { id: 4, nome: 'Chaveamento e Partidas', concluida: campeoesDefinidos, ativa: inscricoesConfirmadas && !campeoesDefinidos },
      // Resultados Finais é concluída automaticamente junto com campeoesDefinidos
      { id: 5, nome: 'Resultados Finais', concluida: campeoesDefinidos, ativa: campeoesDefinidos },
    ];
  }, [cadastroConcluida, temModalidades, categoriasConfirmadas, inscricoesConfirmadas, campeoesDefinidos]);

  const getStatusColor = (status?: Status) => {
    switch (status) {
      case Status.EM_ANDAMENTO: return 'bg-green-100 text-green-800';
      case Status.FINALIZADO: return 'bg-gray-100 text-gray-800';
      case Status.PENDENTE: return 'bg-yellow-100 text-yellow-800';
      case Status.CANCELADO: return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const confirmarCategoriasDisabled = categoriasConfirmadas;
  let confirmarCategoriasTitle = '';
  if (categoriasConfirmadas) {
    confirmarCategoriasTitle = 'Categorias já confirmadas';
  }

  const confirmarInscricoesDisabled = inscricoesConfirmadas;
  let confirmarInscricoesTitle = '';
  if (inscricoesConfirmadas) {
    confirmarInscricoesTitle = 'Inscrições já confirmadas';
  }

  const gerarChaveamentoDisabled = !inscricoesConfirmadas || campeoesDefinidos;
  let gerarChaveamentoTitle = '';
  if (!inscricoesConfirmadas) {
    gerarChaveamentoTitle = 'Confirme inscrições para gerar chaveamento';
  } else if (campeoesDefinidos) {
    gerarChaveamentoTitle = 'Todos os campeões foram definidos';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
          {isLoading && (
            <div className="bg-white rounded-lg border p-6 mb-6 animate-pulse text-sm text-gray-500">Carregando campeonato...</div>
          )}
          {isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6 text-sm">Erro ao carregar campeonato: {(error as any)?.message}</div>
          )}
          {!isLoading && !isError && !campeonato && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-6 text-sm">Nenhum campeonato selecionado.</div>
          )}
          {campeonato && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento do Campeonato</h1>
                  <h2 className="text-xl font-semibold text-red-600 mb-3">{campeonato.nome}</h2>
                  <div className="flex items-center gap-6 text-gray-600 text-sm flex-wrap mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(campeonato.dataInicio).toLocaleDateString()} {campeonato.dataFim && ' - ' + new Date(campeonato.dataFim).toLocaleDateString()}</span>
                    </div>
                    {campeonato.endereco && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{`${campeonato.endereco.bairro} - ${campeonato.endereco.cidade}/${campeonato.endereco.estado}`}</span>
                      </div>
                    )}
                    <Badge className={getStatusColor(campeonato.status)}>
                      {statusLabel(campeonato.status)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{campeonato.descricao}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2" onClick={() => setEditOpen(true)}>
                    <Pencil className="w-4 h-4" />
                    Editar Campeonato
                  </Button>
                  {campeonato.status !== Status.FINALIZADO && campeonato.status !== Status.CANCELADO && (
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2"
                      disabled={cancelarMutation.isPending}
                      onClick={() => {
                        if (globalThis.confirm('Tem certeza que deseja cancelar este campeonato?')) {
                          cancelarMutation.mutate();
                        }
                      }}
                    >
                      <Square className="w-4 h-4" />
                      {cancelarMutation.isPending ? 'Cancelando...' : 'Cancelar Campeonato'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumo Estatístico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{estatisticas.modalidades}</div>
                      <div className="text-sm text-gray-600">Modalidades</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{estatisticas.categorias}</div>
                      <div className="text-sm text-gray-600">Categorias</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <UserPlus className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{estatisticas.inscricoesAtleta}</div>
                      <div className="text-sm text-gray-600">Inscrições Atletas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <UserPlus className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-pink-600">{estatisticas.inscricoesEquipe}</div>
                      <div className="text-sm text-gray-600">Inscrições Equipes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Award className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{estatisticas.partidasAtleta}</div>
                      <div className="text-sm text-gray-600">Partidas (Atletas)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{estatisticas.partidasEquipe}</div>
                      <div className="text-sm text-gray-600">Partidas (Equipes)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Detalhamento por Modalidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-red-600" />
                    Kata Individual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Categorias:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KATA?.categorias || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atletas Inscritos:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KATA?.inscricoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partidas:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KATA?.partidas || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Kumite Individual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Categorias:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KUMITE?.categorias || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atletas Inscritos:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KUMITE?.inscricoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partidas:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KUMITE?.partidas || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Kata Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Categorias:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KATA_EQUIPE?.categorias || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipes Inscritas:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KATA_EQUIPE?.inscricoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partidas:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KATA_EQUIPE?.partidas || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Kumite Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Categorias:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KUMITE_EQUIPE?.categorias || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipes Inscritas:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KUMITE_EQUIPE?.inscricoes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partidas:</span>
                      <span className="font-semibold">{detalhesPorModalidade.KUMITE_EQUIPE?.partidas || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Etapas do Campeonato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between overflow-x-auto">
                {etapas.map((etapa, index) => {
                  let circleClass = 'bg-gray-200 text-gray-600';
                  if (etapa.concluida) circleClass = 'bg-green-500 text-white';
                  else if (etapa.ativa) circleClass = 'bg-red-500 text-white';
                  return (
                    <div key={etapa.id} className="flex items-center min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${circleClass}`}>
                        {etapa.concluida ? '✓' : etapa.id}
                      </div>
                      <div className="ml-2 text-sm min-w-0">
                        <div className={`font-medium ${etapa.ativa ? 'text-red-600' : 'text-gray-600'}`}>{etapa.nome}</div>
                      </div>
                      {index < etapas.length - 1 && (
                        <div className={`w-8 h-0.5 mx-4 flex-shrink-0 ${etapa.concluida ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col gap-1"
                  onClick={() => campeonatoId && navigate(`/meu-campeonato/${campeonatoId}/modalidades`)}
                  disabled={confirmarCategoriasDisabled}
                  title={confirmarCategoriasTitle}
                >
                  <Link className="w-5 h-5" />
                  <span className="text-xs">Gerenciar Categorias</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col gap-1"
                  disabled={confirmarInscricoesDisabled}
                  title={confirmarInscricoesTitle}
                  onClick={() => campeonatoId && navigate(`/meu-campeonato/${campeonatoId}/inscricoes`)}
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="text-xs">Gerenciar Inscrições</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col gap-1"
                  disabled={gerarChaveamentoDisabled}
                  title={gerarChaveamentoTitle}
                  onClick={() => campeonatoId && navigate(`/meu-campeonato/${campeonatoId}/chaveamentos`)}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs text-center">Chaveamento e Partidas</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col gap-1"
                  onClick={() => campeonatoId && navigate(`/meu-campeonato/${campeonatoId}/historico`)}
                >
                  <Trophy className="w-5 h-5" />
                  <span className="text-xs">Histórico de Brackets</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col gap-1"
                  onClick={() => campeonatoId && navigate(`/meu-campeonato/${campeonatoId}/resultados`)}
                >
                  <Medal className="w-5 h-5" />
                  <span className="text-xs">Resultados Finais</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          {editOpen && campeonato && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-6">
              <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg border animate-in fade-in zoom-in p-6 relative">
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setEditOpen(false)}>✕</button>
                <h3 className="text-lg font-semibold mb-4">Editar Campeonato</h3>
                <form onSubmit={handleSubmitEdit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="nome">Nome</label>
                      <input id="nome" name="nome" defaultValue={campeonato.nome} required className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="dataInicio">Data Início</label>
                      <input id="dataInicio" type="date" name="dataInicio" defaultValue={campeonato.dataInicio?.substring(0, 10)} required className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="dataFim">Data Fim</label>
                      <input id="dataFim" type="date" name="dataFim" defaultValue={campeonato.dataFim?.substring(0, 10) || ''} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium" htmlFor="descricao">Descrição</label>
                      <textarea id="descricao" name="descricao" defaultValue={campeonato.descricao || ''} rows={3} className="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="rua">Rua</label>
                        <input id="rua" name="rua" defaultValue={campeonato.endereco?.rua} required className="w-full border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="numero">Número</label>
                        <input id="numero" name="numero" defaultValue={campeonato.endereco?.numero} required className="w-full border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="complemento">Complemento</label>
                        <input id="complemento" name="complemento" defaultValue={campeonato.endereco?.complemento || ''} className="w-full border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="bairro">Bairro</label>
                        <input id="bairro" name="bairro" defaultValue={campeonato.endereco?.bairro} required className="w-full border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="cidade">Cidade</label>
                        <input id="cidade" name="cidade" defaultValue={campeonato.endereco?.cidade} required className="w-full border rounded px-3 py-2 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="estado">Estado</label>
                        <EstadoSelect
                          id="estado"
                          value={estadoEndereco}
                          onChange={setEstadoEndereco}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="cep">CEP</label>
                        <input id="cep" name="cep" defaultValue={campeonato.endereco?.cep} required className="w-full border rounded px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm rounded border">Cancelar</button>
                    <button
                      type="submit"
                      disabled={updateCoreMutation.isPending || updateAddressMutation.isPending}
                      className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {(updateCoreMutation.isPending || updateAddressMutation.isPending) ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MeuCampeonato;
