import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Eye, UserPlus, X, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
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
import {
  fetchEquipes,
  fetchAtletas,
  createEquipe,
  updateEquipe,
  deleteEquipe,
  vincularAtletaEquipe,
  removerAtletaEquipe,
  Equipe,
  Atleta,
  EquipeInput,
  EquipeUpdateInput
} from '@/services/api';

const Equipes: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [equipeEditando, setEquipeEditando] = useState<Equipe | null>(null);
  const [equipeDetalhes, setEquipeDetalhes] = useState<Equipe | null>(null);
  const [filtro, setFiltro] = useState('');
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
    mutationFn: ({ id, data }: { id: number; data: EquipeUpdateInput }) => updateEquipe(id, data),
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
    if (!equipeEditando && formData.atletasIds.length < 2) {
      toast({ title: 'Selecione pelo menos 2 atletas', variant: 'destructive' });
      return;
    }

    if (equipeEditando) {
      updateMutation.mutate({ id: equipeEditando.idEquipe, data: { nome: formData.nome, descricao: formData.descricao, genero: formData.genero } });
    } else {
      createMutation.mutate({ ...formData, idAssociacao: 1, genero: formData.genero });
    }
  };

  const handleEdit = (equipe: Equipe) => {
    setEquipeEditando(equipe);
    setFormData({ nome: equipe.nome, descricao: equipe.descricao || '', atletasIds: equipe.membros.map(m => m.atleta.idAtleta), genero: equipe.genero });
    setIsCreateEditDialogOpen(true);
  };

  const handleDelete = (id: number) => deleteMutation.mutate(id);

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
    if (equipeDetalhes) removerAtletaMutation.mutate({ idEquipe: equipeDetalhes.idEquipe, idAtleta });
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
    return equipes.filter(e => e.nome.toLowerCase().includes(f));
  }, [equipes, filtro]);

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

  return (
    <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onItemClick={() => { if (window.innerWidth < 1024) setIsSidebarCollapsed(true); }}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      {!isSidebarCollapsed && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden cursor-pointer"
          aria-label="Fechar menu lateral"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

        <Dialog open={isCreateEditDialogOpen} onOpenChange={(o)=>{setIsCreateEditDialogOpen(o); if(!o) resetForm();}}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{equipeEditando ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={formData.nome} onChange={e=>setFormData(p=>({...p, nome:e.target.value}))} required />
              </div>
              <div>
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" value={formData.descricao} onChange={e=>setFormData(p=>({...p, descricao:e.target.value}))} />
              </div>
              <div>
                <Label>Gênero</Label>
                <Select value={formData.genero} onValueChange={(v)=>setFormData(p=>({...p, genero: v as any}))}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
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
                    <Select value={atletaSelecionadoCriacao} onValueChange={setAtletaSelecionadoCriacao}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder={atletasDisponiveisCriacao.length ? 'Selecione atleta' : 'Todos selecionados'} />
                      </SelectTrigger>
                      <SelectContent>
                        {atletasDisponiveisCriacao.map(a => (
                          <SelectItem key={a.idAtleta} value={a.idAtleta.toString()}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <Button variant="ghost" size="sm" className="h-6 px-1" onClick={()=>handleRemoveAtletaCriacao(id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                    {formData.atletasIds.length===0 && <div className="text-xs text-gray-500">Nenhum atleta adicionado.</div>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Selecionados: {formData.atletasIds.length}</div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={()=>setIsCreateEditDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (!equipeEditando && formData.atletasIds.length<2)}>
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
                    <Select value={atletaParaAdicionar} onValueChange={setAtletaParaAdicionar}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder={atletasDisponiveis.length? 'Selecione atleta' : 'Todos já estão na equipe'} />
                      </SelectTrigger>
                      <SelectContent>
                        {atletasDisponiveis.map(a => (
                          <SelectItem key={a.idAtleta} value={a.idAtleta.toString()}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                              <Button variant="ghost" size="sm" onClick={()=>handleRemoveAtleta(m.atleta.idAtleta)} disabled={removerAtletaMutation.isPending}>
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
                <Button onClick={()=>{resetForm(); setIsCreateEditDialogOpen(true);}} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nova Equipe
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Filter className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Filtrar por nome..."
                  value={filtro}
                  onChange={e=>setFiltro(e.target.value)}
                  className="w-64 h-9"
                />
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
                    <TableRow key={e.idEquipe} className="hover:bg-muted/40 cursor-pointer" onDoubleClick={()=>handleViewDetails(e)}>
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
                          <Button variant="ghost" size="icon" onClick={()=>handleViewDetails(e)} title="Detalhes">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={()=>handleEdit(e)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={()=>handleDelete(e.idEquipe)} title="Excluir" disabled={deleteMutation.isPending}>
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