import React, { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampeonatoDetalhado, fetchCampeonatosPublicos, getStoredAssociacao, Status } from '@/services/api';
import { CalendarDays, MapPin, Trophy, Users, Building2, Search, Filter, History, Award } from 'lucide-react';

const CampeonatosPublicos: React.FC = () => {
  const { toggle } = useSidebar();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const { data: campeonatos, isLoading, isError, refetch } = useQuery<CampeonatoDetalhado[]>({
    queryKey: ['campeonatosPublicos'],
    queryFn: fetchCampeonatosPublicos,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const myAssoc = getStoredAssociacao();

  const estadosDisponiveis = useMemo(() => {
    const estados = new Set<string>();
    for (const c of (campeonatos ?? [])) {
      if (c.endereco?.estado) estados.add(c.endereco.estado);
    }
    return Array.from(estados).sort((a, b) => a.localeCompare(b));
  }, [campeonatos]);

  const filtered = useMemo(() => {
    let list = (campeonatos ?? []).filter(c => c.idAssociacao !== myAssoc?.idAssociacao);
    
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(c =>
        c.nome.toLowerCase().includes(qq) ||
        (c.associacao?.nome?.toLowerCase?.() || '').includes(qq) ||
        (c.endereco?.cidade?.toLowerCase?.() || '').includes(qq) ||
        (c.descricao?.toLowerCase?.() || '').includes(qq)
      );
    }

    if (filtroEstado !== 'todos') {
      list = list.filter(c => c.endereco?.estado === filtroEstado);
    }

    if (filtroStatus !== 'todos') {
      list = list.filter(c => c.status === filtroStatus);
    }

    return list;
  }, [campeonatos, q, myAssoc?.idAssociacao, filtroEstado, filtroStatus]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.PENDENTE:
        return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case Status.EM_ANDAMENTO:
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case Status.FINALIZADO:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case Status.CANCELADO:
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case Status.PENDENTE: return 'Pendente';
      case Status.EM_ANDAMENTO: return 'Em Andamento';
      case Status.FINALIZADO: return 'Finalizado';
      case Status.CANCELADO: return 'Cancelado';
      default: return 'Indefinido';
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggle} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Campeonatos Públicos</h1>
                <p className="text-muted-foreground mt-2">Explore eventos de outras associações e inscreva seus atletas</p>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros de Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  {/* Busca geral */}
                  <div className="flex-1 min-w-[280px]">
                    <label htmlFor="busca-geral" className="block text-sm font-medium text-gray-700 mb-2">Busca Geral</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="busca-geral"
                        placeholder="Nome, associação, cidade ou descrição..."
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtro por estado */}
                  <div className="w-48">
                    <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                      <SelectTrigger id="filtro-estado">
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os estados</SelectItem>
                        {estadosDisponiveis.map(estado => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por status */}
                  <div className="w-48">
                    <label htmlFor="filtro-status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger id="filtro-status">
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value={Status.PENDENTE}>Pendente</SelectItem>
                        <SelectItem value={Status.EM_ANDAMENTO}>Em Andamento</SelectItem>
                        <SelectItem value={Status.FINALIZADO}>Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão limpar filtros */}
                  {(q || filtroEstado !== 'todos' || filtroStatus !== 'todos') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQ('');
                        setFiltroEstado('todos');
                        setFiltroStatus('todos');
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-16 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-pulse" />
                Carregando campeonatos públicos...
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="text-center py-16 space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-red-300" />
                <p className="text-red-500">Erro ao carregar campeonatos públicos.</p>
                <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="text-center py-20 border rounded-lg bg-muted/30">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground mb-4">
                  {(q || filtroEstado !== 'todos' || filtroStatus !== 'todos')
                    ? 'Nenhum campeonato encontrado com os filtros aplicados.'
                    : 'Nenhum campeonato público disponível no momento.'}
                </p>
              </div>
            )}

            {/* Cards dos Campeonatos */}
            {!isLoading && !isError && filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((c) => {
                  const dataInicio = new Date(c.dataInicio);
                  const dataFormatada = dataInicio.toLocaleDateString('pt-BR');
                  const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const isPendente = c.status === Status.PENDENTE;
                  
                  return (
                    <Card 
                      key={c.idCampeonato} 
                      className={`transition-all duration-200 ${isPendente ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : 'cursor-default'}`}
                      onClick={isPendente ? () => navigate(`/inscrever-atletas/${c.idCampeonato}`) : undefined}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-2">
                            {c.nome}
                          </CardTitle>
                          <Badge variant="outline" className={getStatusColor(c.status)}>
                            {getStatusText(c.status)}
                          </Badge>
                        </div>
                        {c.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {c.descricao}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Data e Hora */}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="w-4 h-4 shrink-0" />
                            <span className="text-sm">{dataFormatada} às {horaFormatada}</span>
                          </div>

                          {/* Localização */}
                          {c.endereco && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="text-sm line-clamp-1" title={`${c.endereco.cidade} - ${c.endereco.estado}`}>
                                {c.endereco.cidade} - {c.endereco.estado}
                              </span>
                            </div>
                          )}

                          {/* Associação */}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="text-sm line-clamp-1" title={c.associacao?.nome || ''}>
                              {c.associacao?.sigla ? `${c.associacao.sigla} • ` : ''}{c.associacao?.nome || `Associação #${c.idAssociacao}`}
                            </span>
                          </div>

                          {/* Estatísticas */}
                          <div className="pt-3 border-t border-border">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Trophy className="w-4 h-4" />
                                <span className="text-sm">
                                  {c.modalidades?.length || 0} {(c.modalidades?.length || 0) === 1 ? 'categoria' : 'categorias'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Botões de ação baseados no status */}
                            <div className="flex gap-2 mt-3">
                              {c.status === Status.PENDENTE && (
                                <Button 
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/inscrever-atletas/${c.idCampeonato}`);
                                  }}
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Inscrever
                                </Button>
                              )}
                              
                              {c.status === Status.EM_ANDAMENTO && (
                                <>
                                  <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/historico-brackets-publico/${c.idCampeonato}`);
                                    }}
                                  >
                                    <History className="w-4 h-4 mr-2" />
                                    Chaveamentos
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="flex-1"
                                    disabled
                                    title="Ranking disponível apenas após finalização do campeonato"
                                  >
                                    <Award className="w-4 h-4 mr-2" />
                                    Ranking
                                  </Button>
                                </>
                              )}
                              
                              {c.status === Status.FINALIZADO && (
                                <>
                                  <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/historico-brackets-publico/${c.idCampeonato}`);
                                    }}
                                  >
                                    <History className="w-4 h-4 mr-2" />
                                    Chaveamentos
                                  </Button>
                                  <Button 
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/resultados-finais-publico/${c.idCampeonato}`);
                                    }}
                                  >
                                    <Award className="w-4 h-4 mr-2" />
                                    Resultados
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Contador de resultados */}
            {!isLoading && !isError && filtered.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Exibindo {filtered.length} {filtered.length === 1 ? 'campeonato' : 'campeonatos'}
                {(campeonatos?.length || 0) > filtered.length && ` de ${campeonatos?.length} no total`}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CampeonatosPublicos;
