import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCampeonato, Campeonato } from '@/services/api';
import { fetchAddressByCep, CepApiError } from '@/services/cepApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import EstadoSelect from '@/components/ui/estado-select';

interface CampeonatoFormValues {
  nome: string;
  descricao: string;
  dataInicio: string; 
  dataFim: string; 
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface CampeonatoFormProps {
  idAssociacao: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CampeonatoForm: React.FC<CampeonatoFormProps> = ({ idAssociacao, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [values, setValues] = useState<CampeonatoFormValues>({
    nome: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCepBlur = async () => {
    const cleanCep = values.cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }

    setIsLoadingCep(true);
    try {
      const addressData = await fetchAddressByCep(cleanCep);
      
      setValues(prev => ({
        ...prev,
        rua: addressData.logradouro || prev.rua,
        bairro: addressData.bairro || prev.bairro,
        cidade: addressData.localidade || prev.cidade,
        estado: addressData.uf || prev.estado,
      }));

      toast({
        title: 'CEP encontrado',
        description: 'Endereço preenchido automaticamente.',
      });
    } catch (error) {
      if (error instanceof CepApiError) {
        toast({
          title: 'Erro ao buscar CEP',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingCep(false);
    }
  };

  const mutation = useMutation<Campeonato, Error, void>({
    mutationFn: async () => {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao.trim() || undefined,
        dataInicio: new Date(values.dataInicio).toISOString(),
        dataFim: values.dataFim ? new Date(values.dataFim).toISOString() : undefined,
        idAssociacao,
        endereco: {
          rua: values.rua.trim(),
          numero: values.numero.trim(),
          complemento: values.complemento.trim() || undefined,
          bairro: values.bairro.trim(),
          cidade: values.cidade.trim(),
          estado: values.estado.trim(),
          cep: values.cep.trim(),
        }
      };
      return createCampeonato(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campeonatos'] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/campeonatos');
      }
    }
  });

  const handleChange = (field: keyof CampeonatoFormValues, value: string) => {
    setValues(v => ({ ...v, [field]: value }));
  };

  const handleDateChange = (field: 'dataInicio' | 'dataFim', value: string) => {
    if (value) {
      const parts = value.split('-');
      const year = parts[0];
      
      if (year && year.length > 4) {
        const truncatedYear = year.substring(0, 4);
        parts[0] = truncatedYear;
        const newValue = parts.join('-');
        setValues(v => ({ ...v, [field]: newValue }));
        return;
      }
    }
    setValues(v => ({ ...v, [field]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!values.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!values.dataInicio) newErrors.dataInicio = 'Data de início é obrigatória';
    if (!values.dataFim) newErrors.dataFim = 'Data de fim é obrigatória';
    if (values.dataInicio && values.dataFim && new Date(values.dataInicio) >= new Date(values.dataFim)) {
      newErrors.dataFim = 'Data fim deve ser posterior à data início';
    }
    if (!values.rua.trim()) newErrors.rua = 'Rua é obrigatória';
    if (!values.numero.trim()) newErrors.numero = 'Número é obrigatório';
    if (!values.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório';
    if (!values.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória';
    if (!values.estado.trim()) newErrors.estado = 'Estado é obrigatório';
    if (!values.cep.trim()) newErrors.cep = 'CEP é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Novo Campeonato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={values.nome} onChange={e => handleChange('nome', e.target.value)} placeholder="Ex: Open Estadual 2025" />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={values.descricao} onChange={e => handleChange('descricao', e.target.value)} placeholder="Breve descrição (opcional)" />
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data/Hora Início</Label>
              <Input 
                id="dataInicio" 
                type="datetime-local" 
                value={values.dataInicio} 
                onChange={e => handleDateChange('dataInicio', e.target.value)}
              />
              {errors.dataInicio && <p className="text-xs text-red-500">{errors.dataInicio}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data/Hora Fim</Label>
              <Input 
                id="dataFim" 
                type="datetime-local" 
                value={values.dataFim} 
                onChange={e => handleDateChange('dataFim', e.target.value)}
              />
              {errors.dataFim && <p className="text-xs text-red-500">{errors.dataFim}</p>}
            </div>
          </div>

          <div className="pt-2 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-4 space-y-2">
                <Label htmlFor="rua">Rua</Label>
                <Input id="rua" value={values.rua} onChange={e => handleChange('rua', e.target.value)} />
                {errors.rua && <p className="text-xs text-red-500">{errors.rua}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" value={values.numero} onChange={e => handleChange('numero', e.target.value)} />
                {errors.numero && <p className="text-xs text-red-500">{errors.numero}</p>}
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" value={values.bairro} onChange={e => handleChange('bairro', e.target.value)} />
                {errors.bairro && <p className="text-xs text-red-500">{errors.bairro}</p>}
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" value={values.complemento} onChange={e => handleChange('complemento', e.target.value)} />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" value={values.cidade} onChange={e => handleChange('cidade', e.target.value)} />
                {errors.cidade && <p className="text-xs text-red-500">{errors.cidade}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <EstadoSelect id="estado" value={values.estado} onChange={(uf) => handleChange('estado', uf)} />
                {errors.estado && <p className="text-xs text-red-500">{errors.estado}</p>}
              </div>
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input 
                  id="cep" 
                  value={values.cep} 
                  onChange={e => handleChange('cep', e.target.value)}
                  onBlur={handleCepBlur}
                  disabled={isLoadingCep}
                  maxLength={9}
                  placeholder="00000-000"
                />
                {errors.cep && <p className="text-xs text-red-500">{errors.cep}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => (onCancel ? onCancel() : navigate('/campeonatos'))}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          {mutation.isError && (
            <p className="text-sm text-red-500">Erro ao salvar. Tente novamente.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default CampeonatoForm;
