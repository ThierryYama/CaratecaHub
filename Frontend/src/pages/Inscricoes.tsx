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
import { AlertCircle, CheckCircle2, Users, UserRound, ChevronsUpDown, Check, Building2, Trophy, Award, Weight, Search as SearchIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const modalidadeLabel = (m?: Modalidade) => (m ?? '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const isEquipeModalidade = (m?: string) => m === 'KATA_EQUIPE' || m === 'KUMITE_EQUIPE';
const isIndividualModalidade = (m?: string) => m === 'KATA' || m === 'KUMITE';

const ORDEM_GRADUACAO_PADRAO = [
  '10º KYU','9º KYU','8º KYU','7º KYU','6º KYU','5º KYU','4º KYU','3º KYU','2º KYU','1º KYU',
  '1º DAN','2º DAN','3º DAN','4º DAN','5º DAN','6º DAN','7º DAN','8º DAN','9º DAN','10º DAN'
];
const normalizaGraduacao = (g?: string) => (g || '').trim().toUpperCase();
const graduacaoIndex = (g?: string) => {
  const n = normalizaGraduacao(g);
  const i = ORDEM_GRADUACAO_PADRAO.indexOf(n);
  return i === -1 ? ORDEM_GRADUACAO_PADRAO.length + 1 : i;
};
const calcIdadeNaData = (dataNascimento?: string, dataRef?: Date) => {
  if (!dataNascimento) return 0;
  const nascimento = new Date(dataNascimento);
  const ref = dataRef ?? new Date();
  let idade = ref.getFullYear() - nascimento.getFullYear();
  const mDiff = ref.getMonth() - nascimento.getMonth();
  if (mDiff < 0 || (mDiff === 0 && ref.getDate() < nascimento.getDate())) idade--;
  return idade;
};

const Inscricoes: React.FC = () => {
  const { isCollapsed: sidebarCollapsed, toggle: toggleSidebarCtx, setCollapsed: setSidebarCollapsed } = useSidebar();
  const [tab, setTab] = useState<'atletas' | 'equipes'>('atletas');
  const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const CATEGORY_PAGE_SIZE = 9;
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; onConfirm?: () => void }>({ open: false });
  const { toast } = useToast();
  const navigate = useNavigate();

  const params = useParams<{ id?: string }>();
  const persistedId = typeof globalThis === 'undefined' ? undefined : globalThis.localStorage?.getItem('currentCampeonatoId');
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

  const allInscricoesAtletas = useQuery({
    queryKey: ['allInscricoesAtletas', campeonatoId],
    queryFn: async () => {
      if (!campeonatoId) return [];
      const modalidades = modalidadesIndividuais;
      const promises = modalidades.map(m => 
        fetchInscricoesAtletaPorIdDeCampeonatoModalidade(m.idCampeonatoModalidade)
          .then(inscricoes => ({ idModalidade: m.idCampeonatoModalidade, inscricoes }))
          .catch(() => ({ idModalidade: m.idCampeonatoModalidade, inscricoes: [] }))
      );
      return Promise.all(promises);
    },
    enabled: !!campeonatoId,
  });

  const allInscricoesEquipes = useQuery({
    queryKey: ['allInscricoesEquipes', campeonatoId],
    queryFn: async () => {
      if (!campeonatoId) return [];
      const modalidades = modalidadesEquipe;
      const promises = modalidades.map(m => 
        fetchInscricoesEquipePorIdDeCampeonatoModalidade(m.idCampeonatoModalidade)
          .then(inscricoes => ({ idModalidade: m.idCampeonatoModalidade, inscricoes }))
          .catch(() => ({ idModalidade: m.idCampeonatoModalidade, inscricoes: [] }))
      );
      return Promise.all(promises);
    },
    enabled: !!campeonatoId,
  });

  const validacaoInscricoes = useMemo(() => {
    const categoriasInsuficientes: string[] = [];
    
    (allInscricoesAtletas.data ?? []).forEach(({ idModalidade, inscricoes }) => {
      const modalidade = modalidadesIndividuais.find(m => m.idCampeonatoModalidade === idModalidade);
      const inscritos = (inscricoes as InscricaoAtleta[]).filter(i => i.status === StatusInscricao.INSCRITO);
      if (inscritos.length < 2 && modalidade) {
        const label = `${modalidade.categoria?.nome || ''} · ${modalidade.categoria?.genero || ''} · ${modalidadeLabel(modalidade.categoria?.modalidade)}`;
        categoriasInsuficientes.push(label);
      }
    });

    (allInscricoesEquipes.data ?? []).forEach(({ idModalidade, inscricoes }) => {
      const modalidade = modalidadesEquipe.find(m => m.idCampeonatoModalidade === idModalidade);
      const inscritos = (inscricoes as InscricaoEquipe[]).filter(i => i.status === StatusInscricao.INSCRITO);
      if (inscritos.length < 2 && modalidade) {
        const label = `${modalidade.categoria?.nome || ''} · ${modalidade.categoria?.genero || ''} · ${modalidadeLabel(modalidade.categoria?.modalidade)}`;
        categoriasInsuficientes.push(label);
      }
    });

    return {
      podeConfirmar: categoriasInsuficientes.length === 0,
      categoriasInsuficientes,
    };
  }, [allInscricoesAtletas.data, allInscricoesEquipes.data, modalidadesIndividuais, modalidadesEquipe]);

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
      const cat = selectedModalidade?.categoria;
      const catGenero = cat?.genero;
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

      const refData = camp ? new Date(camp.dataInicio) : new Date();
      if (cat && tab === 'atletas') {
        list = (list as any[]).map((a: any) => {
          const idade = calcIdadeNaData(a.dataNascimento, refData);
          const reasons: Record<string,string> = {};
          if (cat.faixaIdadeMin != null && idade < cat.faixaIdadeMin) reasons.idade = `Idade ${idade} < mínimo ${cat.faixaIdadeMin}`;
          if (cat.faixaIdadeMax != null && idade > cat.faixaIdadeMax) reasons.idade = `Idade ${idade} > máximo ${cat.faixaIdadeMax}`;
          if (cat.modalidade === 'KUMITE') {
            if (cat.pesoMin != null && a.peso < Number(cat.pesoMin)) reasons.peso = `Peso ${a.peso}kg < mínimo ${cat.pesoMin}kg`;
            if (cat.pesoMax != null && a.peso > Number(cat.pesoMax)) reasons.peso = `Peso ${a.peso}kg > máximo ${cat.pesoMax}kg`;
          }
          if (cat.graduacaoMin && graduacaoIndex(a.graduacao) < graduacaoIndex(cat.graduacaoMin)) reasons.graduacao = `Graduação ${a.graduacao} < ${cat.graduacaoMin}`;
          if (cat.graduacaoMax && graduacaoIndex(a.graduacao) > graduacaoIndex(cat.graduacaoMax)) reasons.graduacao = `Graduação ${a.graduacao} > ${cat.graduacaoMax}`;
          return { ...a, _validationReasons: reasons };
        });
      } else if (cat && tab === 'equipes') {
        list = (list as any[]).map((equipe: any) => {
          const membros = (equipe.membros?.map((m: any) => m.atleta) || []).filter(Boolean);
          const idades = membros.map((a: any) => calcIdadeNaData(a.dataNascimento, refData));
          const gradIdx = membros.map((a: any) => graduacaoIndex(a.graduacao));
          const pesos = membros.map((a: any) => Number(a.peso)).filter((p: number) => !Number.isNaN(p));
          const reasons: Record<string,string> = {};
          if (idades.length) {
            const minIdade = Math.min(...idades);
            const maxIdade = Math.max(...idades);
            if (cat.faixaIdadeMin != null && minIdade < cat.faixaIdadeMin) reasons.idade = `Idade mínima dos membros ${minIdade} < mínimo ${cat.faixaIdadeMin}`;
            if (cat.faixaIdadeMax != null && maxIdade > cat.faixaIdadeMax) reasons.idade = `Idade máxima dos membros ${maxIdade} > máximo ${cat.faixaIdadeMax}`;
          }
          if (gradIdx.length) {
            const minG = Math.min(...gradIdx);
            const maxG = Math.max(...gradIdx);
            if (cat.graduacaoMin && minG < graduacaoIndex(cat.graduacaoMin)) reasons.graduacao = `Há membro(s) com graduação < ${cat.graduacaoMin}`;
            if (cat.graduacaoMax && maxG > graduacaoIndex(cat.graduacaoMax)) reasons.graduacao = `Há membro(s) com graduação > ${cat.graduacaoMax}`;
          }
          if (cat.modalidade === 'KUMITE_EQUIPE' && pesos.length) {
            const minPeso = Math.min(...pesos);
            const maxPeso = Math.max(...pesos);
            if (cat.pesoMin != null && minPeso < Number(cat.pesoMin)) reasons.peso = `Peso mínimo dos membros ${minPeso}kg < mínimo ${cat.pesoMin}kg`;
            if (cat.pesoMax != null && maxPeso > Number(cat.pesoMax)) reasons.peso = `Peso máximo dos membros ${maxPeso}kg > máximo ${cat.pesoMax}kg`;
          }
          return { ...equipe, _validationReasons: reasons };
        });
      }
    }
    return list as any;
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

  const categoriaLabel = (m?: Modalidade) => (m ?? '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const categoriasParaTab = selectableModalidades;
  const categoriasFiltradas = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoriasParaTab;
    return categoriasParaTab.filter((m: any) => {
      const nome = (m?.categoria?.nome || '').toLowerCase();
      const genero = (m?.categoria?.genero || '').toLowerCase();
      const mod = categoriaLabel(m?.categoria?.modalidade).toLowerCase();
      return nome.includes(q) || genero.includes(q) || mod.includes(q);
    });
  }, [categoriasParaTab, categorySearch]);
  const totalCategorias = categoriasFiltradas.length;
  const totalPages = Math.max(1, Math.ceil(totalCategorias / CATEGORY_PAGE_SIZE));
  const currentPage = Math.min(categoryPage, totalPages);
  const pageSliceStart = (currentPage - 1) * CATEGORY_PAGE_SIZE;
  const categoriasPaginadas = categoriasFiltradas.slice(pageSliceStart, pageSliceStart + CATEGORY_PAGE_SIZE);

  useEffect(() => {
    setCategoryPage(1);
  }, [tab, categorySearch]);

  const renderCategorySelection = (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-red-600" />
          Selecione a Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full border rounded pl-9 pr-3 py-2"
              placeholder="Buscar categoria por nome, gênero ou modalidade..."
            />
          </div>
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {totalCategorias} {totalCategorias === 1 ? 'categoria' : 'categorias'}
          </div>
        </div>

        {categoriasPaginadas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma categoria encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriasPaginadas.map((m: any) => {
              const isSelected = selectedModalidadeId === m.idCampeonatoModalidade;
              const cat = m.categoria || {};
              const pesoInfo = (cat.pesoMin != null || cat.pesoMax != null) ? (
                <div className="flex items-center gap-1">
                  <Weight className="w-3 h-3" />
                  <span>
                    {cat.pesoMin != null && cat.pesoMax != null ? `${cat.pesoMin}kg - ${cat.pesoMax}kg` :
                      cat.pesoMin != null ? `≥ ${cat.pesoMin}kg` : `≤ ${cat.pesoMax}kg`}
                  </span>
                </div>
              ) : null;
              return (
                <button
                  key={m.idCampeonatoModalidade}
                  onClick={() => setSelectedModalidadeId(m.idCampeonatoModalidade)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected ? 'border-red-600 bg-red-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                        {cat?.nome}
                      </h3>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Trophy className="w-4 h-4" />
                        <span>{modalidadeLabel(cat?.modalidade)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {cat?.genero}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {cat?.faixaIdadeMin} - {cat?.faixaIdadeMax} anos
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{cat?.graduacaoMin} a {cat?.graduacaoMax}</span>
                        </div>
                        {pesoInfo}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}


        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Página {currentPage} de {totalPages}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={currentPage <= 1} onClick={() => setCategoryPage(p => Math.max(1, p - 1))}>Anterior</Button>
              <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setCategoryPage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
            </div>
          </div>
        )}
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
          {filteredList.map((item: any) => {
            const assoc = item.associacao;
            const nomeAssociacao = assoc ? (assoc.nome || assoc.sigla || assoc.cnpj || `Assoc. #${item.idAssociacao}`) : null;
            const reasons: Record<string,string> | undefined = (item as any)._validationReasons;
            const invalid = !!reasons && Object.keys(reasons).length > 0;
            return (
              <div key={(item.idAtleta ?? item.idEquipe)} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                  <div className="flex-1 max-w-full">
                    <h3 className="font-semibold text-gray-900 whitespace-normal break-words leading-tight max-w-full overflow-visible" title={item.nome}>{item.nome}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.genero && (
                        <Badge className={getGeneroBadgeClass(item.genero)}>
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
                  <div className="shrink-0 w-full sm:w-auto">
                    <Button
                      disabled={selectedModalidadeId == null || !canInscrever(tab === 'atletas') || invalid}
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
                      className="bg-red-600 hover:bg-red-700 w-full"
                    >
                      {invalid ? 'Inadequado' : 'Inscrever'}
                    </Button>
                  </div>
                </div>
                {invalid && (
                  <div className="text-xs text-red-600 border border-red-200 rounded p-2 bg-red-50">
                    <strong>Requisitos não atendidos:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {Object.entries(reasons!).map(([key, r]) => (
                        <li key={key}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {tab === 'atletas' && (
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <p>Graduação: {item.graduacao}</p>
                    <p>Peso: {item.peso} kg</p>
                  </div>
                )}
              </div>
            );
          })}
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
                <TableHead>Associação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tab === 'atletas' ? (inscricoesAtletas ?? []).filter(i => i.status === StatusInscricao.INSCRITO) : (inscricoesEquipes ?? []).filter(i => i.status === StatusInscricao.INSCRITO)).map((insc: any) => {
                const participante = tab === 'atletas' ? insc.atleta : insc.equipe;
                const assoc = participante?.associacao;
                const nomeAssociacao = assoc ? (assoc.nome || assoc.sigla || assoc.cnpj || `Assoc. #${participante.idAssociacao}`) : '-';
                
                return (
                  <TableRow key={(insc.idInscricaoAtleta ?? insc.idInscricaoEquipe)}>
                    <TableCell className="font-medium">{participante?.nome}</TableCell>
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
                            setConfirmDialog({
                              open: true,
                              onConfirm: () => {
                                if (tab === 'atletas') {
                                  desvincularInscricaoAtleta.mutate(insc.idInscricaoAtleta);
                                } else {
                                  desvincularInscricaoEquipe.mutate(insc.idInscricaoEquipe);
                                }
                              }
                            });
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
          {renderCategorySelection}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderList}
            {renderInscritos}
          </div>
          {!validacaoInscricoes.podeConfirmar && validacaoInscricoes.categoriasInsuficientes.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Categorias com inscrições insuficientes</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Cada categoria precisa ter pelo menos 2 participantes inscritos para confirmar as inscrições.
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {validacaoInscricoes.categoriasInsuficientes.map((cat, idx) => (
                      <li key={idx}>{cat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-3 mt-6">
            <Button
              className="bg-green-600 hover:bg-green-700 px-8"
              onClick={() => {
                refetchCamp();
                refetchEtapas();
                allInscricoesAtletas.refetch();
                allInscricoesEquipes.refetch();
              }}
            >
              Atualizar Listas
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 px-8"
              disabled={!!etapasStatus?.inscricoesConfirmadas || confirmarInscricoesMutation.isPending || !validacaoInscricoes.podeConfirmar}
              title={
                etapasStatus?.inscricoesConfirmadas
                  ? 'Inscrições já confirmadas'
                  : !validacaoInscricoes.podeConfirmar
                    ? 'Cada categoria precisa ter pelo menos 2 participantes inscritos.'
                    : undefined
              }
              onClick={() => {
                if (etapasStatus?.inscricoesConfirmadas) return;
                if (!validacaoInscricoes.podeConfirmar) {
                  toast({
                    title: 'Inscrições insuficientes',
                    description: 'Cada categoria precisa ter pelo menos 2 participantes inscritos.',
                    variant: 'destructive'
                  });
                  return;
                }
                setConfirmDialog({
                  open: true,
                  onConfirm: () => confirmarInscricoesMutation.mutate()
                });
              }}
            >
              {confirmarInscricoesMutation.isPending ? 'Confirmando...' : 'Confirmar Inscrições'}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDialog.open}
            title="Confirmação"
            description="Tem certeza que deseja realizar esta ação?"
            onCancel={() => setConfirmDialog({ open: false })}
            onConfirm={() => {
              confirmDialog.onConfirm?.();
              setConfirmDialog({ open: false });
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default Inscricoes;

function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-semibold mb-2">{title || 'Confirmação'}</h2>
        <p className="mb-4">{description || 'Tem certeza que deseja realizar esta ação?'}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
}

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
