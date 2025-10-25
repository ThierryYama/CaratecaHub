import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPerfil, updatePerfil, deletePerfil, UpdatePerfilInput } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EstadoSelect from '@/components/ui/estado-select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Mail, Phone, Building2, MapPin, Trash2, Save, X, Edit } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSidebar } from '@/context/SidebarContext';
import { useToast } from '@/hooks/use-toast';
import { fetchAddressByCep } from '@/services/cepApi';

const Perfil = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed, toggle: toggleSidebar, setCollapsed: setSidebarCollapsed } = useSidebar();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdatePerfilInput>({
    nome: '',
    telefone: '',
    email: '',
    sigla: '',
    senha: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });
  const [loadingCep, setLoadingCep] = useState(false);

  const ensureEndereco = (e?: UpdatePerfilInput['endereco']) => e ?? ({
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  });

  const onlyDigits = (s: string) => (s.match(/\d/g) || []).join('');

  const { data: perfil, isLoading, isError } = useQuery({
    queryKey: ['perfil'],
    queryFn: fetchPerfil,
  });

  useEffect(() => {
    if (!perfil || isEditing) return;
    setFormData({
      nome: perfil.nome,
      telefone: perfil.telefone,
      email: perfil.email,
      sigla: perfil.sigla || '',
      senha: '',
      endereco: perfil.endereco ? {
        rua: perfil.endereco.rua,
        numero: perfil.endereco.numero,
        complemento: perfil.endereco.complemento || '',
        bairro: perfil.endereco.bairro,
        cidade: perfil.endereco.cidade,
        estado: perfil.endereco.estado,
        cep: perfil.endereco.cep
      } : {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      }
    });
  }, [perfil, isEditing]);

  const updateMutation = useMutation({
    mutationFn: updatePerfil,
    onSuccess: () => {
      toast({ title: 'Perfil atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar perfil', 
        description: error?.response?.data?.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePerfil,
    onSuccess: () => {
      toast({ title: 'Conta excluída com sucesso' });
      navigate('/login');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir conta',
        description: error?.response?.data?.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  });

  const handleCepBlur = async () => {
    const cep = onlyDigits(formData.endereco?.cep ?? '');
    if (!cep || cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const address = await fetchAddressByCep(cep);
      setFormData(prev => {
        const atual = ensureEndereco(prev.endereco);
        return ({
          ...prev,
          endereco: {
            ...atual,
            rua: address.logradouro || atual.rua,
            bairro: address.bairro || atual.bairro,
            cidade: address.localidade || atual.cidade,
            estado: address.uf || atual.estado
          }
        });
      });
    } catch (err) {
      console.error('CEP fetch error', err);
      toast({
        title: 'CEP não encontrado',
        description: 'Preencha o endereço manualmente',
        variant: 'destructive'
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdatePerfilInput = {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email,
      sigla: formData.sigla || undefined
    };

    if (formData.senha?.trim()) {
      payload.senha = formData.senha;
    }

    if (formData.endereco?.rua && formData.endereco?.numero) {
      payload.endereco = formData.endereco;
    }

    updateMutation.mutate(payload);
  };

  const handleCancel = () => {
    if (perfil) {
      setFormData({
        nome: perfil.nome,
        telefone: perfil.telefone,
        email: perfil.email,
        sigla: perfil.sigla || '',
        senha: '',
        endereco: perfil.endereco ? {
          rua: perfil.endereco.rua,
          numero: perfil.endereco.numero,
          complemento: perfil.endereco.complemento || '',
          bairro: perfil.endereco.bairro,
          cidade: perfil.endereco.cidade,
          estado: perfil.endereco.estado,
          cep: perfil.endereco.cep
        } : {
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        }
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
  <Sidebar onItemClick={() => {}} />
        <div className="flex-1 flex flex-col">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </main>
        </div>
      </div>
    );
  }

  if (isError || !perfil) {
    return (
      <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
  <Sidebar onItemClick={() => {}} />
        <div className="flex-1 flex flex-col">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 flex items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>Erro ao carregar perfil. Tente novamente.</AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex w-full bg-gray-50 overflow-hidden">
  <Sidebar onItemClick={() => { if (window.innerWidth < 1024) setSidebarCollapsed(true); }} />
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
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-600 mt-1">Gerencie as informações da sua associação</p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit className="w-4 h-4" /> Editar
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Associação</CardTitle>
                  <CardDescription>Dados cadastrais e de contato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Nome da Associação
                      </Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={perfil.cnpj}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">O CNPJ não pode ser alterado</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Telefone
                      </Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sigla">Sigla</Label>
                      <Input
                        id="sigla"
                        value={formData.sigla}
                        onChange={(e) => setFormData(prev => ({ ...prev, sigla: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Ex: FPKPR"
                      />
                    </div>

                    {isEditing && (
                      <div className="space-y-2">
                        <Label htmlFor="senha">Nova Senha (opcional)</Label>
                        <Input
                          id="senha"
                          type="password"
                          value={formData.senha}
                          onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                          placeholder="Deixe em branco para não alterar"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" /> Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          value={formData.endereco?.cep || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), cep: e.target.value } }))}
                          onBlur={handleCepBlur}
                          disabled={!isEditing || loadingCep}
                        />
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <Label htmlFor="rua">Rua</Label>
                        <Input
                          id="rua"
                          value={formData.endereco?.rua || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), rua: e.target.value } }))}
                          disabled={!isEditing || loadingCep}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          value={formData.endereco?.numero || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), numero: e.target.value } }))}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={formData.endereco?.complemento || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), complemento: e.target.value } }))}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.endereco?.bairro || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), bairro: e.target.value } }))}
                          disabled={!isEditing || loadingCep}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={formData.endereco?.cidade || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), cidade: e.target.value } }))}
                          disabled={!isEditing || loadingCep}
                        />
                      </div>

                      <div className="md:col-span-1 space-y-2">
                        <Label htmlFor="estado">UF</Label>
                        <EstadoSelect
                          id="estado"
                          value={formData.endereco?.estado || ''}
                          onChange={(uf) => setFormData(prev => ({ ...prev, endereco: { ...ensureEndereco(prev.endereco), estado: uf } }))}
                          disabled={!isEditing || loadingCep}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                        <X className="w-4 h-4 mr-2" /> Cancelar
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>

            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-700">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Excluir Conta</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Esta ação não pode ser desfeita. Todos os dados serão permanentemente excluídos.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="w-4 h-4" /> Excluir Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                          e removerá todos os dados de nossos servidores.
                          <br /><br />
                          <strong>Atenção:</strong> Só é possível excluir a conta se não houver campeonatos, atletas ou equipes vinculados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate()}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...
                            </>
                          ) : (
                            'Sim, excluir minha conta'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-sm text-gray-500">
              Conta criada em {new Date(perfil.createdAt).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Perfil;
