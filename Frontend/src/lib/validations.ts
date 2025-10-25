/**
 * Utilitários de validação de documentos e dados
 */

/**
 * Valida um CNPJ
 * @param cnpj - CNPJ com ou sem máscara
 * @returns true se válido, false caso contrário
 */
export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (numeros.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(numeros)) return false;

  // Valida DVs (dígitos verificadores)
  let tamanho = numeros.length - 2;
  let numeros_verificacao = numeros.substring(0, tamanho);
  const digitos = numeros.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros_verificacao.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros_verificacao = numeros.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros_verificacao.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(1))) return false;

  return true;
}

/**
 * Valida um CPF
 * @param cpf - CPF com ou sem máscara
 * @returns true se válido, false caso contrário
 */
export function validarCPF(cpf: string): boolean {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11) return false;
  if (/^(\d)\1+$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(numeros.charAt(i)) * (10 - i);
  }

  let resto = 11 - (soma % 11);
  const digito1 = resto === 10 || resto === 11 ? 0 : resto;

  if (digito1 !== Number(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(numeros.charAt(i)) * (11 - i);
  }

  resto = 11 - (soma % 11);
  const digito2 = resto === 10 || resto === 11 ? 0 : resto;

  if (digito2 !== Number(numeros.charAt(10))) return false;

  return true;
}

/**
 * Valida um email usando regex
 * @param email - Email a ser validado
 * @returns true se válido, false caso contrário
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida uma senha
 * @param senha - Senha a ser validada
 * @returns objeto com isValid (boolean) e mensagem de erro (string ou undefined)
 */
export function validarSenha(senha: string): { isValid: boolean; mensagem?: string } {
  if (senha.length < 6) {
    return { isValid: false, mensagem: 'A senha deve ter no mínimo 6 caracteres' };
  }

  if (!/\d/.test(senha)) {
    return { isValid: false, mensagem: 'A senha deve conter pelo menos um número' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha)) {
    return { isValid: false, mensagem: 'A senha deve conter pelo menos um caractere especial (!@#$%^&*...)'};
  }

  return { isValid: true };
}

/**
 * Valida força da senha e retorna nível
 * @param senha - Senha a ser validada
 * @returns objeto com nível (fraca, média, forte) e isValid
 */
export function verificarForcaSenha(senha: string): { nivel: 'fraca' | 'média' | 'forte'; isValid: boolean } {
  const validacao = validarSenha(senha);
  if (!validacao.isValid) {
    return { nivel: 'fraca', isValid: false };
  }

  let pontos = 0;

  // Critérios de força
  if (senha.length >= 8) pontos += 1;
  if (senha.length >= 12) pontos += 1;
  if (/[a-z]/.test(senha)) pontos += 1;
  if (/[A-Z]/.test(senha)) pontos += 1;
  if (/\d/.test(senha)) pontos += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha)) pontos += 1;

  if (pontos <= 3) return { nivel: 'fraca', isValid: true };
  if (pontos <= 5) return { nivel: 'média', isValid: true };
  return { nivel: 'forte', isValid: true };
}

/**
 * Valida um telefone brasileiro
 * @param telefone - Telefone com ou sem máscara
 * @returns true se válido, false caso contrário
 */
export function validarTelefone(telefone: string): boolean {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = telefone.replace(/\D/g, '');
  // Aceita telefone fixo (10 dígitos) ou celular (11 dígitos)
  return numeros.length === 10 || numeros.length === 11;
}

/**
 * Valida um CEP
 * @param cep - CEP com ou sem máscara
 * @returns true se válido, false caso contrário
 */
export function validarCEP(cep: string): boolean {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = cep.replace(/\D/g, '');
  return numeros.length === 8;
}

/**
 * Valida CNPJ via API da ReceitaWS
 * @param cnpj - CNPJ com ou sem máscara
 * @returns Promise com os dados da empresa se válido, ou rejeita com erro
 */
export async function validarCNPJAPI(cnpj: string): Promise<{
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  uf: string;
  municipio: string;
}> {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = cnpj.replace(/\D/g, '');

  if (!validarCNPJ(numeros)) {
    throw new Error('CNPJ inválido');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numeros}`);
    
    if (!response.ok) {
      throw new Error('CNPJ não encontrado na Receita Federal');
    }

    const data = await response.json();
    
    return {
      cnpj: data.cnpj,
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      situacao: data.descricao_situacao_cadastral,
      uf: data.uf,
      municipio: data.municipio,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao validar CNPJ na Receita Federal');
  }
}

/**
 * Busca endereço via CEP usando a API ViaCEP
 * @param cep - CEP com ou sem máscara
 * @returns Promise com os dados do endereço
 */
export async function buscarEnderecoPorCEP(cep: string): Promise<{
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}> {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = cep.replace(/\D/g, '');

  if (!validarCEP(numeros)) {
    throw new Error('CEP inválido');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao buscar endereço por CEP');
  }
}
