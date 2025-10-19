export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export class CepApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CepApiError';
  }
}

export const fetchAddressByCep = async (cep: string): Promise<CepResponse> => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    throw new CepApiError('CEP deve conter 8 dígitos');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new CepApiError('Erro ao buscar CEP');
    }

    const data: CepResponse = await response.json();
    
    if (data.erro) {
      throw new CepApiError('CEP não encontrado');
    }

    return data;
  } catch (error) {
    if (error instanceof CepApiError) {
      throw error;
    }
    throw new CepApiError('Erro ao buscar CEP. Verifique sua conexão.');
  }
};
