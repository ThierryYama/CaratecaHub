import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Categoria,
  Modalidade,
  InscricaoAtleta,
  InscricaoEquipe,
  CampeonatoDetalhado,
  StatusInscricao,
} from '@/services/api';
import { AlertCircle, CheckCircle2, Users, UserRound } from 'lucide-react';

const modalidadeLabel = (m?: Modalidade) => (m ?? '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const isEquipeModalidade = (m?: Modalidade) => m === 'KATA_EQUIPE' || m === 'KUMITE_EQUIPE';
const isIndividualModalidade = (m?: Modalidade) => m === 'KATA' || m === 'KUMITE';

const Inscricoes: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('inscricoes');
  const [tab, setTab] = useState<'atletas' | 'equipes'>('atletas');
  const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const params = useParams<{ id?: string }>();
  const persistedId = typeof window !== 'undefined' ? localStorage.getItem('currentCampeonatoId') : undefined;
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    if (persistedId) return Number(persistedId);
    return undefined;
  }, [params.id, persistedId]);

  const queryClient = useQueryClient();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleMenuItemClick = (id: string) => setActiveMenuItem(id);

  const { data: camp, isLoading: loadingCamp, isError: errCamp, refetch: refetchCamp } = useQuery<CampeonatoDetalhado>({
    queryKey: ['campeonatoDetalhado', campeonatoId],
    queryFn: () => fetchCampeonatoDetalhado(campeonatoId!),
    enabled: !!campeonatoId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const categoriasModalidades = camp?.modalidades ?? [];
  const modalidadesIndividuais = categoriasModalidades.filter(m => isIndividualModalidade(m.categoria?.modalidade as Modalidade));
  const modalidadesEquipe = categoriasModalidades.filter(m => isEquipeModalidade(m.categoria?.modalidade as Modalidade));

  const { data: atletas, isLoading: loadingAtletas } = useQuery({
    queryKey: ['atletas'],
    queryFn: fetchAtletas,
    enabled: tab === 'atletas',
  });
  const { data: equipes, isLoading: loadingEquipes } = useQuery({
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
    onError: (e: any) => toast({ title: 'Falha ao inscrever atleta', description: e?.message || 'Tente novamente', variant: 'destructive' as any }),
  });

  const confirmarInscricaoAtleta = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoAtleta(idInscricao, { status: StatusInscricao.INSCRITO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesAtletasPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição confirmada' });
    },
    onError: (e: any) => toast({ title: 'Falha ao confirmar inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' as any }),
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
    onError: (e: any) => toast({ title: 'Falha ao inscrever equipe', description: e?.message || 'Tente novamente', variant: 'destructive' as any }),
  });

  const confirmarInscricaoEquipe = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoEquipe(idInscricao, { status: StatusInscricao.INSCRITO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesEquipesPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição confirmada' });
    },
    onError: (e: any) => toast({ title: 'Falha ao confirmar inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' as any }),
  });

  const desvincularInscricaoAtleta = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoAtleta(idInscricao, { status: StatusInscricao.AGUARDANDO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesAtletasPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição removida' });
    },
    onError: (e: any) => toast({ title: 'Falha ao desvincular inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' as any }),
  });

  const desvincularInscricaoEquipe = useMutation({
    mutationFn: (idInscricao: number) => updateInscricaoEquipe(idInscricao, { status: StatusInscricao.AGUARDANDO }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inscricoesEquipesPorModalidade', selectedModalidadeId] });
      toast({ title: 'Inscrição removida' });
    },
    onError: (e: any) => toast({ title: 'Falha ao desvincular inscrição', description: e?.message || 'Tente novamente', variant: 'destructive' as any }),
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
  }, [tab, categoriasModalidades]);

  const availableList = useMemo(() => {
    const baseList = tab === 'atletas' ? (atletas ?? []) : (equipes ?? []);
    let list: any[] = baseList as any[];
    if (selectedModalidadeId != null) {
      if (tab === 'atletas') {
        const set = new Set((inscricoesAtletas ?? []).filter(i => i.status === StatusInscricao.INSCRITO).map(i => i.idAtleta));
        list = list.filter((a: any) => !set.has(a.idAtleta));
      } else {
        const set = new Set((inscricoesEquipes ?? []).filter(i => i.status === StatusInscricao.INSCRITO).map(i => i.idEquipe));
        list = list.filter((e: any) => !set.has(e.idEquipe));
      }
    }

    if (tab === 'atletas' && selectedModalidadeId != null) {
      const gen = selectedModalidade?.categoria?.genero as 'Masculino' | 'Feminino' | 'Outro' | undefined;
      if (gen) {
        list = list.filter((a: any) => a.genero === gen);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="flex rounded-md overflow-hidden border">
              <button className={`px-4 py-2 ${tab === 'atletas' ? 'bg-red-600 text-white' : 'bg-white'}`} onClick={() => { setTab('atletas'); setSelectedModalidadeId(null); }}>Atletas</button>
              <button className={`px-4 py-2 ${tab === 'equipes' ? 'bg-red-600 text-white' : 'bg-white'}`} onClick={() => { setTab('equipes'); setSelectedModalidadeId(null); }}>Equipes</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <Select value={selectedModalidadeId != null ? String(selectedModalidadeId) : undefined} onValueChange={(v) => setSelectedModalidadeId(Number(v))} onOpenChange={(open) => { if (open) refetchCamp(); }}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {selectableModalidades.map((m) => (
                  <SelectItem key={m.idCampeonatoModalidade} value={String(m.idCampeonatoModalidade)}>
                    {m.categoria?.nome} · {m.categoria?.genero} · {modalidadeLabel(m.categoria?.modalidade as Modalidade)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nome</label>
            <input
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

  const renderList = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tab === 'atletas' ? <UserRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          {tab === 'atletas' ? 'Atletas disponíveis' : 'Equipes disponíveis'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tab === 'atletas' && selectedModalidade && !isIndividualModalidade(selectedModalidade.categoria?.modalidade as Modalidade) && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">Selecione uma categoria individual para inscrever atletas.</div>
        )}
        {tab === 'equipes' && selectedModalidade && !isEquipeModalidade(selectedModalidade.categoria?.modalidade as Modalidade) && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">Selecione uma categoria de equipe para inscrever equipes.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item: any) => (
            <div key={(item.idAtleta ?? item.idEquipe)} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div className="flex-1 max-w-full">
                  <h3 className="font-semibold text-gray-900 whitespace-normal break-words leading-tight max-w-full overflow-visible" title={item.nome}>{item.nome}</h3>
                  {item.genero && (
                    <Badge className={item.genero === 'Masculino' ? 'bg-blue-50 text-blue-600' : item.genero === 'Feminino' ? 'bg-pink-50 text-pink-600' : 'bg-purple-50 text-purple-600'}>
                      {item.genero}
                    </Badge>
                  )}
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                <Button
                  disabled={selectedModalidadeId == null || (tab === 'atletas' ? !isIndividualModalidade(selectedModalidade?.categoria?.modalidade as Modalidade) : !isEquipeModalidade(selectedModalidade?.categoria?.modalidade as Modalidade))}
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
      <Sidebar isCollapsed={sidebarCollapsed} onItemClick={handleMenuItemClick} />
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
        </main>
      </div>
    </div>
  );
};

export default Inscricoes;
