/**
 * Utilitários de máscaras para formatação de dados
 */

/**
 * Aplica máscara de CNPJ
 * @param value - Valor a ser formatado
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
export function mascaraCNPJ(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = value.replace(/\D/g, '');
  
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
  if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
  if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
  
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
}

/**
 * Aplica máscara de CPF
 * @param value - Valor a ser formatado
 * @returns CPF formatado (000.000.000-00)
 */
export function mascaraCPF(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = value.replace(/\D/g, '');
  
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
}

/**
 * Aplica máscara de telefone brasileiro
 * @param value - Valor a ser formatado
 * @returns Telefone formatado ((00) 0000-0000 ou (00) 00000-0000)
 */
export function mascaraTelefone(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = value.replace(/\D/g, '');
  
  if (numeros.length <= 2) return numeros.length === 0 ? '' : `(${numeros}`;
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

/**
 * Aplica máscara de CEP
 * @param value - Valor a ser formatado
 * @returns CEP formatado (00000-000)
 */
export function mascaraCEP(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const numeros = value.replace(/\D/g, '');
  
  if (numeros.length <= 5) return numeros;
  
  return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
}

/**
 * Remove máscara de qualquer valor, deixando apenas números
 * @param value - Valor com máscara
 * @returns Apenas números
 */
export function removerMascara(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  return value.replace(/\D/g, '');
}

/**
 * Formata um email (lowercase e trim)
 * @param value - Email a ser formatado
 * @returns Email formatado
 */
export function formatarEmail(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Hook personalizado para aplicar máscara em tempo real em inputs
 * @param tipo - Tipo de máscara ('cnpj', 'cpf', 'telefone', 'cep', 'email')
 * @returns Função que aplica a máscara apropriada
 */
export function aplicarMascara(tipo: 'cnpj' | 'cpf' | 'telefone' | 'cep' | 'email'): (value: string) => string {
  switch (tipo) {
    case 'cnpj':
      return mascaraCNPJ;
    case 'cpf':
      return mascaraCPF;
    case 'telefone':
      return mascaraTelefone;
    case 'cep':
      return mascaraCEP;
    case 'email':
      return formatarEmail;
    default:
      return (value) => value;
  }
}
