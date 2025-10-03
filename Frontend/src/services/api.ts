import axios from "axios";
export type Genero = 'Masculino' | 'Feminino' | 'Outro' | 'Misto';


const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  },
});


export interface Categoria {
  idCategoria: number;
  nome: string;
  faixaIdadeMin: number;
  faixaIdadeMax: number;
  genero: Genero;
  modalidade: Modalidade;
  descricao?: string | null;
  pesoMin?: number;
  pesoMax?: number;
  graduacaoMin: string;
  graduacaoMax: string;
}

export interface Atleta {
  idAtleta: number;
  nome: string;
  dataNascimento: string;
  genero: Exclude<Genero, 'Misto'>;
  graduacao: string;
  peso: number;
  idAssociacao: number;
  status: boolean;
  telefone: string;
  email: string;
}

export interface Equipe {
  idEquipe: number;
  nome: string;
  descricao?: string | null;
  idAssociacao: number;
  genero: Genero;
  membros: {
    atleta: Atleta;
  }[];
}

export interface EquipeInput {
  nome: string;
  descricao?: string;
  idAssociacao: number;
  atletasIds: number[];
  genero?: Genero;
}



export type EquipeUpdateInput = Partial<Pick<Equipe, 'nome' | 'descricao' | 'genero'>>;


export type CategoriaInput = Omit<Categoria, 'idCategoria'>;
export type AtletaInput = Omit<Atleta, 'idAtleta' | 'idAssociacao'>;

export const fetchAtletas = async (): Promise<Atleta[]> => {
    try{
        const response = await api.get("/listarAtletas"); 
        return response.data;
    } catch (error) {
        console.error("Error fetching atletas:", error);
        throw error;
    } 
};

export const createAtleta = async (atleta: AtletaInput): Promise<Atleta> => {
    const payload = {
        ...atleta,
        dataNascimento: atleta.dataNascimento.includes('T')
            ? atleta.dataNascimento
            : `${atleta.dataNascimento}T00:00:00.000Z`,
        idAssociacao: 1,
    };
    const response = await api.post('/cadastrarAtleta', payload);
    return response.data;
}

export const updateAtleta = async (id: number, atleta: Partial<AtletaInput>): Promise<Atleta> => {
    const payload: any = { ...atleta, idAssociacao: 1 };
    if (payload.dataNascimento) {
        payload.dataNascimento = payload.dataNascimento.includes('T')
            ? payload.dataNascimento
            : `${payload.dataNascimento}T00:00:00.000Z`;
    }
    const response = await api.put(`/atualizarAtleta/${id}`, payload);
    return response.data;
}

export const deleteAtleta = async (id: number): Promise<void> => {
    await api.delete(`/deletarAtleta/${id}`);
}



export const fetchCategorias = async (): Promise<Categoria[]> => {
    try{
        const response = await api.get("/listarCategorias");
    return response.data;
    } catch (error) {
        console.error("Error fetching categorias:", error);
        throw error;
    }
};

export const createCategoria = async (categoria: CategoriaInput): Promise<Categoria> => {
  const response = await api.post('/cadastrarCategoria', categoria);
  return response.data;
};

export const updateCategoria = async (id: number, categoria: Partial<CategoriaInput>): Promise<Categoria> => {
  const response = await api.put(`/atualizarCategoria/${id}`, categoria);
  return response.data;
};

export const deleteCategoria = async (id: number): Promise<void> => {
    await api.delete(`/deletarCategoria/${id}`);
};

export const fetchEquipes = async (): Promise<Equipe[]> => {
  try {
    const response = await api.get("/listarEquipes");
    return response.data;
  } catch (error) {
    console.error("Error fetching equipes:", error);
    throw error;
  }
};

export const createEquipe = async (equipe: EquipeInput): Promise<Equipe> => {
  const response = await api.post('/cadastrarEquipe', equipe);
  return response.data;
};

export const updateEquipe = async (id: number, equipe: EquipeUpdateInput): Promise<Equipe> => {
  const response = await api.put(`/atualizarEquipe/${id}`, equipe);
  return response.data;
};

export const deleteEquipe = async (id: number): Promise<void> => {
  await api.delete(`/deletarEquipe/${id}`);
};

export const vincularAtletaEquipe = async (idEquipe: number, idAtleta: number): Promise<void> => {
  await api.post(`/vincularAtletaEquipe/${idEquipe}/${idAtleta}`);
};

export const removerAtletaEquipe = async (idEquipe: number, idAtleta: number): Promise<void> => {
  await api.delete(`/removerAtletaEquipe/${idEquipe}/${idAtleta}`);
};

export enum Modalidade {
  KATA = 'KATA',
  KUMITE = 'KUMITE',
  KATA_EQUIPE = 'KATA_EQUIPE',
  KUMITE_EQUIPE = 'KUMITE_EQUIPE',
}

export enum Status {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum StatusInscricao {
  AGUARDANDO = 'AGUARDANDO',
  INSCRITO = 'INSCRITO',
}

export interface Endereco {
  idEndereco: number;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  idAssociacao?: number | null;
}

export interface Campeonato {
  idCampeonato: number;
  idAssociacao: number;
  idEndereco?: number;
  endereco: Endereco;
  nome: string;
  dataInicio: string;
  dataFim?: string | null;
  descricao?: string | null;
  status: Status;
  modalidades: Categoria[];
}

export type EnderecoInput = Omit<Endereco, 'idEndereco'>;

export interface CampeonatoInput {
  nome: string;
  dataInicio: string;
  dataFim?: string;
  descricao?: string;
  status?: Status;
  idAssociacao: number;
  endereco?: EnderecoInput;
  idEndereco?: number;
}

export const fetchCampeonatos = async (): Promise<Campeonato[]> => {
  const response = await api.get('/listarCampeonatos');
  return response.data;
};

export const fetchCampeonatosPorAssociacao = async (idAssociacao: number): Promise<Campeonato[]> => {
  const response = await api.get(`/listarCampeonatosPorIdDeAssociacao/${idAssociacao}`);
  return response.data;
};

export const fetchCampeonatoById = async (id: number): Promise<Campeonato> => {
    const response = await api.get(`/listarCampeonato/${id}`);
    return response.data;
};

export const createCampeonato = async (campeonato: CampeonatoInput): Promise<Campeonato> => {
  const response = await api.post('/cadastrarCampeonato', campeonato);
  return response.data;
};

export const updateCampeonato = async (id: number, campeonato: Partial<CampeonatoInput>): Promise<Campeonato> => {
  const payload: any = { ...campeonato };
  if (payload.dataInicio && !payload.dataInicio.includes('T')) {
    payload.dataInicio = `${payload.dataInicio}T00:00:00.000Z`;
  }
  if (payload.dataFim && !payload.dataFim.includes('T')) {
    payload.dataFim = `${payload.dataFim}T00:00:00.000Z`;
  }
  const response = await api.put(`/atualizarCampeonato/${id}`, payload);
  return response.data;
};

export const deleteCampeonato = async (id: number): Promise<void> => {
  await api.delete(`/deletarCampeonato/${id}`);
};

export const adicionarCategoriaAoCampeonato = async (idCampeonato: number, idCategoria: number): Promise<void> => {
  await api.post(`/adicionarCategoriaAoCampeonato/${idCampeonato}`, { idCategoria });
};

export const removerCategoriaDeCampeonato = async (idCampeonato: number, idCategoria: number): Promise<void> => {
  await api.delete(`/removerCategoriaDeCampeonato/${idCampeonato}/${idCategoria}`);
};

export const listarCategoriasDeCampeonato = async (idCampeonato: number): Promise<Categoria[]> => {
  const response = await api.get(`/listarCategoriasDeCampeonato/${idCampeonato}`);
  return response.data;
};

export const atualizarEnderecoCampeonato = async (idCampeonato: number, endereco: Partial<EnderecoInput>): Promise<Endereco> => {
  const response = await api.put(`/atualizarEnderecoCampeonato/${idCampeonato}`, endereco);
  return response.data.endereco || response.data;
};

export interface CampeonatoModalidadeWithCategoria {
  idCampeonatoModalidade: number;
  idCampeonato: number;
  idCategoria: number;
  categoria: Categoria;
}

export interface CampeonatoDetalhado extends Omit<Campeonato, 'modalidades'> {
  modalidades: CampeonatoModalidadeWithCategoria[];
}

export const fetchCampeonatoDetalhado = async (id: number): Promise<CampeonatoDetalhado> => {
  const response = await api.get(`/listarCampeonato/${id}`);
  return response.data;
};

export interface CampeonatoModalidade {
  idCampeonatoModalidade: number;
  idCampeonato: number;
  idCategoria: number;
  categoria?: Categoria;
  campeonato?: Campeonato;
}


export interface EtapasStatus {
  idCampeonato: number;
  modalidades: number;
  inscricoesAtleta: number;
  inscricoesEquipe: number;
  categoriasConfirmadas: boolean;
  inscricoesConfirmadas: boolean;
  chaveamentoGerado: boolean;
}

export const fetchEtapas = async (idCampeonato: number): Promise<EtapasStatus> => {
  const response = await api.get(`/etapas/${idCampeonato}`);
  return response.data;
};

export const confirmarCategorias = async (idCampeonato: number) => {
  const response = await api.post(`/confirmarCategorias/${idCampeonato}`);
  return response.data;
};

export const confirmarInscricoes = async (idCampeonato: number) => {
  const response = await api.post(`/confirmarInscricoes/${idCampeonato}`);
  return response.data;
};

export interface InscricaoAtleta {
  idInscricaoAtleta: number;
  idAtleta: number;
  idCampeonatoModalidade: number;
  status: StatusInscricao;
  atleta?: Atleta;
  campeonatoModalidade?: CampeonatoModalidade;
}

export interface InscricaoEquipe {
  idInscricaoEquipe: number;
  idEquipe: number;
  idCampeonatoModalidade: number;
  status: StatusInscricao;
  equipe?: Equipe;
  campeonatoModalidade?: CampeonatoModalidade;
}

export type InscricaoAtletaInput = {
  idAtleta: number;
  idCampeonatoModalidade: number;
  status?: StatusInscricao;
};

export type InscricaoAtletaUpdateInput = Partial<Pick<InscricaoAtleta, 'status'>>;

export type InscricaoEquipeInput = {
  idEquipe: number;
  idCampeonatoModalidade: number;
  status?: StatusInscricao;
};

export type InscricaoEquipeUpdateInput = Partial<Pick<InscricaoEquipe, 'status'>>;

export const fetchInscricoesAtletas = async (): Promise<InscricaoAtleta[]> => {
  const response = await api.get('/listarInscricoesAtletas');
  return response.data;
};

export const fetchInscricaoAtletaById = async (id: number): Promise<InscricaoAtleta> => {
  const response = await api.get(`/listarInscricaoAtleta/${id}`);
  return response.data;
};

export const fetchInscricoesAtletaPorIdDeAtleta = async (idAtleta: number): Promise<InscricaoAtleta[]> => {
  const response = await api.get(`/listarInscricoesAtletaPorAtleta/${idAtleta}`);
  return response.data;
};

export const fetchInscricoesAtletaPorIdDeCampeonatoModalidade = async (idCampeonatoModalidade: number): Promise<InscricaoAtleta[]> => {
  const response = await api.get(`/listarInscricoesAtletaPorCampeonato/${idCampeonatoModalidade}`);
  return response.data;
};

export const createInscricaoAtleta = async (data: InscricaoAtletaInput): Promise<InscricaoAtleta> => {
  const response = await api.post('/cadastrarInscricaoAtleta', data);
  return response.data;
};

export const updateInscricaoAtleta = async (id: number, data: InscricaoAtletaUpdateInput): Promise<InscricaoAtleta> => {
  const response = await api.put(`/atualizarInscricaoAtleta/${id}`, data);
  return response.data;
};

export const fetchInscricoesEquipes = async (): Promise<InscricaoEquipe[]> => {
  const response = await api.get('/listarInscricoesEquipes');
  return response.data;
};

export const fetchInscricaoEquipeById = async (id: number): Promise<InscricaoEquipe> => {
  const response = await api.get(`/listarInscricaoEquipe/${id}`);
  return response.data;
};

export const fetchInscricoesEquipePorIdDeEquipe = async (idEquipe: number): Promise<InscricaoEquipe[]> => {
  const response = await api.get(`/listarInscricoesEquipePorEquipe/${idEquipe}`);
  return response.data;
};

export const fetchInscricoesEquipePorIdDeCampeonatoModalidade = async (idCampeonatoModalidade: number): Promise<InscricaoEquipe[]> => {
  const response = await api.get(`/listarInscricoesEquipePorCampeonato/${idCampeonatoModalidade}`);
  return response.data;
};

export const createInscricaoEquipe = async (data: InscricaoEquipeInput): Promise<InscricaoEquipe> => {
  const response = await api.post('/cadastrarInscricaoEquipe', data);
  return response.data;
};

export const updateInscricaoEquipe = async (id: number, data: InscricaoEquipeUpdateInput): Promise<InscricaoEquipe> => {
  const response = await api.put(`/atualizarInscricaoEquipe/${id}`, data);
  return response.data;
};


export default api