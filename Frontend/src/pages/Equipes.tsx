import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Eye, UserPlus, X, Filter, ChevronsUpDown, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import { useSidebar } from '@/context/SidebarContext';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  fetchEquipes,
  fetchAtletas,
  createEquipe,
  updateEquipe,
  deleteEquipe,
  vincularAtletaEquipe,
  removerAtletaEquipe,
  getStoredAssociacao,
  Equipe,
  Atleta,
  EquipeInput,
  EquipeUpdateInput
} from '@/services/api';

const Equipes: React.FC = () => {
  const { isCollapsed: isSidebarCollapsed, toggle: toggleSidebar, setCollapsed: setSidebarCollapsed } = useSidebar();
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [equipeEditando, setEquipeEditando] = useState<Equipe | null>(null);
  const [equipeDetalhes, setEquipeDetalhes] = useState<Equipe | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroGenero, setFiltroGenero] = useState<'todos' | 'Misto' | 'Masculino' | 'Feminino' | 'Outro'>('todos');
  const [atletaParaAdicionar, setAtletaParaAdicionar] = useState<string>('');
  const [atletaSelecionadoCriacao, setAtletaSelecionadoCriacao] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Omit<EquipeInput, 'idAssociacao'>>({
    nome: '',
    descricao: '',
    atletasIds: [],
    genero: 'Misto',
  });


  const { data: equipes = [], isLoading: isLoadingEquipes, isError: isErrorEquipes } = useQuery<Equipe[]>({
    queryKey: ['equipes'],
    queryFn: fetchEquipes,
  });

  const { data: atletas = [] } = useQuery<Atleta[]>({
    queryKey: ['atletas'],
    queryFn: fetchAtletas,
  });


  useEffect(() => {
    if (equipeDetalhes) {
      const atual = equipes.find(e => e.idEquipe === equipeDetalhes.idEquipe);
      if (atual) setEquipeDetalhes(atual);
    }
  }, [equipes, equipeDetalhes]);


  const createMutation = useMutation({
    mutationFn: (payload: EquipeInput) => createEquipe(payload),
    onSuccess: () => {
      toast({ title: 'Equipe criada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setIsCreateEditDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: 'Erro ao criar equipe', variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EquipeUpdateInput }) => {
      if (data.genero && data.genero !== 'Misto') {
        const equipeOriginal = equipes.find(e => e.idEquipe === id);
        if (equipeOriginal && equipeOriginal.genero !== data.genero) {
          const atletasIncompativeis = equipeOriginal.membros.filter(
            m => m.atleta.genero !== data.genero
          );
          
          for (const membro of atletasIncompativeis) {
            await removerAtletaEquipe(id, membro.atleta.idAtleta);
          }
          
          if (atletasIncompativeis.length > 0) {
            toast({
              title: 'Atletas incompatíveis removidos',
              description: `${atletasIncompativeis.length} atleta(s) removido(s) por não corresponder ao novo gênero.`,
              variant: 'default',
            });
          }
        }
      }
      
      return updateEquipe(id, data);
    },
    onSuccess: () => {
      toast({ title: 'Equipe atualizada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setIsCreateEditDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: 'Erro ao atualizar equipe', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEquipe(id),
    onSuccess: (_d, id) => {
      toast({ title: 'Equipe removida!' });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      if (equipeDetalhes?.idEquipe === id) {
        setIsDetailDialogOpen(false);
        setEquipeDetalhes(null);
      }
    },
    onError: () => toast({ title: 'Erro ao remover equipe', variant: 'destructive' })
  });

  const vincularAtletaMutation = useMutation({
    mutationFn: ({ idEquipe, idAtleta }: { idEquipe: number; idAtleta: number }) => vincularAtletaEquipe(idEquipe, idAtleta),
    onSuccess: (_, v) => {
      toast({ title: 'Atleta adicionado!' });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setAtletaParaAdicionar('');
    },
    onError: () => toast({ title: 'Erro ao adicionar atleta', variant: 'destructive' })
  });

  const removerAtletaMutation = useMutation({
    mutationFn: ({ idEquipe, idAtleta }: { idEquipe: number; idAtleta: number }) => removerAtletaEquipe(idEquipe, idAtleta),
    onSuccess: () => {
      toast({ title: 'Atleta removido!' });
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
    },
    onError: () => toast({ title: 'Erro ao remover atleta', variant: 'destructive' })
  });

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', atletasIds: [], genero: 'Misto' });
    setEquipeEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const camposFaltando: string[] = [];

    if (!formData.nome.trim()) {
      camposFaltando.push('Nome');
    }

    if (!formData.genero) {
      camposFaltando.push('Gênero');
    }

    if (!equipeEditando && formData.atletasIds.length < 2) {
      camposFaltando.push('Atletas (mínimo 2)');
    }

    if (camposFaltando.length > 0) {
      toast({
        title: 'Campos obrigatórios faltando',
        description: `Por favor, preencha: ${camposFaltando.join(', ')}.`,
        variant: 'destructive'
      });
      return;
    }

    if (equipeEditando) {
      updateMutation.mutate({ id: equipeEditando.idEquipe, data: { nome: formData.nome, descricao: formData.descricao, genero: formData.genero } });
    } else {
      const assoc = getStoredAssociacao();
      if (!assoc) {
        toast({ title: 'Erro: Usuário não autenticado', variant: 'destructive' });
        return;
      }
      createMutation.mutate({ ...formData, idAssociacao: assoc.idAssociacao, genero: formData.genero });
    }
  };

  const handleEdit = (equipe: Equipe) => {
    setEquipeEditando(equipe);
    setFormData({ nome: equipe.nome, descricao: equipe.descricao || '', atletasIds: [], genero: equipe.genero });
    setIsCreateEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (globalThis.confirm('Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (equipe: Equipe) => {
    setEquipeDetalhes(equipe);
    setIsDetailDialogOpen(true);
  };

  const handleAddAtleta = () => {
    if (equipeDetalhes && atletaParaAdicionar) {
      vincularAtletaMutation.mutate({ idEquipe: equipeDetalhes.idEquipe, idAtleta: Number(atletaParaAdicionar) });
    }
  };

  const handleRemoveAtleta = (idAtleta: number) => {
    if (globalThis.confirm('Tem certeza que deseja remover este atleta da equipe?')) {
      if (equipeDetalhes) removerAtletaMutation.mutate({ idEquipe: equipeDetalhes.idEquipe, idAtleta });
    }
  };

  const atletasDisponiveis = useMemo(() => {
    if (!equipeDetalhes) return atletas;
    const ids = new Set(equipeDetalhes.membros.map(m => m.atleta.idAtleta));
    let lista = atletas.filter(a => !ids.has(a.idAtleta));
    if (equipeDetalhes.genero && equipeDetalhes.genero !== 'Misto') {
      lista = lista.filter(a => a.genero === equipeDetalhes.genero);
    }
    return lista;
  }, [atletas, equipeDetalhes]);

  const atletasDisponiveisCriacao = useMemo(() => {
    let lista = atletas.filter(a => !formData.atletasIds.includes(a.idAtleta));
    if (formData.genero && formData.genero !== 'Misto') {
      lista = lista.filter(a => a.genero === formData.genero);
    }
    return lista;
  }, [atletas, formData.atletasIds, formData.genero]);

  const equipesFiltradas = useMemo(() => {
    const f = filtro.toLowerCase();
    return equipes.filter(e => {
      const matchNome = e.nome.toLowerCase().includes(f);
      const matchGenero = filtroGenero === 'todos' || e.genero === filtroGenero;
      return matchNome && matchGenero;
    });
  }, [equipes, filtro, filtroGenero]);

  const handleAddAtletaCriacao = () => {
    if (atletaSelecionadoCriacao) {
      const id = Number(atletaSelecionadoCriacao);
      setFormData(prev => ({ ...prev, atletasIds: [...prev.atletasIds, id] }));
      setAtletaSelecionadoCriacao('');
    }
  };

  const handleRemoveAtletaCriacao = (id: number) => {
    setFormData(prev => ({ ...prev, atletasIds: prev.atletasIds.filter(i => i !== id) }));
  };

  const AthleteSearchSelect: React.FC<{
    options: Atleta[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
  }> = ({ options, value, onChange, placeholder, disabled, className }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selected = useMemo(() => options.find(o => o.idAtleta.toString() === value), [options, value]);
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter(a => a.nome.toLowerCase().includes(q));
    }, [options, query]);
    const shown = filtered.slice(0, 50);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className={className || 'w-64 justify-between h-9'}>
            <span className="truncate max-w-[180px] text-left">{selected ? selected.nome : (placeholder || 'Selecione')}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Pesquisar atleta..." value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>Nenhum atleta encontrado</CommandEmpty>
              <CommandGroup heading={query ? undefined : `Mostrando ${Math.min(shown.length, 50)} de ${options.length}`}>
                {shown.map(a => (
                  <CommandItem key={a.idAtleta} value={a.idAtleta.toString()} onSelect={(val) => { onChange(val); setOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${selected?.idAtleta === a.idAtleta ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="truncate">{a.nome}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

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
          className="fixed inset-0 bg-black/60 z-40 lg:hidden cursor-pointer"
          aria-label="Fechar menu lateral"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={toggleSidebar} />
        <Dialog open={isCreateEditDialogOpen} onOpenChange={(o) => { setIsCreateEditDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{equipeEditando ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div>
                <Label>Gênero <span className="text-red-500">*</span></Label>
                <Select value={formData.genero} onValueChange={(v) => {
                  const novoGenero = v as any;
                  setFormData(p => {
                    if (novoGenero !== 'Misto' && p.atletasIds.length > 0) {
                      const atletasCompativeis = p.atletasIds.filter(id => {
                        const atleta = atletas.find(a => a.idAtleta === id);
                        return atleta && atleta.genero === novoGenero;
                      });
                      
                      if (atletasCompativeis.length < p.atletasIds.length) {
                        const removidos = p.atletasIds.length - atletasCompativeis.length;
                        toast({
                          title: 'Atletas incompatíveis removidos',
                          description: `${removidos} atleta(s) removido(s) por não corresponder ao gênero selecionado.`,
                          variant: 'default',
                        });
                      }
                      
                      return { ...p, genero: novoGenero, atletasIds: atletasCompativeis };
                    }
                    return { ...p, genero: novoGenero };
                  });
                }} required>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Misto">Misto</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!equipeEditando && (
                <div>
                  <Label>Membros (mín. 2)</Label>
                  <div className="flex items-end gap-2 mt-2">
                    <AthleteSearchSelect
                      options={atletasDisponiveisCriacao}
                      value={atletaSelecionadoCriacao}
                      onChange={setAtletaSelecionadoCriacao}
                      placeholder={atletasDisponiveisCriacao.length ? 'Selecione atleta' : 'Todos selecionados'}
                    />
                    <Button type="button" size="sm" onClick={handleAddAtletaCriacao} disabled={!atletaSelecionadoCriacao}>
                      <UserPlus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1 max-h-40 overflow-auto border rounded p-2 bg-white">
                    {formData.atletasIds.map(id => {
                      const a = atletas.find(x => x.idAtleta === id);
                      if (!a) return null;
                      return (
                        <div key={id} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                          <span className="truncate pr-2">{a.nome}</span>
                          <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => handleRemoveAtletaCriacao(id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                    {formData.atletasIds.length === 0 && <div className="text-xs text-gray-500">Nenhum atleta adicionado.</div>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Selecionados: {formData.atletasIds.length}</div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateEditDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (!equipeEditando && formData.atletasIds.length < 2)}>
                  {(() => {
                    if (equipeEditando) return updateMutation.isPending ? 'Salvando...' : 'Salvar';
                    return createMutation.isPending ? 'Criando...' : 'Criar';
                  })()}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Equipe</DialogTitle>
            </DialogHeader>
            {equipeDetalhes && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 bg-gray-50 rounded p-4">
                  <div>
                    <p className="text-xs text-gray-500">Nome</p>
                    <p className="font-medium">{equipeDetalhes.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Descrição</p>
                    <p className="font-medium break-words">{equipeDetalhes.descricao || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Membros</p>
                    <p className="font-medium">{equipeDetalhes.membros.length}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Membros</p>
                  <div className="flex items-end gap-2">
                    <AthleteSearchSelect
                      options={atletasDisponiveis}
                      value={atletaParaAdicionar}
                      onChange={setAtletaParaAdicionar}
                      placeholder={atletasDisponiveis.length ? 'Selecione atleta' : 'Todos já estão na equipe'}
                    />
                    <Button type="button" size="sm" onClick={handleAddAtleta} disabled={!atletaParaAdicionar || vincularAtletaMutation.isPending}>
                      <UserPlus className="w-4 h-4 mr-1" /> {vincularAtletaMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </div>
                  <div className="border rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="py-2">Nome</TableHead>
                          <TableHead className="py-2">Peso</TableHead>
                          <TableHead className="py-2">Graduação</TableHead>
                          <TableHead className="w-16 py-2"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipeDetalhes.membros.map(m => (
                          <TableRow key={m.atleta.idAtleta} className="h-9">
                            <TableCell className="font-medium py-1">{m.atleta.nome}</TableCell>
                            <TableCell className="text-xs py-1">{m.atleta.peso} kg</TableCell>
                            <TableCell className="text-xs py-1">{m.atleta.graduacao}</TableCell>
                            <TableCell className="text-right py-1">
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveAtleta(m.atleta.idAtleta)} disabled={removerAtletaMutation.isPending}>
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {equipeDetalhes.membros.length === 0 && (
                          <TableRow className="h-9"><TableCell colSpan={4} className="text-center text-xs py-3 text-gray-500">Nenhum membro</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <main className="flex-1 p-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Equipes</CardTitle>
                <Button onClick={() => { resetForm(); setIsCreateEditDialogOpen(true); }} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nova Equipe
                </Button>
              </div>
              <div className="flex items-end gap-6 pt-4 flex-wrap">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por nome</span>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Filtrar por nome..."
                      value={filtro}
                      onChange={e => setFiltro(e.target.value)}
                      className="w-64 h-9"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Gênero</span>
                  <Select value={filtroGenero} onValueChange={(v) => setFiltroGenero(v as any)}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Misto">Misto</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Gênero</TableHead>
                    <TableHead>Atletas</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingEquipes && (
                    <TableRow>
                      <TableCell colSpan={4}>Carregando...</TableCell>
                    </TableRow>
                  )}
                  {isErrorEquipes && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-red-500">Erro ao carregar</TableCell>
                    </TableRow>
                  )}
                  {!isLoadingEquipes && equipesFiltradas.map(e => (
                    <TableRow key={e.idEquipe} className="hover:bg-muted/40 cursor-pointer" onDoubleClick={() => handleViewDetails(e)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="leading-tight">
                            <p className="font-medium">{e.nome}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">{e.descricao || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal text-xs">{e.genero}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-sm">{e.membros.length} atletas</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(e)} title="Detalhes">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(e)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.idEquipe)} title="Excluir" disabled={deleteMutation.isPending}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoadingEquipes && equipesFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">Nenhuma equipe encontrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Equipes;