import React, { useState } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import Header from '@/components/layout/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Categoria, fetchCategorias, createCategoria, updateCategoria, deleteCategoria, CategoriaInput, Modalidade } from '@/services/api';

const Categorias = () => {
  const { isCollapsed: isSidebarCollapsed, toggle: toggleSidebar, setCollapsed: setSidebarCollapsed } = useSidebar();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<'todos' | 'Masculino' | 'Feminino' | 'Outro' | 'Misto'>('todos');
  const [filtroModalidade, setFiltroModalidade] = useState<'todos' | Modalidade>('todos');
  const [errosValidacao, setErrosValidacao] = useState<{
    idade?: string;
    graduacao?: string;
    peso?: string;
  }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CategoriaInput>({
    nome: '',
    descricao: '',
    faixaIdadeMin: 1,
    faixaIdadeMax: 1,
    genero: 'Masculino',
    modalidade: Modalidade.KUMITE,
    graduacaoMin: '',
    graduacaoMax: '',
    pesoMin: undefined,
    pesoMax: undefined,
  });

  const graduacoes = [
    '10º Kyu', '9º Kyu', '8º Kyu', '7º Kyu', '6º Kyu', '5º Kyu', '4º Kyu', '3º Kyu', '2º Kyu', '1º Kyu',
    '1º Dan', '2º Dan', '3º Dan', '4º Dan', '5º Dan', '6º Dan', '7º Dan', '8º Dan', '9º Dan', '10º Dan'
  ];

  // Função para obter índice da graduação (menor índice = graduação menor)
  const getGraduacaoIndex = (graduacao: string): number => {
    return graduacoes.indexOf(graduacao);
  };

  // Função para validar campos
  const validarCampos = (): boolean => {
    const erros: typeof errosValidacao = {};
    const camposFaltando: string[] = [];
    let valido = true;

    if (!formData.nome.trim()) {
      camposFaltando.push('Nome');
      valido = false;
    }

    if (formData.faixaIdadeMin <= 0 || formData.faixaIdadeMax <= 0) {
      erros.idade = 'As idades devem ser maiores que 0';
      valido = false;
    } else if (formData.faixaIdadeMin > formData.faixaIdadeMax) {
      erros.idade = 'A idade mínima não pode ser maior que a idade máxima';
      valido = false;
    }

    if (!formData.graduacaoMin || !formData.graduacaoMax) {
      camposFaltando.push('Graduação Mínima e Máxima');
      valido = false;
    } else {
      const indexMin = getGraduacaoIndex(formData.graduacaoMin);
      const indexMax = getGraduacaoIndex(formData.graduacaoMax);
      if (indexMin !== -1 && indexMax !== -1 && indexMin > indexMax) {
        erros.graduacao = 'A graduação mínima não pode ser maior que a graduação máxima';
        valido = false;
      }
    }

    const temPesoMin = formData.pesoMin !== undefined && formData.pesoMin !== null && formData.pesoMin.toString() !== '';
    const temPesoMax = formData.pesoMax !== undefined && formData.pesoMax !== null && formData.pesoMax.toString() !== '';
    
    if (temPesoMin || temPesoMax) {
      if (temPesoMin && Number(formData.pesoMin) <= 0) {
        erros.peso = 'O peso mínimo deve ser maior que 0';
        valido = false;
      }
      if (temPesoMax && Number(formData.pesoMax) <= 0) {
        erros.peso = 'O peso máximo deve ser maior que 0';
        valido = false;
      }
      if (temPesoMin && temPesoMax && Number(formData.pesoMin) > Number(formData.pesoMax)) {
        erros.peso = 'O peso mínimo não pode ser maior que o peso máximo';
        valido = false;
      }
    }

    if (camposFaltando.length > 0) {
      toast({
        title: 'Campos obrigatórios faltando',
        description: `Por favor, preencha: ${camposFaltando.join(', ')}.`,
        variant: 'destructive',
      });
    }

    setErrosValidacao(erros);
    return valido;
  };

  const { data: categorias = [], isLoading, isError } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: fetchCategorias,
  });

  const createMutation = useMutation({
    mutationFn: createCategoria,
    onSuccess: () => {
      toast({ title: "Categoria criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao criar categoria", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, categoria }: { id: number; categoria: Partial<CategoriaInput> }) =>
      updateCategoria(id, categoria),
    onSuccess: () => {
      toast({ title: "Categoria atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar categoria", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => {
      toast({ title: "Categoria removida com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
    onError: () => {
      toast({ title: "Erro ao remover categoria", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      faixaIdadeMin: 1,
      faixaIdadeMax: 1,
      genero: 'Masculino',
      modalidade: Modalidade.KUMITE,
      graduacaoMin: '',
      graduacaoMax: '',
      pesoMin: undefined,
      pesoMax: undefined,
    });
    setCategoriaEditando(null);
    setErrosValidacao({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarCampos()) {
      return;
    }

    const categoriaData: CategoriaInput = {
      ...formData,
      descricao: formData.descricao?.trim() === '' ? null : formData.descricao,
      faixaIdadeMin: Number(formData.faixaIdadeMin),
      faixaIdadeMax: Number(formData.faixaIdadeMax),
      pesoMin: formData.pesoMin ? Number(formData.pesoMin) : undefined,
      pesoMax: formData.pesoMax ? Number(formData.pesoMax) : undefined,
    } as CategoriaInput;

    if (categoriaEditando) {
      updateMutation.mutate({ id: categoriaEditando.idCategoria, categoria: categoriaData });
    } else {
      createMutation.mutate(categoriaData);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setCategoriaEditando(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao ?? '',
      faixaIdadeMin: categoria.faixaIdadeMin,
      faixaIdadeMax: categoria.faixaIdadeMax,
      genero: categoria.genero ?? 'Masculino',
      modalidade: categoria.modalidade,
      graduacaoMin: categoria.graduacaoMin,
      graduacaoMax: categoria.graduacaoMax,
      pesoMin: categoria.pesoMin,
      pesoMax: categoria.pesoMax,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (globalThis.confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate(id);
    }
  };

  const categoriasFiltradas = categorias.filter(categoria => {
    const matchNome = categoria.nome.toLowerCase().includes(filtro.toLowerCase());
    const matchSexo = filtroSexo === 'todos' || categoria.genero === filtroSexo;
    const matchModalidade = filtroModalidade === 'todos' || categoria.modalidade === filtroModalidade;
    return matchNome && matchSexo && matchModalidade;
  });

  return (
    <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onItemClick={() => { if (window.innerWidth < 1024) setSidebarCollapsed(true); }}
        onToggle={toggleSidebar}
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
        <main className="flex-1 p-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Categorias</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sexo">Gênero</Label>
                          <Select value={formData.genero} onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value as Categoria['genero'] }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gênero" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                              {([Modalidade.KATA_EQUIPE, Modalidade.KUMITE_EQUIPE] as Modalidade[]).includes(formData.modalidade) && (
                                <SelectItem value="Misto">Misto</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="descricao">Descrição</Label>
                          <Input
                            id="descricao"
                            value={formData.descricao}
                            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Opcional"
                          />
                        </div>
                        <div>
                          <Label htmlFor="modalidade">Modalidade</Label>
                          <Select value={formData.modalidade} onValueChange={(value) => setFormData(prev => ({ ...prev, modalidade: value as Modalidade }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a modalidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Modalidade.KATA}>Kata</SelectItem>
                              <SelectItem value={Modalidade.KUMITE}>Kumite</SelectItem>
                              <SelectItem value={Modalidade.KATA_EQUIPE}>Kata Equipe</SelectItem>
                              <SelectItem value={Modalidade.KUMITE_EQUIPE}>Kumite Equipe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="idadeMinima">Idade Mínima</Label>
                          <Input
                            id="idadeMinima"
                            type="number"
                            min="1"
                            max="150"
                            value={formData.faixaIdadeMin}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, faixaIdadeMin: Number(e.target.value) }));
                              setErrosValidacao(prev => ({ ...prev, idade: undefined }));
                            }}
                            className={errosValidacao.idade ? 'border-red-500' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="idadeMaxima">Idade Máxima</Label>
                          <Input
                            id="idadeMaxima"
                            type="number"
                            min="1"
                            max="150"
                            value={formData.faixaIdadeMax}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, faixaIdadeMax: Number(e.target.value) }));
                              setErrosValidacao(prev => ({ ...prev, idade: undefined }));
                            }}
                            className={errosValidacao.idade ? 'border-red-500' : ''}
                            required
                          />
                        </div>
                      </div>
                      {errosValidacao.idade && (
                        <p className="text-sm text-red-600 -mt-2">{errosValidacao.idade}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="graduacaoMinima">Graduação Mínima <span className="text-red-500">*</span></Label>
                          <Select 
                            value={formData.graduacaoMin} 
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, graduacaoMin: value }));
                              setErrosValidacao(prev => ({ ...prev, graduacao: undefined }));
                            }}
                            required
                          >
                            <SelectTrigger className={errosValidacao.graduacao ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Selecione a graduação mínima" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduacoes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="graduacaoMaxima">Graduação Máxima <span className="text-red-500">*</span></Label>
                          <Select 
                            value={formData.graduacaoMax} 
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, graduacaoMax: value }));
                              setErrosValidacao(prev => ({ ...prev, graduacao: undefined }));
                            }}
                            required
                          >
                            <SelectTrigger className={errosValidacao.graduacao ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Selecione a graduação máxima" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduacoes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {errosValidacao.graduacao && (
                        <p className="text-sm text-red-600 -mt-2">{errosValidacao.graduacao}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pesoMin">Peso Mínimo (kg) - Opcional</Label>
                          <Input
                            id="pesoMin"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={formData.pesoMin ?? ''}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, pesoMin: e.target.value === '' ? undefined : Number(e.target.value) }));
                              setErrosValidacao(prev => ({ ...prev, peso: undefined }));
                            }}
                            className={errosValidacao.peso ? 'border-red-500' : ''}
                            placeholder="Deixe em branco se não aplicável"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pesoMax">Peso Máximo (kg) - Opcional</Label>
                          <Input
                            id="pesoMax"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={formData.pesoMax ?? ''}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, pesoMax: e.target.value === '' ? undefined : Number(e.target.value) }));
                              setErrosValidacao(prev => ({ ...prev, peso: undefined }));
                            }}
                            className={errosValidacao.peso ? 'border-red-500' : ''}
                            placeholder="Deixe em branco se não aplicável"
                          />
                        </div>
                      </div>
                      {errosValidacao.peso && (
                        <p className="text-sm text-red-600 -mt-2">{errosValidacao.peso}</p>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {(() => {
                            if (createMutation.isPending || updateMutation.isPending) return 'Salvando...';
                            return categoriaEditando ? 'Atualizar' : 'Criar';
                          })()}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-end gap-6 pt-4 flex-wrap">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por nome</span>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <Input
                      placeholder="Filtrar por nome..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Gênero</span>
                  <Select value={filtroSexo} onValueChange={(v) => setFiltroSexo(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                      <SelectItem value="Misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Modalidade</span>
                  <Select value={filtroModalidade} onValueChange={(v) => setFiltroModalidade(v as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value={Modalidade.KATA}>Kata</SelectItem>
                      <SelectItem value={Modalidade.KUMITE}>Kumite</SelectItem>
                      <SelectItem value={Modalidade.KATA_EQUIPE}>Kata Equipe</SelectItem>
                      <SelectItem value={Modalidade.KUMITE_EQUIPE}>Kumite Equipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Graduação</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={8}>Carregando...</TableCell>
                    </TableRow>
                  )}
                  {isError && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-red-600">Erro ao carregar atletas.</TableCell>
                    </TableRow>
                  )}

                  {categoriasFiltradas.map((categoria) => (
                    <TableRow key={categoria.idCategoria}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{categoria.nome}</div>
                          <div className="text-sm text-gray-500">{categoria.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-sm ${categoria.modalidade === 'KATA' || categoria.modalidade === 'KATA_EQUIPE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                          }`}>
                          {/* eslint-disable-next-line prefer-regex-literals */}
                          {categoria.modalidade.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </TableCell>
                      <TableCell>{categoria.genero}</TableCell>
                      <TableCell>{categoria.faixaIdadeMin} - {categoria.faixaIdadeMax} anos</TableCell>
                      <TableCell>{categoria.graduacaoMin} - {categoria.graduacaoMax}</TableCell>
                      <TableCell>
                        {(() => {
                          const { pesoMin, pesoMax } = categoria as any;
                          if (pesoMin != null && pesoMax != null) return `${pesoMin}kg - ${pesoMax}kg`;
                          if (pesoMin != null) return `>= ${pesoMin}kg`;
                          if (pesoMax != null) return `<= ${pesoMax}kg`;
                          return '-';
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(categoria)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(categoria.idCategoria)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Categorias;