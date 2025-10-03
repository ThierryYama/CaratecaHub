import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  fetchCampeonatoDetalhado,
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
  fetchEtapas,
  confirmarInscricoes,
} from '@/services/api';
import { AlertCircle, CheckCircle2, Users, UserRound, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const modalidadeLabel = (m?: Modalidade) => (m ?? '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const isEquipeModalidade = (m?: string) => m === 'KATA_EQUIPE' || m === 'KUMITE_EQUIPE';
const isIndividualModalidade = (m?: string) => m === 'KATA' || m === 'KUMITE';

const Inscricoes: React.FC = () => {
  const { isCollapsed: sidebarCollapsed, toggle: toggleSidebarCtx, setCollapsed: setSidebarCollapsed } = useSidebar();
  const [tab, setTab] = useState<'atletas' | 'equipes'>('atletas');
  const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const params = useParams<{ id?: string }>();
  const persistedId = typeof window !== 'undefined' ? localStorage.getItem('currentCampeonatoId') : undefined;
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    if (persistedId) return Number(persistedId);
    return undefined;
  }, [params.id, persistedId]);

  const queryClient = useQueryClient();

  const toggleSidebar = () => toggleSidebarCtx();
  const handleMenuItemClick = (_id: string) => { };

  const { data: camp, refetch: refetchCamp } = useQuery<CampeonatoDetalhado>({
    queryKey: ['campeonatoDetalhado', campeonatoId],
    queryFn: () => {
      if (!campeonatoId) throw new Error('Campeonato não definido');
      return fetchCampeonatoDetalhado(campeonatoId);
    },
    enabled: !!campeonatoId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: etapasStatus, refetch: refetchEtapas } = useQuery({
    queryKey: ['etapas', campeonatoId],
    queryFn: () => (campeonatoId ? fetchEtapas(campeonatoId) : Promise.resolve(undefined)),
    enabled: !!campeonatoId,
    staleTime: 0,
  });

  const categoriasModalidades = camp?.modalidades ?? [];
  const modalidadesIndividuais = categoriasModalidades.filter(m => isIndividualModalidade(m.categoria?.modalidade));
  const modalidadesEquipe = categoriasModalidades.filter(m => isEquipeModalidade(m.categoria?.modalidade));

  const { data: atletas } = useQuery({
    queryKey: ['atletas'],
    queryFn: fetchAtletas,
    enabled: tab === 'atletas',
  });
  const { data: equipes } = useQuery({
    queryKey: ['equipes'],
    queryFn: fetchEquipes,
    enabled: tab === 'equipes',
  });

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

  const confirmarInscricaoAtleta = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoAtleta(idInscricao, { status: StatusInscricao.INSCRITO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesAtletasPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição confirmada' });
    },
    onError: (e: any) => toast({ title: 'Falha ao confirmar inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' }),
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

  const confirmarInscricaoEquipe = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoEquipe(idInscricao, { status: StatusInscricao.INSCRITO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesEquipesPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição confirmada' });
    },
    onError: (e: any) => toast({ title: 'Falha ao confirmar inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' }),
  });

  const desvincularInscricaoAtleta = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoAtleta(idInscricao, { status: StatusInscricao.AGUARDANDO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesAtletasPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição removida' });
    },
    onError: (e: any) => toast({ title: 'Falha ao desvincular inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' }),
  });

  const desvincularInscricaoEquipe = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoEquipe(idInscricao, { status: StatusInscricao.AGUARDANDO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesEquipesPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição removida' });
    },
    onError: (e: any) => toast({ title: 'Falha ao desvincular inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' }),
  });

  const confirmarInscricoesMutation = useMutation({
    mutationFn: async () => {
      if (!campeonatoId) throw new Error('Campeonato não definido');
      return confirmarInscricoes(campeonatoId);
    },
    onSuccess: () => {
      toast({ title: 'Inscrições confirmadas' });
      refetchEtapas();
      navigate(`/meu-campeonato/${campeonatoId}`);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Tente novamente';
      toast({ title: 'Falha ao confirmar inscrições', description: msg, variant: 'destructive' });
    }
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

  const availableList = useMemo(() => {
    const baseList = tab === 'atletas' ? (atletas ?? []) : (equipes ?? []);
    let list: ListItem[] = baseList as unknown as ListItem[];
    if (selectedModalidadeId != null) {
      if (tab === 'atletas') {
        const set = new Set((inscricoesAtletas ?? []).filter(i => i.status === StatusInscricao.INSCRITO).map(i => i.idAtleta));
        list = list.filter((a: any) => !set.has(a.idAtleta));
      } else {
        const set = new Set((inscricoesEquipes ?? []).filter(i => i.status === StatusInscricao.INSCRITO).map(i => i.idEquipe));
        list = list.filter((e: any) => !set.has(e.idEquipe));
      }
    }

    if (selectedModalidadeId != null) {
      const catGenero = selectedModalidade?.categoria?.genero;
      if (tab === 'atletas') {
        if (catGenero && catGenero !== 'Misto') {
          list = list.filter((a: any) => a.genero === catGenero);
        }
      } else {
        if (catGenero === 'Misto') {
          list = list.filter((e: any) => e.genero === 'Misto');
        } else if (catGenero) {
          list = list.filter((e: any) => e.genero === catGenero);
        }
      }
    }
    return list;
  }, [tab, selectedModalidadeId, selectedModalidade, inscricoesAtletas, inscricoesEquipes, atletas, equipes]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return availableList;
    const q = search.toLowerCase();
    return availableList.filter((i: any) => (i.nome || '').toLowerCase().includes(q));
  }, [availableList, search]);

  const renderHeader = (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Inscrições</h1>
      <p className="text-gray-600">Inscreva atletas e equipes nas categorias do seu campeonato</p>
    </div>
  );

  const renderFilters = (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Tipo</span>
            <div className="flex rounded-md overflow-hidden border">
              <button className={`px-4 py-2 ${tab === 'atletas' ? 'bg-red-600 text-white' : 'bg-white'}`} onClick={() => { setTab('atletas'); setSelectedModalidadeId(null); }}>Atletas</button>
              <button className={`px-4 py-2 ${tab === 'equipes' ? 'bg-red-600 text-white' : 'bg-white'}`} onClick={() => { setTab('equipes'); setSelectedModalidadeId(null); }}>Equipes</button>
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Categoria</span>
            <CategorySearchSelect
              options={selectableModalidades}
              value={selectedModalidadeId}
              onChange={(id) => setSelectedModalidadeId(id)}
              placeholder="Selecione a categoria"
              onOpen={() => refetchCamp()}
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="buscarNome">Buscar por nome</label>
            <input
              id="buscarNome"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder={tab === 'atletas' ? 'Nome do atleta...' : 'Nome da equipe...'}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getGeneroBadgeClass = (g?: string) => {
    if (g === 'Masculino') return 'bg-blue-50 text-blue-600';
    if (g === 'Feminino') return 'bg-pink-50 text-pink-600';
    if (g === 'Outro') return 'bg-purple-50 text-purple-600';
    return 'bg-gray-50 text-gray-600';
  };

  const canInscrever = (isAtletaTab: boolean) => {
    const mod = selectedModalidade?.categoria?.modalidade;
    if (isAtletaTab) return isIndividualModalidade(mod);
    return isEquipeModalidade(mod);
  };

  const renderList = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tab === 'atletas' ? <UserRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          {tab === 'atletas' ? 'Atletas disponíveis' : 'Equipes disponíveis'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tab === 'atletas' && selectedModalidade && !isIndividualModalidade(selectedModalidade.categoria?.modalidade) && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">Selecione uma categoria individual para inscrever atletas.</div>
        )}
        {tab === 'equipes' && selectedModalidade && !isEquipeModalidade(selectedModalidade.categoria?.modalidade) && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">Selecione uma categoria de equipe para inscrever equipes.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item: any) => (
            <div key={(item.idAtleta ?? item.idEquipe)} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div className="flex-1 max-w-full">
                  <h3 className="font-semibold text-gray-900 whitespace-normal break-words leading-tight max-w-full overflow-visible" title={item.nome}>{item.nome}</h3>
                  {item.genero && (
                    <Badge className={getGeneroBadgeClass(item.genero)}>
                      {item.genero}
                    </Badge>
                  )}
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                  <Button
                    disabled={selectedModalidadeId == null || !canInscrever(tab === 'atletas')}
                    onClick={() => {
                      if (selectedModalidadeId == null) return;
                      const modId = Number(selectedModalidadeId);
                      if (tab === 'atletas') {
                        const existing = (inscricoesAtletas ?? []).find(i => i.idAtleta === item.idAtleta);
                        if (existing) {
                          if (existing.status === StatusInscricao.AGUARDANDO) {
                            confirmarInscricaoAtleta.mutate(existing.idInscricaoAtleta);
                          } else {
                            toast({ title: 'Atleta já inscrito nesta categoria' });
                          }
                        } else {
                          inscreverAtleta.mutate({ idAtleta: item.idAtleta, idCampeonatoModalidade: modId });
                        }
                      } else {
                        const existing = (inscricoesEquipes ?? []).find(i => i.idEquipe === item.idEquipe);
                        if (existing) {
                          if (existing.status === StatusInscricao.AGUARDANDO) {
                            confirmarInscricaoEquipe.mutate(existing.idInscricaoEquipe);
                          } else {
                            toast({ title: 'Equipe já inscrita nesta categoria' });
                          }
                        } else {
                          inscreverEquipe.mutate({ idEquipe: item.idEquipe, idCampeonatoModalidade: modId });
                        }
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Inscrever
                  </Button>
                </div>
              </div>
              {tab === 'atletas' && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Graduação: {item.graduacao}</p>
                  <p>Peso: {item.peso} kg</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderInscritos = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Já inscritos na categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedModalidadeId == null ? (
          <div className="text-sm text-gray-600 bg-white border rounded p-3">Selecione uma categoria para ver os inscritos.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tab === 'atletas' ? 'Atleta' : 'Equipe'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tab === 'atletas' ? (inscricoesAtletas ?? []).filter(i => i.status === StatusInscricao.INSCRITO) : (inscricoesEquipes ?? []).filter(i => i.status === StatusInscricao.INSCRITO)).map((insc: any) => (
                <TableRow key={(insc.idInscricaoAtleta ?? insc.idInscricaoEquipe)}>
                  <TableCell className="font-medium">{tab === 'atletas' ? insc.atleta?.nome : insc.equipe?.nome}</TableCell>
                  <TableCell>
                    {insc.status === StatusInscricao.INSCRITO ? (
                      <Badge className="bg-green-100 text-green-800">INSCRITO</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">AGUARDANDO</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 border-red-600"
                        onClick={() => {
                          if (tab === 'atletas') {
                            desvincularInscricaoAtleta.mutate(insc.idInscricaoAtleta);
                          } else {
                            desvincularInscricaoEquipe.mutate(insc.idInscricaoEquipe);
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
  <Sidebar onItemClick={handleMenuItemClick} />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
          {(!campeonatoId) && (
            <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Nenhum campeonato selecionado.
            </div>
          )}
          {renderHeader}
          {renderFilters}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderList}
            {renderInscritos}
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <Button
              className="bg-green-600 hover:bg-green-700 px-8"
              onClick={() => {
                refetchCamp();
                refetchEtapas();
              }}
            >
              Atualizar Listas
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 px-8"
              disabled={!!etapasStatus?.inscricoesConfirmadas || confirmarInscricoesMutation.isPending}
              title={etapasStatus?.inscricoesConfirmadas ? 'Inscrições já confirmadas' : ''}
              onClick={() => confirmarInscricoesMutation.mutate()}
            >
              {confirmarInscricoesMutation.isPending ? 'Confirmando...' : 'Confirmar Inscrições'}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inscricoes;

function CategorySearchSelect({
  options,
  value,
  onChange,
  placeholder,
  onOpen,
}: {
  options: Array<any>;
  value: number | null;
  onChange: (id: number) => void;
  placeholder?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => options.find(o => o.idCampeonatoModalidade === value), [options, value]);
  const labelFor = (o: any) => `${o?.categoria?.nome || ''} · ${o?.categoria?.genero || ''} · ${modalidadeLabel(o?.categoria?.modalidade)}`;
  const selectedLabel = selected ? labelFor(selected) : '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o: any) => {
      const nome = (o?.categoria?.nome || '').toLowerCase();
      const genero = (o?.categoria?.genero || '').toLowerCase();
      const mod = modalidadeLabel(o?.categoria?.modalidade).toLowerCase();
      return nome.includes(q) || genero.includes(q) || mod.includes(q);
    });
  }, [options, query]);

  const shown = filtered.slice(0, 100);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => { setOpen(v); if (v) onOpen?.(); }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-80 h-9 justify-between">
          <span className="truncate max-w-[220px] text-left">{selectedLabel || placeholder || 'Selecione'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Pesquisar categoria..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada</CommandEmpty>
            <CommandGroup heading={query ? undefined : `Mostrando ${Math.min(shown.length, 100)} de ${options.length}`}>
              {shown.map((o: any) => (
                <CommandItem key={o.idCampeonatoModalidade} value={String(o.idCampeonatoModalidade)} onSelect={() => { onChange(o.idCampeonatoModalidade); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${o.idCampeonatoModalidade === value ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="truncate">{labelFor(o)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
