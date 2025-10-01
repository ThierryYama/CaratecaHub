
import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchCategorias,
  listarCategoriasDeCampeonato,
  adicionarCategoriaAoCampeonato,
  removerCategoriaDeCampeonato,
  Categoria
} from '@/services/api';

const VincularCategorias = () => {
  const { isCollapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebar();
  const [generoFiltro, setGeneroFiltro] = useState<'all' | 'Masculino' | 'Feminino' | 'Outro' | 'Misto'>('all');
  const [modalidadeFiltro, setModalidadeFiltro] = useState<'all' | 'KATA' | 'KUMITE' | 'KATA_EQUIPE' | 'KUMITE_EQUIPE'>('all');
  const [nomeFiltro, setNomeFiltro] = useState<string>('');
  const { toast } = useToast();

  const params = useParams<{ id?: string }>();
  const persistedId = typeof window !== 'undefined' ? localStorage.getItem('currentCampeonatoId') : undefined;
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    if (persistedId) return Number(persistedId);
    return undefined;
  }, [params.id, persistedId]);

  const queryClient = useQueryClient();


  const handleMenuItemClick = (_item: string) => { };

  const {
    data: categorias,
    isLoading: loadingCategorias,
    isError: errorCategorias,
    error: categoriasError,
    refetch: refetchCategorias
  } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: fetchCategorias,
  });

  const {
    data: categoriasVinculadas,
    isLoading: loadingVinculadas,
    isError: errorVinculadas,
    error: vinculadasError,
    refetch: refetchVinculadas
  } = useQuery<Categoria[] | undefined>({
    queryKey: ['categoriasCampeonato', campeonatoId],
    queryFn: () => (campeonatoId ? listarCategoriasDeCampeonato(campeonatoId) : Promise.resolve(undefined)),
    enabled: !!campeonatoId,
  });

  const addMutation = useMutation<void, Error, number>({
    mutationFn: async (categoriaId: number) => {
      if (!campeonatoId) throw new Error('Campeonato inválido');
      return adicionarCategoriaAoCampeonato(campeonatoId, categoriaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriasCampeonato', campeonatoId] });
      toast({ title: 'Categoria vinculada', description: 'A categoria foi vinculada ao campeonato com sucesso.' });
    },
    onError: (err) => {
      toast({
        title: 'Falha ao vincular',
        description: (err as any)?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });

  const removeMutation = useMutation<void, Error, number>({
    mutationFn: async (categoriaId: number) => {
      if (!campeonatoId) throw new Error('Campeonato inválido');
      return removerCategoriaDeCampeonato(campeonatoId, categoriaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriasCampeonato', campeonatoId] });
      toast({ title: 'Categoria removida', description: 'A categoria foi desvinculada do campeonato.' });
    },
    onError: (err) => {
      toast({
        title: 'Falha ao remover',
        description: (err as any)?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });

  const categoriasDisponiveis: Categoria[] = useMemo(() => categorias ?? [], [categorias]);

  const categoriasNaoVinculadas: Categoria[] = useMemo(() => {
    if (!categoriasDisponiveis) return [];
    const vinculadasIds = new Set((categoriasVinculadas ?? []).map(cv => cv.idCategoria));
    let base = categoriasDisponiveis.filter(c => !vinculadasIds.has(c.idCategoria));
    if (nomeFiltro.trim()) {
      const q = nomeFiltro.trim().toLowerCase();
      base = base.filter(c => c.nome.toLowerCase().includes(q));
    }
    if (generoFiltro !== 'all') {
      base = base.filter(c => (c.genero ?? 'Outro') === generoFiltro);
    }
    if (modalidadeFiltro !== 'all') {
      base = base.filter(c => (c.modalidade ?? '') === modalidadeFiltro);
    }
    return base;
  }, [categoriasDisponiveis, categoriasVinculadas, generoFiltro, modalidadeFiltro, nomeFiltro]);

  const generoBadgeClass = (g: Categoria['genero']) => {
    const ng = (g ?? 'Outro');
    switch (ng) {
      case 'Masculino':
        return 'bg-blue-50 text-blue-600';
      case 'Feminino':
        return 'bg-pink-50 text-pink-600';
      case 'Misto':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const generoLabel = (g: Categoria['genero']) => {
    const ng = (g ?? 'Outro');
    if (ng === 'Masculino') return 'Masculino';
    if (ng === 'Feminino') return 'Feminino';
    if (ng === 'Misto') return 'Misto';
    return 'Outro';
  };

  const modalidadeBadgeClass = (m?: Categoria['modalidade']) => {
    switch (m) {
      case 'KATA':
        return 'bg-blue-100 text-blue-800';
      case 'KUMITE':
        return 'bg-orange-100 text-orange-800';
      case 'KATA_EQUIPE':
        return 'bg-indigo-100 text-indigo-800';
      case 'KUMITE_EQUIPE':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const modalidadeLabel = (m?: Categoria['modalidade']) =>
    (m ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const renderLoadingOrError = () => {
    if (!campeonatoId) return (
      <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">Nenhum campeonato selecionado.</div>
    );
    if (loadingCategorias || loadingVinculadas) return (
      <div className="text-sm text-gray-600 bg-white border rounded p-3 animate-pulse">Carregando categorias...</div>
    );
    if (errorCategorias || errorVinculadas) return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
        Erro ao carregar categorias: {(categoriasError as any)?.message || (vinculadasError as any)?.message}
      </div>
    );
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onItemClick={handleMenuItemClick}
      />

      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vincular Categorias</h1>
            <p className="text-gray-600">Adicione ou remova categorias do seu campeonato</p>
          </div>

          {renderLoadingOrError()}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-red-600" />
                Categorias Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="buscarCategoria" className="block text-sm font-medium text-gray-700 mb-2">Buscar por nome</label>
                  <input
                    id="buscarCategoria"
                    type="text"
                    value={nomeFiltro}
                    onChange={(e) => setNomeFiltro(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Digite o nome da categoria..."
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Gênero</span>
                    <Select value={generoFiltro} onValueChange={(v) => setGeneroFiltro(v as any)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Todos os gêneros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Misto">Misto</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Modalidade</span>
                    <Select value={modalidadeFiltro} onValueChange={(v) => setModalidadeFiltro(v as any)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Todas as modalidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="KATA">Kata</SelectItem>
                        <SelectItem value="KUMITE">Kumite</SelectItem>
                        <SelectItem value="KATA_EQUIPE">Kata Equipe</SelectItem>
                        <SelectItem value="KUMITE_EQUIPE">Kumite Equipe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {(categoriasNaoVinculadas.length === 0) ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma categoria disponível para vincular.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoriasNaoVinculadas.map((categoria) => (
                    <div key={categoria.idCategoria} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900">{categoria.nome}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={generoBadgeClass(categoria.genero)}>
                              {generoLabel(categoria.genero)}
                            </Badge>
                            <Badge className={modalidadeBadgeClass(categoria.modalidade)}>
                              {modalidadeLabel(categoria.modalidade)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={addMutation.isPending}
                          onClick={() => addMutation.mutate(categoria.idCategoria)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Idade: {categoria.faixaIdadeMin} - {categoria.faixaIdadeMax} anos</p>
                        <p>Graduação: {categoria.graduacaoMin} - {categoria.graduacaoMax}</p>
                        {(categoria.pesoMin != null || categoria.pesoMax != null) && (
                          <p>Peso: {categoria.pesoMin ?? '-'} - {categoria.pesoMax ?? '-'} kg</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Categorias Vinculadas ao Campeonato
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(Array.isArray(categoriasVinculadas) && categoriasVinculadas.length === 0) ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma categoria vinculada ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(categoriasVinculadas) ? categoriasVinculadas : []).map((categoria) => (
                      <TableRow key={categoria.idCategoria}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              🥋
                            </div>
                            <span className="font-medium">{categoria.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={generoBadgeClass(categoria.genero)}>
                            {generoLabel(categoria.genero)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={modalidadeBadgeClass(categoria.modalidade)}>
                            {modalidadeLabel(categoria.modalidade)}
                          </Badge>
                        </TableCell>
                        <TableCell>{categoria.faixaIdadeMin} - {categoria.faixaIdadeMax} anos</TableCell>
                        <TableCell>
                          {(categoria.pesoMin != null || categoria.pesoMax != null) ? (
                            <>{categoria.pesoMin ?? '-'} - {categoria.pesoMax ?? '-'} kg</>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vinculada
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={removeMutation.isPending}
                            onClick={() => removeMutation.mutate(categoria.idCategoria)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              className="bg-green-600 hover:bg-green-700 px-8"
              onClick={() => {
                refetchCategorias();
                refetchVinculadas();
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Atualizar Listas
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VincularCategorias;