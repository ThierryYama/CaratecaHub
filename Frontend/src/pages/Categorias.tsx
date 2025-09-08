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
import Header from '@/components/layout/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Categoria, fetchCategorias, createCategoria, updateCategoria, deleteCategoria, CategoriaInput } from '@/services/api';

const Categorias = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [activeItem, setActiveItem] = useState('categorias');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('todos');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CategoriaInput>({
    nome: '',
    descricao: '',
    faixaIdadeMin: 0,
    faixaIdadeMax: 0,
    genero: 'M',
    graduacaoMin: '',
    graduacaoMax: '',
    pesoMin: undefined,
    pesoMax: undefined,
  });

  const graduacoes = [
    '10º Kyu', '9º Kyu', '8º Kyu', '7º Kyu', '6º Kyu', '5º Kyu', '4º Kyu', '3º Kyu', '2º Kyu', '1º Kyu',
    '1º Dan', '2º Dan', '3º Dan', '4º Dan', '5º Dan', '6º Dan', '7º Dan', '8º Dan', '9º Dan', '10º Dan'
  ];

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
      faixaIdadeMin: 0,
      faixaIdadeMax: 0,
      genero: 'M',
      graduacaoMin: '',
      graduacaoMax: '',
      pesoMin: undefined,
      pesoMax: undefined,
    });
    setCategoriaEditando(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      genero: categoria.genero ?? 'M',
      graduacaoMin: categoria.graduacaoMin,
      graduacaoMax: categoria.graduacaoMax,
      pesoMin: categoria.pesoMin,
      pesoMax: categoria.pesoMax,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const categoriasFiltradas = categorias.filter(categoria => {
    const matchNome = categoria.nome.toLowerCase().includes(filtro.toLowerCase());
    const matchSexo = filtroSexo === 'todos' || categoria.genero === filtroSexo;
    return matchNome && matchSexo;
  });

  return (
    <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onItemClick={(item) => {
          setActiveItem(item);
          if (window.innerWidth < 1024) setIsSidebarCollapsed(true);
        }}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

        <main className="flex-1 p-6 overflow-y-auto">
          {isLoading && <div className="mb-4">Carregando...</div>}
          {isError && <div className="mb-4 text-red-600">Erro ao carregar categorias.</div>}

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
                          <Label htmlFor="sexo">Sexo</Label>
                          <Select value={formData.genero} onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value as Categoria['genero'] }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o sexo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                          placeholder="Opcional"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="idadeMinima">Idade Mínima</Label>
                          <Input
                            id="idadeMinima"
                            type="number"
                            value={formData.faixaIdadeMin}
                            onChange={(e) => setFormData(prev => ({ ...prev, faixaIdadeMin: Number(e.target.value) }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="idadeMaxima">Idade Máxima</Label>
                          <Input
                            id="idadeMaxima"
                            type="number"
                            value={formData.faixaIdadeMax}
                            onChange={(e) => setFormData(prev => ({ ...prev, faixaIdadeMax: Number(e.target.value) }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="graduacaoMinima">Graduação Mínima</Label>
                          <Select value={formData.graduacaoMin} onValueChange={(value) => setFormData(prev => ({ ...prev, graduacaoMin: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a graduação mínima" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduacoes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="graduacaoMaxima">Graduação Máxima</Label>
                          <Select value={formData.graduacaoMax} onValueChange={(value) => setFormData(prev => ({ ...prev, graduacaoMax: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a graduação máxima" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduacoes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pesoMin">Peso Mínimo (kg) - Opcional</Label>
                          <Input
                            id="pesoMin"
                            type="number"
                            step="0.1"
                            value={formData.pesoMin ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, pesoMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
                            placeholder="Deixe em branco se não aplicável"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pesoMax">Peso Máximo (kg) - Opcional</Label>
                          <Input
                            id="pesoMax"
                            type="number"
                            step="0.1"
                            value={formData.pesoMax ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, pesoMax: e.target.value === '' ? undefined : Number(e.target.value) }))}
                            placeholder="Deixe em branco se não aplicável"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (categoriaEditando ? 'Atualizar' : 'Criar')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Input
                    placeholder="Filtrar por nome..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Select value={filtroSexo} onValueChange={setFiltroSexo}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Graduação</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasFiltradas.map((categoria) => (
                    <TableRow key={categoria.idCategoria}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{categoria.nome}</div>
                          <div className="text-sm text-gray-500">{categoria.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>{categoria.genero}</TableCell>
                      <TableCell>{categoria.faixaIdadeMin} - {categoria.faixaIdadeMax} anos</TableCell>
                      <TableCell>{categoria.graduacaoMin} - {categoria.graduacaoMax}</TableCell>
                      <TableCell>
                        {categoria.pesoMin != null && categoria.pesoMax != null
                          ? `${categoria.pesoMin}kg - ${categoria.pesoMax}kg`
                          : categoria.pesoMin != null
                            ? `>= ${categoria.pesoMin}kg`
                            : categoria.pesoMax != null
                              ? `<= ${categoria.pesoMax}kg`
                              : '-'}
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