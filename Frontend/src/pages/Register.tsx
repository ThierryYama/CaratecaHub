import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register, RegisterInput } from '@/services/api';
import { fetchAddressByCep, CepApiError } from '@/services/cepApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sigla, setSigla] = useState('');

  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => register(data),
    onSuccess: () => {
      navigate('/');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erro ao registrar. Tente novamente.');
    },
  });

  const fetchAddressByCepHandler = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    setError('');
    
    try {
      const data = await fetchAddressByCep(cepValue);
      setRua(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
    } catch (err) {
      if (err instanceof CepApiError) {
        setError(err.message);
      } else {
        setError('Erro ao buscar CEP. Verifique sua conexão.');
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    setCep(value);
    if (value.replace(/\D/g, '').length === 8) {
      fetchAddressByCepHandler(value);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!nome || !cnpj || !telefone) {
        setError('Preencha os campos obrigatórios: Nome, CNPJ e Telefone');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
        setError('Preencha todos os campos obrigatórios do endereço');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !senha || !confirmarSenha) {
      setError('Preencha todos os campos');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const payload: RegisterInput = {
      nome,
      cnpj,
      telefone,
      email,
      senha,
      sigla: sigla || undefined,
      endereco: {
        rua,
        numero,
        complemento: complemento || undefined,
        bairro,
        cidade,
        estado,
        cep,
      },
    };

    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src="/logo.png" alt="CaratecaHub Logo" className="h-50 w-40" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Crie sua conta</CardTitle>
          <CardDescription>
            Etapa {step} de 3: {step === 1 ? 'Informações da Associação' : step === 2 ? 'Endereço' : 'Credenciais de Acesso'}
          </CardDescription>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full ${s <= step ? 'bg-red-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome da Associação <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Associação Dragão de Karatê"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">
                    CNPJ <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla (opcional)</Label>
                <Input
                  id="sigla"
                  placeholder="Ex: ADK"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  maxLength={10}
                />
              </div>
              <Button type="button" onClick={handleNext} className="w-full bg-red-600 hover:bg-red-700">
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rua">
                    Rua <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="rua"
                    placeholder="Nome da rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">
                    Número <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento (opcional)</Label>
                <Input
                  id="complemento"
                  placeholder="Apto, Bloco, etc."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">
                    Bairro <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="bairro"
                    placeholder="Nome do bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">
                    Cidade <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="cidade"
                    placeholder="Nome da cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">
                    Estado <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="estado"
                    placeholder="UF"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">
                    CEP <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      disabled={cepLoading}
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={handleBack} variant="outline" className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" onClick={handleNext} className="flex-1 bg-red-600 hover:bg-red-700">
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  E-mail <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">
                  Senha <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">
                  Confirmar Senha <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1"
                  disabled={registerMutation.isPending}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Já possui conta?{' '}
            <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
