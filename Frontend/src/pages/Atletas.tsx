
import React, { useMemo, useState } from 'react';
import { Menu, Plus, Edit, Trash2, Filter, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Atleta, AtletaInput, fetchAtletas, createAtleta, updateAtleta, deleteAtleta } from '@/services/api';

const Atletas = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // no explicit active item state needed here
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<'todos' | 'Masculino' | 'Feminino' | 'Outro'>('todos');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [filtroIdade, setFiltroIdade] = useState<'todos' | 'infantil' | 'juvenil' | 'adulto'>('todos');
  const [filtroPeso, setFiltroPeso] = useState<'todos' | 'leve' | 'medio' | 'pesado'>('todos');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  type Genero = 'Masculino' | 'Feminino' | 'Outro';
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
  genero: 'Masculino' as Genero,
    graduacao: '',
    peso: '',
    status: true,
  });

  // gestão de avatar local (preview e persistência por id no localStorage)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<Record<number, string>>(() => {
    try {
      const raw = localStorage.getItem('atletasAvatares');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const persistAvatars = (next: Record<number, string>) => {
    setAvatars(next);
    try { localStorage.setItem('atletasAvatares', JSON.stringify(next)); } catch {}
  };

  const handleAvatarChange = (file?: File) => {
    if (!file) { setAvatarPreview(null); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const graduacoes = [
    '10º Kyu', '9º Kyu', '8º Kyu', '7º Kyu', '6º Kyu', '5º Kyu', '4º Kyu', '3º Kyu', '2º Kyu', '1º Kyu',
    '1º Dan', '2º Dan', '3º Dan', '4º Dan', '5º Dan', '6º Dan', '7º Dan', '8º Dan', '9º Dan', '10º Dan'
  ];

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      dataNascimento: '',
      genero: 'Masculino',
      graduacao: '',
      peso: '',
      status: true,
    });
    setAtletaEditando(null);
  };

  // função utilitária é definida mais abaixo para uso nos filtros e tabela

  // React Query
  const { data: atletas = [], isLoading, isError } = useQuery<Atleta[]>({
    queryKey: ['atletas'],
    queryFn: fetchAtletas,
  });

  const createMutation = useMutation({
    mutationFn: (payload: AtletaInput) => createAtleta(payload),
    onSuccess: (novo) => {
      // persiste avatar local se houver preview
      if (avatarPreview && novo?.idAtleta) {
        persistAvatars({ ...avatars, [novo.idAtleta]: avatarPreview });
        setAvatarPreview(null);
      }
      toast({ title: 'Atleta criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['atletas'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: 'Erro ao criar atleta', variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, atleta }: { id: number; atleta: Partial<AtletaInput> }) => updateAtleta(id, atleta),
    onSuccess: (atualizado) => {
      if (avatarPreview && atualizado?.idAtleta) {
        persistAvatars({ ...avatars, [atualizado.idAtleta]: avatarPreview });
        setAvatarPreview(null);
      }
      toast({ title: 'Atleta atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['atletas'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: 'Erro ao atualizar atleta', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtleta,
    onSuccess: () => {
      toast({ title: 'Atleta removido com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['atletas'] });
    },
    onError: () => toast({ title: 'Erro ao remover atleta', variant: 'destructive' })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: AtletaInput = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      dataNascimento: formData.dataNascimento,
      genero: formData.genero,
      graduacao: formData.graduacao,
      peso: parseFloat(formData.peso),
      status: formData.status,
    };

    if (atletaEditando) {
  updateMutation.mutate({ id: atletaEditando.idAtleta, atleta: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setFormData({
      nome: atleta.nome,
      email: atleta.email,
      telefone: atleta.telefone,
      dataNascimento: atleta.dataNascimento.substring(0, 10),
      genero: atleta.genero as Genero,
      graduacao: atleta.graduacao,
      peso: atleta.peso.toString(),
      status: atleta.status,
    });
    setAvatarPreview(avatars[atleta.idAtleta] || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Helpers para filtros
  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const atletasFiltrados = useMemo(() => {
    return atletas.filter(atleta => {
      const nomeCompleto = `${atleta.nome}`.toLowerCase();
      const matchNome = nomeCompleto.includes(filtro.toLowerCase()) || atleta.email.toLowerCase().includes(filtro.toLowerCase()) || atleta.telefone.toLowerCase().includes(filtro.toLowerCase());
      const matchSexo = filtroSexo === 'todos' || atleta.genero === filtroSexo;
      const matchAtivo = filtroAtivo === 'todos' || (filtroAtivo === 'ativos' ? atleta.status : !atleta.status);

  const idadeAtual = calcularIdade(atleta.dataNascimento);
      const matchIdade =
        filtroIdade === 'todos' ||
        (filtroIdade === 'infantil' && idadeAtual < 12) ||
        (filtroIdade === 'juvenil' && idadeAtual >= 12 && idadeAtual < 18) ||
        (filtroIdade === 'adulto' && idadeAtual >= 18);

      const matchPeso =
        filtroPeso === 'todos' ||
  (filtroPeso === 'leve' && atleta.peso < 60) ||
  (filtroPeso === 'medio' && atleta.peso >= 60 && atleta.peso < 80) ||
  (filtroPeso === 'pesado' && atleta.peso >= 80);

      return matchNome && matchSexo && matchAtivo && matchIdade && matchPeso;
    });
  }, [atletas, filtro, filtroSexo, filtroAtivo, filtroIdade, filtroPeso]);

  return (
    <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onItemClick={() => {
          if (window.innerWidth < 1024) setIsSidebarCollapsed(true);
        }}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      {!isSidebarCollapsed && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarCollapsed(true)} />
      )}

      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

        <main className="flex-1 p-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Atletas</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Atleta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>
                        {atletaEditando ? 'Editar Atleta' : 'Novo Atleta'}
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
                          <Label htmlFor="genero">Gênero</Label>
                          <Select value={formData.genero} onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value as 'Masculino' | 'Feminino' | 'Outro' }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gênero" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                          <Input
                            id="dataNascimento"
                            type="date"
                            value={formData.dataNascimento}
                            onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="graduacao">Graduação</Label>
                          <Select value={formData.graduacao} onValueChange={(value) => setFormData(prev => ({ ...prev, graduacao: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a graduação" />
                            </SelectTrigger>
                            <SelectContent>
                              {graduacoes.map(grad => (
                                <SelectItem key={grad} value={grad}>{grad}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="peso">Peso (kg)</Label>
                          <Input
                            id="peso"
                            type="number"
                            step="0.1"
                            value={formData.peso}
                            onChange={(e) => setFormData(prev => ({ ...prev, peso: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select value={formData.status ? 'ativo' : 'inativo'} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v === 'ativo' }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="avatar">Foto/Avatar (opcional)</Label>
                          <Input id="avatar" type="file" accept="image/*" onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
                        </div>
                        {avatarPreview && (
                          <div className="flex items-end">
                            <img src={avatarPreview} alt="Prévia do avatar" className="w-16 h-16 rounded-full object-cover border" />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {atletaEditando ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-end gap-6 pt-4 flex-wrap">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por texto</span>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <Input
                      placeholder="Nome, email ou telefone..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Gênero</span>
                  <Select value={filtroSexo} onValueChange={(v) => setFiltroSexo(v as typeof filtroSexo)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</span>
                  <Select value={filtroAtivo} onValueChange={(v) => setFiltroAtivo(v as typeof filtroAtivo)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos</SelectItem>
                      <SelectItem value="inativos">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Idade</span>
                  <Select value={filtroIdade} onValueChange={(v) => setFiltroIdade(v as typeof filtroIdade)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="infantil">Infantil (&lt;12)</SelectItem>
                      <SelectItem value="juvenil">Juvenil (12-17)</SelectItem>
                      <SelectItem value="adulto">Adulto (18+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Peso</span>
                  <Select value={filtroPeso} onValueChange={(v) => setFiltroPeso(v as typeof filtroPeso)}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="leve">Leve (&lt;60kg)</SelectItem>
                      <SelectItem value="medio">Médio (60-79kg)</SelectItem>
                      <SelectItem value="pesado">Pesado (80kg+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Graduação</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Status</TableHead>
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
                  {!isLoading && !isError && atletasFiltrados.map((atleta) => (
                    <TableRow key={atleta.idAtleta}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {avatars[atleta.idAtleta] ? (
                            <img src={avatars[atleta.idAtleta]} alt={atleta.nome} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{atleta.nome}</div>
                            <div className="text-sm text-gray-500">{atleta.genero}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{atleta.email}</div>
                          <div className="text-sm text-gray-500">{atleta.telefone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{calcularIdade(atleta.dataNascimento)} anos</TableCell>
                      <TableCell>{atleta.graduacao}</TableCell>
                      <TableCell>{atleta.peso}kg</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          atleta.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {atleta.status ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(atleta)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(atleta.idAtleta)}
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

export default Atletas;
