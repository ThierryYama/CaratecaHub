
import React, { useState } from 'react';
import { Menu, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/Sidebar';

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  idadeMinima: number;
  idadeMaxima: number;
  sexo: 'M' | 'F' | 'Misto';
  graduacaoMinima: string;
  graduacaoMaxima: string;
  peso?: number;
  ativo: boolean;
}

const Categorias = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('categorias');
  const [categorias, setCategorias] = useState<Categoria[]>([
    {
      id: 1,
      nome: "Kata Juvenil Masculino",
      descricao: "Categoria de kata para atletas juvenis masculinos",
      idadeMinima: 14,
      idadeMaxima: 17,
      sexo: 'M',
      graduacaoMinima: '6º Kyu',
      graduacaoMaxima: '1º Dan',
      ativo: true
    },
    {
      id: 2,
      nome: "Kumite Feminino -55kg",
      descricao: "Categoria de kumite feminino até 55kg",
      idadeMinima: 18,
      idadeMaxima: 35,
      sexo: 'F',
      graduacaoMinima: '8º Kyu',
      graduacaoMaxima: '5º Dan',
      peso: 55,
      ativo: true
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [filtro, setFiltro] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('todos');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    idadeMinima: '',
    idadeMaxima: '',
    sexo: '',
    graduacaoMinima: '',
    graduacaoMaxima: '',
    peso: '',
    ativo: true
  });

  const graduacoes = [
    '10º Kyu', '9º Kyu', '8º Kyu', '7º Kyu', '6º Kyu', '5º Kyu', '4º Kyu', '3º Kyu', '2º Kyu', '1º Kyu',
    '1º Dan', '2º Dan', '3º Dan', '4º Dan', '5º Dan', '6º Dan', '7º Dan', '8º Dan', '9º Dan', '10º Dan'
  ];

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      idadeMinima: '',
      idadeMaxima: '',
      sexo: '',
      graduacaoMinima: '',
      graduacaoMaxima: '',
      peso: '',
      ativo: true
    });
    setCategoriaEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (categoriaEditando) {
      setCategorias(prev => prev.map(cat => 
        cat.id === categoriaEditando.id 
          ? {
              ...cat,
              nome: formData.nome,
              descricao: formData.descricao,
              idadeMinima: parseInt(formData.idadeMinima),
              idadeMaxima: parseInt(formData.idadeMaxima),
              sexo: formData.sexo as 'M' | 'F' | 'Misto',
              graduacaoMinima: formData.graduacaoMinima,
              graduacaoMaxima: formData.graduacaoMaxima,
              peso: formData.peso ? parseFloat(formData.peso) : undefined,
              ativo: formData.ativo
            }
          : cat
      ));
      toast({ title: "Categoria atualizada com sucesso!" });
    } else {
      const novaCategoria: Categoria = {
        id: Math.max(...categorias.map(c => c.id)) + 1,
        nome: formData.nome,
        descricao: formData.descricao,
        idadeMinima: parseInt(formData.idadeMinima),
        idadeMaxima: parseInt(formData.idadeMaxima),
        sexo: formData.sexo as 'M' | 'F' | 'Misto',
        graduacaoMinima: formData.graduacaoMinima,
        graduacaoMaxima: formData.graduacaoMaxima,
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        ativo: formData.ativo
      };
      setCategorias(prev => [...prev, novaCategoria]);
      toast({ title: "Categoria criada com sucesso!" });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (categoria: Categoria) => {
    setCategoriaEditando(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao,
      idadeMinima: categoria.idadeMinima.toString(),
      idadeMaxima: categoria.idadeMaxima.toString(),
      sexo: categoria.sexo,
      graduacaoMinima: categoria.graduacaoMinima,
      graduacaoMaxima: categoria.graduacaoMaxima,
      peso: categoria.peso?.toString() || '',
      ativo: categoria.ativo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setCategorias(prev => prev.filter(cat => cat.id !== id));
    toast({ title: "Categoria removida com sucesso!" });
  };

  const categoriasFiltradas = categorias.filter(categoria => {
    const matchNome = categoria.nome.toLowerCase().includes(filtro.toLowerCase());
    const matchSexo = filtroSexo === 'todos' || categoria.sexo === filtroSexo;
    return matchNome && matchSexo;
  });

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        activeItem={activeItem}
        onItemClick={setActiveItem}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
            </div>
            
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
                      <Select value={formData.sexo} onValueChange={(value) => setFormData(prev => ({ ...prev, sexo: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sexo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="Misto">Misto</SelectItem>
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
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="idadeMinima">Idade Mínima</Label>
                      <Input
                        id="idadeMinima"
                        type="number"
                        value={formData.idadeMinima}
                        onChange={(e) => setFormData(prev => ({ ...prev, idadeMinima: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="idadeMaxima">Idade Máxima</Label>
                      <Input
                        id="idadeMaxima"
                        type="number"
                        value={formData.idadeMaxima}
                        onChange={(e) => setFormData(prev => ({ ...prev, idadeMaxima: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="graduacaoMinima">Graduação Mínima</Label>
                      <Select value={formData.graduacaoMinima} onValueChange={(value) => setFormData(prev => ({ ...prev, graduacaoMinima: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a graduação mínima" />
                        </SelectTrigger>
                        <SelectContent>
                          {graduacoes.map(grad => (
                            <SelectItem key={grad} value={grad}>{grad}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="graduacaoMaxima">Graduação Máxima</Label>
                      <Select value={formData.graduacaoMaxima} onValueChange={(value) => setFormData(prev => ({ ...prev, graduacaoMaxima: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a graduação máxima" />
                        </SelectTrigger>
                        <SelectContent>
                          {graduacoes.map(grad => (
                            <SelectItem key={grad} value={grad}>{grad}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="peso">Peso (kg) - Opcional</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) => setFormData(prev => ({ ...prev, peso: e.target.value }))}
                      placeholder="Deixe em branco se não aplicável"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {categoriaEditando ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Categorias</CardTitle>
                <div className="flex items-center gap-4">
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
                      <SelectItem value="Misto">Misto</SelectItem>
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
                    <TableHead>Sexo</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Graduação</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasFiltradas.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{categoria.nome}</div>
                          <div className="text-sm text-gray-500">{categoria.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>{categoria.sexo}</TableCell>
                      <TableCell>{categoria.idadeMinima} - {categoria.idadeMaxima} anos</TableCell>
                      <TableCell>{categoria.graduacaoMinima} - {categoria.graduacaoMaxima}</TableCell>
                      <TableCell>{categoria.peso ? `${categoria.peso}kg` : '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          categoria.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {categoria.ativo ? 'Ativo' : 'Inativo'}
                        </span>
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
                            onClick={() => handleDelete(categoria.id)}
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