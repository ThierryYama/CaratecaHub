import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register, RegisterInput } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EstadoSelect from '@/components/ui/estado-select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { MaskedInput } from '@/components/ui/masked-input';
import { validarCNPJ, validarEmail, validarTelefone, validarCEP, buscarEnderecoPorCEP, validarCNPJAPI, validarSenha } from '@/lib/validations';
import { removerMascara } from '@/lib/masks';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjValidado, setCnpjValidado] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<{razao_social: string; situacao: string} | null>(null);

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
  const [mostrarRequisitos, setMostrarRequisitos] = useState(false);

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => register(data),
    onSuccess: () => {
      // Exibe uma mensagem de sucesso apropriada para registro de conta
      alert('Conta criada com sucesso! Você será redirecionado para a página inicial.');
      navigate('/');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erro ao registrar. Tente novamente.');
    },
  });

  const fetchAddressByCepHandler = async (cepValue: string) => {
    const cleanCep = removerMascara(cepValue);
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    setError('');
    
    try {
      const data = await buscarEnderecoPorCEP(cepValue);
      setRua(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
    } catch (err) {
      if (err instanceof Error) {
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
    if (removerMascara(value).length === 8) {
      fetchAddressByCepHandler(value);
    }
  };

  const handleCnpjChange = (value: string) => {
    setCnpj(value);
    // Reset validação quando CNPJ muda
    setCnpjValidado(false);
    setCnpjInfo(null);
  };

  const validarCNPJNaReceita = async () => {
    if (!cnpj) {
      setError('Digite um CNPJ primeiro');
      return;
    }

    // Validação local primeiro
    if (!validarCNPJ(cnpj)) {
      setError('CNPJ inválido. Verifique os dígitos.');
      return;
    }

    setCnpjLoading(true);
    setError('');

    try {
      const resultado = await validarCNPJAPI(cnpj);
      
      // Verificar se CNPJ está ativo
      if (resultado.situacao.toLowerCase().includes('baixada') || 
          resultado.situacao.toLowerCase().includes('suspensa') ||
          resultado.situacao.toLowerCase().includes('inapta')) {
        setError(`CNPJ encontrado mas está: ${resultado.situacao}. Não é possível cadastrar.`);
        setCnpjValidado(false);
        setCnpjInfo(null);
      } else {
        setCnpjValidado(true);
        setCnpjInfo({
          razao_social: resultado.razao_social,
          situacao: resultado.situacao
        });
        setError('');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao validar CNPJ na Receita Federal. Tente novamente.');
      }
      setCnpjValidado(false);
      setCnpjInfo(null);
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!nome || !cnpj || !telefone) {
        setError('Preencha os campos obrigatórios: Nome, CNPJ e Telefone');
        return;
      }
      // Validar CNPJ
      if (!validarCNPJ(cnpj)) {
        setError('CNPJ inválido. Verifique os dígitos.');
        return;
      }
      // Verificar se CNPJ foi validado na Receita
      if (!cnpjValidado) {
        setError('Valide o CNPJ na Receita Federal antes de prosseguir');
        return;
      }
      // Validar telefone
      if (!validarTelefone(telefone)) {
        setError('Telefone inválido. Use o formato (00) 00000-0000');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!rua || !numero || !bairro || !cidade || !estado || !cep) {
        setError('Preencha todos os campos obrigatórios do endereço');
        return;
      }
      // Validar CEP
      if (!validarCEP(cep)) {
        setError('CEP inválido. Use o formato 00000-000');
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
    // Validar email
    if (!validarEmail(email)) {
      setError('E-mail inválido');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    // Validar senha com novos critérios
    const validacaoSenha = validarSenha(senha);
    if (!validacaoSenha.isValid) {
      setError(validacaoSenha.mensagem || 'Senha inválida');
      return;
    }

    const payload: RegisterInput = {
      nome,
      cnpj: removerMascara(cnpj), // Remove máscara antes de enviar
      telefone: removerMascara(telefone),
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
        cep: removerMascara(cep),
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
              
              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-red-600">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MaskedInput
                      id="cnpj"
                      mask="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={handleCnpjChange}
                      disabled={cnpjLoading}
                    />
                    {cnpjValidado && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={validarCNPJNaReceita}
                    disabled={cnpjLoading || !cnpj || cnpjValidado}
                    variant={cnpjValidado ? "outline" : "default"}
                    className={cnpjValidado ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : ""}
                  >
                    {cnpjLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : cnpjValidado ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Validado
                      </>
                    ) : (
                      'Validar'
                    )}
                  </Button>
                </div>
                {cnpjInfo && cnpjValidado && (
                  <div className="text-sm bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                    <p className="font-semibold text-green-800">{cnpjInfo.razao_social}</p>
                    <p className="text-green-600">Situação: {cnpjInfo.situacao}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone <span className="text-red-600">*</span>
                </Label>
                <MaskedInput
                  id="telefone"
                  mask="telefone"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={setTelefone}
                />
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
                  <EstadoSelect id="estado" value={estado} onChange={setEstado} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">
                    CEP <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <MaskedInput
                      id="cep"
                      mask="cep"
                      placeholder="00000-000"
                      value={cep}
                      onChange={handleCepChange}
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
                <MaskedInput
                  id="email"
                  mask="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={setEmail}
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
                  onFocus={() => setMostrarRequisitos(true)}
                  onBlur={() => setMostrarRequisitos(false)}
                  disabled={registerMutation.isPending}
                />
                {mostrarRequisitos && (
                  <div className="text-xs bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1">
                    <p className="font-semibold text-blue-800 mb-2">A senha deve conter:</p>
                    <div className="space-y-1">
                      <p className={senha.length >= 6 ? 'text-green-600' : 'text-gray-600'}>
                        {senha.length >= 6 ? '✓' : '○'} Mínimo de 6 caracteres
                      </p>
                      <p className={/\d/.test(senha) ? 'text-green-600' : 'text-gray-600'}>
                        {/\d/.test(senha) ? '✓' : '○'} Pelo menos um número
                      </p>
                      <p className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha) ? 'text-green-600' : 'text-gray-600'}>
                        {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha) ? '✓' : '○'} Pelo menos um caractere especial (!@#$%...)
                      </p>
                    </div>
                  </div>
                )}
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
