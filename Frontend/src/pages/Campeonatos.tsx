import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, Clock, Users, MapPin, Plus, Search } from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CampeonatoForm from '@/components/campeonatos/CampeonatoForm';
import { useQuery } from '@tanstack/react-query';
import { fetchCampeonatosPorAssociacao, fetchCampeonatoDetalhado, getStoredAssociacao, Campeonato, CampeonatoDetalhado, Status } from '@/services/api';

const Campeonatos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'TODOS'>('TODOS');
  const [openNovo, setOpenNovo] = useState(false);
  
  const assoc = getStoredAssociacao();
  const idAssociacao = assoc?.idAssociacao || 0;

  const { data: campeonatos = [], isLoading, isError, refetch } = useQuery<Campeonato[]>({
    queryKey: ['campeonatos', idAssociacao],
    queryFn: () => fetchCampeonatosPorAssociacao(idAssociacao),
    enabled: !!idAssociacao,
  });

  const [detalhes, setDetalhes] = useState<Record<number, { 
    associacaoNome?: string; 
    bairro?: string; 
    cidade?: string; 
    estado?: string;
    categoriasCount?: number;
    modalidadesCount?: number;
  }>>({});

  useEffect(() => {
    setDetalhes({});
  }, [idAssociacao]);

  useEffect(() => {
    if (!campeonatos.length) return;
    const pendentes = campeonatos.filter(c => !detalhes[c.idCampeonato]);
    if (!pendentes.length) return;
    let cancelado = false;

    async function carregarDetalhes(ids: number[]) {
      const resultados: (CampeonatoDetalhado | null)[] = [];
      for (const id of ids) {
        try {
          const full = await fetchCampeonatoDetalhado(id);
          resultados.push(full);
        } catch {
          resultados.push(null);
        }
      }
      if (cancelado) return;
      const agregado: typeof detalhes = {};
      for (const full of resultados) {
        if (!full) continue;
        const assoc: any = (full as any).associacao;
        const end: any = (full as any).endereco;
        
        const categoriasCount = full.modalidades?.length || 0;
        const modalidadesUnicas = new Set(
          full.modalidades?.map(m => m.categoria?.modalidade).filter(Boolean) || []
        );
        const modalidadesCount = modalidadesUnicas.size;
        
        agregado[full.idCampeonato] = {
          associacaoNome: assoc?.nome,
          bairro: end?.bairro,
          cidade: end?.cidade,
          estado: end?.estado,
          categoriasCount,
          modalidadesCount,
        };
      }
      if (Object.keys(agregado).length) {
        setDetalhes(prev => ({ ...prev, ...agregado }));
      }
    }

    carregarDetalhes(pendentes.map(p => p.idCampeonato));
    return () => { cancelado = true; };
  }, [campeonatos, detalhes]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleMenuItemClick = (_item: string) => {};

  const filteredCampeonatos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return campeonatos.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(term) ||
        (c.descricao?.toLowerCase().includes(term) ?? false);
      const matchesStatus = statusFilter === 'TODOS' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campeonatos, searchTerm, statusFilter]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.PENDENTE:
        return 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-800';
      case Status.EM_ANDAMENTO:
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-800';
      case Status.FINALIZADO:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-800';
      case Status.CANCELADO:
        return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-800';
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

  const handleCardClick = (id: number) => navigate(`/meu-campeonato/${id}`);
  const handleCreate = () => {
    navigate({ pathname: location.pathname, search: '?novo=1' });
    setOpenNovo(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('novo') === '1') {
      setOpenNovo(true);
    } else {
      setOpenNovo(false);
    }
  }, [location.search]);

  const handleCloseForm = () => {
    setOpenNovo(false);
    if (location.search.includes('novo=1')) {
      navigate({ pathname: location.pathname }, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onItemClick={handleMenuItemClick}
        onToggle={toggleSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
  <Header onToggleSidebar={toggleSidebar} onNovoCampeonato={handleCreate} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Meus Campeonatos</h1>
                <p className="text-muted-foreground mt-2">Gerencie todos os campeonatos que você criou</p>
              </div>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Campeonato
              </Button>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-md space-y-2">
                <Label htmlFor="search-campeonatos">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search-campeonatos"
                    placeholder="Buscar campeonatos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | 'TODOS')}>
                  <SelectTrigger id="status-filter" className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value={Status.PENDENTE}>Pendente</SelectItem>
                    <SelectItem value={Status.EM_ANDAMENTO}>Em Andamento</SelectItem>
                    <SelectItem value={Status.FINALIZADO}>Finalizado</SelectItem>
                    <SelectItem value={Status.CANCELADO}>Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-16 text-muted-foreground">Carregando campeonatos...</div>
            )}

            {isError && (
              <div className="text-center py-16 space-y-4">
                <p className="text-red-500">Erro ao carregar campeonatos.</p>
                <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            )}

            {!isLoading && !isError && filteredCampeonatos.length === 0 && (
              <div className="text-center py-20 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground mb-4">Você ainda não cadastrou campeonatos.</p>
                <Button onClick={handleCreate} className="gap-2"><Plus className="w-4 h-4" /> Criar primeiro campeonato</Button>
              </div>
            )}

            {!isLoading && !isError && filteredCampeonatos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampeonatos.map(c => {
                  const dataInicio = new Date(c.dataInicio);
                  const dataFormatada = dataInicio.toLocaleDateString('pt-BR');
                  const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const det = detalhes[c.idCampeonato];
                  let localStr = '—';
                  if (det) {
                    if (det.bairro) localStr = det.bairro;
                    else if (det.cidade && det.estado) localStr = `${det.cidade} - ${det.estado}`;
                    else if (det.cidade) localStr = det.cidade;
                  } else if ((c as any).endereco) {
                    const e: any = (c as any).endereco;
                    if (e.bairro) localStr = e.bairro; else if (e.cidade && e.estado) localStr = `${e.cidade} - ${e.estado}`;
                  }
                  
                  const categoriasCount = det?.categoriasCount ?? 0;
                  const modalidadesCount = det?.modalidadesCount ?? 0;
                  const inscricoesCount = 0;
                  
                  return (
                    <Card key={c.idCampeonato} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={() => handleCardClick(c.idCampeonato)}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-2">{c.nome}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(c.status)}>{getStatusText(c.status)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-sm">{dataFormatada}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{horaFormatada}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm line-clamp-1">{localStr}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm line-clamp-1">{det?.associacaoNome || `Associação #${c.idAssociacao}`}</span>
                          </div>
                          <div className="pt-3 border-t border-border">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-lg font-semibold text-foreground">{categoriasCount}</div>
                                <div className="text-xs text-muted-foreground">Categorias</div>
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-foreground">{modalidadesCount}</div>
                                <div className="text-xs text-muted-foreground">Modalidades</div>
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-foreground">{inscricoesCount}</div>
                                <div className="text-xs text-muted-foreground">Inscrições</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <Dialog open={openNovo} onOpenChange={setOpenNovo}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Campeonato</DialogTitle>
              </DialogHeader>
              <CampeonatoForm
                idAssociacao={getStoredAssociacao()?.idAssociacao || 0}
                onSuccess={handleCloseForm}
                onCancel={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default Campeonatos;
