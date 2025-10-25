import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Users,
  Target,
  Star,
  Award,
  Loader2,
  Filter,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSidebar } from '@/context/SidebarContext';
import {
  CampeonatoDetalhado,
  CampeonatoModalidadeWithCategoria,
  fetchCampeonatoDetalhado,
  fetchPartidasAtletaPorCategoria,
  fetchPartidasEquipePorCategoria,
  Modalidade,
  PartidaAtletaResponse,
  PartidaEquipeResponse,
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

const PONTOS_OURO = 5;
const PONTOS_PRATA = 3;
const PONTOS_BRONZE = 1;

interface ResultadoCategoria {
  categoria: string;
  modalidade: Modalidade;
  campeao: {
    nome: string;
    associacao?: string;
  } | null;
  vice: {
    nome: string;
    associacao?: string;
  } | null;
  terceiros: Array<{
    nome: string;
    associacao?: string;
  }>;
}

interface PontuacaoAssociacao {
  nome: string;
  ouro: number;
  prata: number;
  bronze: number;
  totalPontos: number;
}

const extrairResultados = (
  partidas: PartidaAtletaResponse[] | PartidaEquipeResponse[],
  tipo: 'ATLETA' | 'EQUIPE'
): { campeao: any; vice: any; terceiros: any[] } => {
  if (!partidas.length) return { campeao: null, vice: null, terceiros: [] };

  const maxRound = Math.max(...partidas.map(p => p.round));
  const final = partidas.find(p => p.round === maxRound && p.position === 1);
  
  if (!final || !final.resultado) {
    return { campeao: null, vice: null, terceiros: [] };
  }

  const vencedorSlot = final.resultado.endsWith('_1') ? 1 : 2;
  const perdedorSlot = vencedorSlot === 1 ? 2 : 1;

  let campeao = null;
  let vice = null;

  if (tipo === 'ATLETA') {
    const partidaAtleta = final as PartidaAtletaResponse;
    const inscricaoVencedor = vencedorSlot === 1 ? partidaAtleta.inscricaoAtleta1 : partidaAtleta.inscricaoAtleta2;
    const inscricaoPerdedor = perdedorSlot === 1 ? partidaAtleta.inscricaoAtleta1 : partidaAtleta.inscricaoAtleta2;
    
    if (inscricaoVencedor?.atleta) {
      campeao = {
        nome: inscricaoVencedor.atleta.nome,
        associacao: inscricaoVencedor.atleta.associacao 
          ? (inscricaoVencedor.atleta.associacao.nome || inscricaoVencedor.atleta.associacao.sigla)
          : undefined,
      };
    }
    
    if (inscricaoPerdedor?.atleta) {
      vice = {
        nome: inscricaoPerdedor.atleta.nome,
        associacao: inscricaoPerdedor.atleta.associacao 
          ? (inscricaoPerdedor.atleta.associacao.nome || inscricaoPerdedor.atleta.associacao.sigla)
          : undefined,
      };
    }
  } else {
    const partidaEquipe = final as PartidaEquipeResponse;
    const inscricaoVencedor = vencedorSlot === 1 ? partidaEquipe.inscricaoEquipe1 : partidaEquipe.inscricaoEquipe2;
    const inscricaoPerdedor = perdedorSlot === 1 ? partidaEquipe.inscricaoEquipe1 : partidaEquipe.inscricaoEquipe2;
    
    if (inscricaoVencedor?.equipe) {
      campeao = {
        nome: inscricaoVencedor.equipe.nome,
        associacao: inscricaoVencedor.equipe.associacao 
          ? (inscricaoVencedor.equipe.associacao.nome || inscricaoVencedor.equipe.associacao.sigla)
          : undefined,
      };
    }
    
    if (inscricaoPerdedor?.equipe) {
      vice = {
        nome: inscricaoPerdedor.equipe.nome,
        associacao: inscricaoPerdedor.equipe.associacao 
          ? (inscricaoPerdedor.equipe.associacao.nome || inscricaoPerdedor.equipe.associacao.sigla)
          : undefined,
      };
    }
  }

  const semifinais = partidas.filter(p => p.round === maxRound - 1);
  const terceiros: any[] = [];

  semifinais.forEach(semi => {
    if (semi.resultado && semi.resultado !== 'BYE') {
      const perdedorSlotSemi = semi.resultado.endsWith('_1') ? 2 : 1;
      
      if (tipo === 'ATLETA') {
        const partidaAtleta = semi as PartidaAtletaResponse;
        const inscricaoPerdedor = perdedorSlotSemi === 1 ? partidaAtleta.inscricaoAtleta1 : partidaAtleta.inscricaoAtleta2;
        
        if (inscricaoPerdedor?.atleta) {
          terceiros.push({
            nome: inscricaoPerdedor.atleta.nome,
            associacao: inscricaoPerdedor.atleta.associacao 
              ? (inscricaoPerdedor.atleta.associacao.nome || inscricaoPerdedor.atleta.associacao.sigla)
              : undefined,
          });
        }
      } else {
        const partidaEquipe = semi as PartidaEquipeResponse;
        const inscricaoPerdedor = perdedorSlotSemi === 1 ? partidaEquipe.inscricaoEquipe1 : partidaEquipe.inscricaoEquipe2;
        
        if (inscricaoPerdedor?.equipe) {
          terceiros.push({
            nome: inscricaoPerdedor.equipe.nome,
            associacao: inscricaoPerdedor.equipe.associacao 
              ? (inscricaoPerdedor.equipe.associacao.nome || inscricaoPerdedor.equipe.associacao.sigla)
              : undefined,
          });
        }
      }
    }
  });

  return { campeao, vice, terceiros };
};

const ResultadosFinais: React.FC = () => {
  const { isCollapsed: isSidebarCollapsed, setCollapsed: setSidebarCollapsed } = useSidebar();

  const params = useParams<{ id?: string }>();
  const persistedId = typeof window !== 'undefined' ? localStorage.getItem('currentCampeonatoId') ?? undefined : undefined;
  const campeonatoId = useMemo(() => {
    if (params.id) return Number(params.id);
    if (persistedId) return Number(persistedId);
    return undefined;
  }, [params.id, persistedId]);

  const [selectedModalidade, setSelectedModalidade] = useState<string>('todas');

  const {
    data: campeonatoDetalhado,
    isLoading: campeonatoLoading,
    error: campeonatoError,
  } = useQuery<CampeonatoDetalhado>({
    queryKey: ['campeonato-detalhado', campeonatoId],
    queryFn: () => fetchCampeonatoDetalhado(campeonatoId!),
    enabled: !!campeonatoId,
    staleTime: 60 * 1000,
  });

  const categorias = useMemo(() => {
    if (!campeonatoDetalhado?.modalidades) return [] as CampeonatoModalidadeWithCategoria[];
    return [...campeonatoDetalhado.modalidades].sort((a, b) =>
      (a.categoria?.nome ?? '').localeCompare(b.categoria?.nome ?? ''),
    );
  }, [campeonatoDetalhado]);

  const categoriasQuery = useQuery({
    queryKey: ['resultados-categorias', campeonatoId],
    queryFn: async () => {
      if (!categorias.length) return [];
      
      const resultados = await Promise.all(
        categorias.map(async (modalidade): Promise<ResultadoCategoria> => {
          try {
            const equipe = isEquipeModalidade(modalidade.categoria?.modalidade);
            const partidas = equipe
              ? await fetchPartidasEquipePorCategoria(modalidade.idCampeonatoModalidade)
              : await fetchPartidasAtletaPorCategoria(modalidade.idCampeonatoModalidade);
            
            const { campeao, vice, terceiros } = extrairResultados(partidas, equipe ? 'EQUIPE' : 'ATLETA');
            
            return {
              categoria: modalidade.categoria?.nome ?? 'Categoria',
              modalidade: modalidade.categoria?.modalidade ?? Modalidade.KATA,
              campeao,
              vice,
              terceiros,
            };
          } catch (error) {
            return {
              categoria: modalidade.categoria?.nome ?? 'Categoria',
              modalidade: modalidade.categoria?.modalidade ?? Modalidade.KATA,
              campeao: null,
              vice: null,
              terceiros: [],
            };
          }
        })
      );
      
      return resultados;
    },
    enabled: !!campeonatoId && categorias.length > 0,
  });

  const pontuacaoAssociacoes = useMemo((): PontuacaoAssociacao[] => {
    if (!categoriasQuery.data) return [];
    
    const pontuacaoMap = new Map<string, PontuacaoAssociacao>();
    
    categoriasQuery.data.forEach(resultado => {
      if (resultado.campeao?.associacao) {
        const associacao = resultado.campeao.associacao;
        const atual = pontuacaoMap.get(associacao) || {
          nome: associacao,
          ouro: 0,
          prata: 0,
          bronze: 0,
          totalPontos: 0,
        };
        atual.ouro += 1;
        atual.totalPontos += PONTOS_OURO;
        pontuacaoMap.set(associacao, atual);
      }
      
      if (resultado.vice?.associacao) {
        const associacao = resultado.vice.associacao;
        const atual = pontuacaoMap.get(associacao) || {
          nome: associacao,
          ouro: 0,
          prata: 0,
          bronze: 0,
          totalPontos: 0,
        };
        atual.prata += 1;
        atual.totalPontos += PONTOS_PRATA;
        pontuacaoMap.set(associacao, atual);
      }
      
      resultado.terceiros.forEach(terceiro => {
        if (terceiro.associacao) {
          const associacao = terceiro.associacao;
          const atual = pontuacaoMap.get(associacao) || {
            nome: associacao,
            ouro: 0,
            prata: 0,
            bronze: 0,
            totalPontos: 0,
          };
          atual.bronze += 1;
          atual.totalPontos += PONTOS_BRONZE;
          pontuacaoMap.set(associacao, atual);
        }
      });
    });
    
    return Array.from(pontuacaoMap.values()).sort((a, b) => b.totalPontos - a.totalPontos);
  }, [categoriasQuery.data]);

  const resultadosFiltrados = useMemo(() => {
    if (!categoriasQuery.data) return [];
    if (selectedModalidade === 'todas') return categoriasQuery.data;
    return categoriasQuery.data.filter(r => r.modalidade === selectedModalidade);
  }, [categoriasQuery.data, selectedModalidade]);

  const totalCategorias = categorias.length;
  const categoriasComResultados = categoriasQuery.data?.filter(r => r.campeao).length ?? 0;
  const totalAssociacoes = pontuacaoAssociacoes.length;

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resultados Finais</h1>
            <p className="text-gray-600 max-w-2xl">
              Visualize os resultados completos do campeonato, incluindo pódio por categoria e 
              ranking geral de associações baseado no sistema de pontuação.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Target className="h-5 w-5" />
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
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Com Resultados</p>
                  <p className="text-2xl font-semibold text-gray-900">{categoriasComResultados}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Associações</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalAssociacoes}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total Pontos</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pontuacaoAssociacoes.reduce((acc, p) => acc + p.totalPontos, 0)}
                  </p>
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
                  Sistema de pontuação: 1º lugar = {PONTOS_OURO} pts, 2º lugar = {PONTOS_PRATA} pts, 3º lugar = {PONTOS_BRONZE} pt
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={selectedModalidade} onValueChange={setSelectedModalidade}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as modalidades</SelectItem>
                    <SelectItem value={Modalidade.KATA}>Kata Individual</SelectItem>
                    <SelectItem value={Modalidade.KUMITE}>Kumite Individual</SelectItem>
                    <SelectItem value={Modalidade.KATA_EQUIPE}>Kata por Equipe</SelectItem>
                    <SelectItem value={Modalidade.KUMITE_EQUIPE}>Kumite por Equipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="ranking" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ranking">Ranking de Associações</TabsTrigger>
              <TabsTrigger value="categorias">Pódio por Categoria</TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    Ranking Geral de Associações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoriasQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculando pontuação…
                    </div>
                  ) : pontuacaoAssociacoes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Posição</TableHead>
                            <TableHead>Associação</TableHead>
                            <TableHead className="text-center">🥇 Ouro</TableHead>
                            <TableHead className="text-center">🥈 Prata</TableHead>
                            <TableHead className="text-center">🥉 Bronze</TableHead>
                            <TableHead className="text-center">Total de Pontos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pontuacaoAssociacoes.map((associacao, index) => (
                            <TableRow key={associacao.nome}>
                              <TableCell className="text-center font-bold">
                                <div className="flex items-center justify-center">
                                  {index === 0 && <Crown className="h-4 w-4 text-yellow-500 mr-1" />}
                                  {index + 1}º
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">{associacao.nome}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {associacao.ouro}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  {associacao.prata}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  {associacao.bronze}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-blue-600 text-white">
                                  {associacao.totalPontos} pts
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum resultado encontrado
                      </h3>
                      <p className="text-gray-600">
                        Os resultados aparecerão quando os chaveamentos forem finalizados.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categorias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-red-600" />
                    Pódio por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoriasQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Carregando resultados…
                    </div>
                  ) : resultadosFiltrados.length > 0 ? (
                    <div className="space-y-6">
                      {resultadosFiltrados.map((resultado, index) => (
                        <Card key={index} className="border-l-4 border-l-red-500">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {resultado.categoria}
                                </h3>
                                <Badge variant="outline" className="mt-1">
                                  {formatModalidade(resultado.modalidade)}
                                </Badge>
                              </div>
                            </div>

                            {resultado.campeao ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Campeão */}
                                <div className="text-center p-4 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300">
                                  <div className="flex items-center justify-center mb-2">
                                    <Crown className="h-8 w-8 text-yellow-600" />
                                  </div>
                                  <div className="text-lg font-bold text-yellow-800">1º Lugar</div>
                                  <div className="font-semibold text-gray-900">{resultado.campeao.nome}</div>
                                  {resultado.campeao.associacao && (
                                    <div className="text-sm text-gray-600">{resultado.campeao.associacao}</div>
                                  )}
                                </div>

                                {/* Vice */}
                                {resultado.vice && (
                                  <div className="text-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300">
                                    <div className="flex items-center justify-center mb-2">
                                      <Medal className="h-8 w-8 text-gray-600" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">2º Lugar</div>
                                    <div className="font-semibold text-gray-900">{resultado.vice.nome}</div>
                                    {resultado.vice.associacao && (
                                      <div className="text-sm text-gray-600">{resultado.vice.associacao}</div>
                                    )}
                                  </div>
                                )}

                                {/* Terceiros */}
                                {resultado.terceiros.length > 0 && (
                                  <div className="text-center p-4 bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
                                    <div className="flex items-center justify-center mb-2">
                                      <Award className="h-8 w-8 text-orange-600" />
                                    </div>
                                    <div className="text-lg font-bold text-orange-800">3º Lugar</div>
                                    {resultado.terceiros.map((terceiro, idx) => (
                                      <div key={idx} className="mb-1">
                                        <div className="font-semibold text-gray-900">{terceiro.nome}</div>
                                        {terceiro.associacao && (
                                          <div className="text-sm text-gray-600">{terceiro.associacao}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>Resultado ainda não definido</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma categoria encontrada
                      </h3>
                      <p className="text-gray-600">
                        Selecione um filtro diferente ou aguarde a finalização dos chaveamentos.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default ResultadosFinais;