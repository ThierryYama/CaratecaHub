import axios from "axios";


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
  genero: 'M' | 'F' | 'Outro';
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
  genero: 'Masculino' | 'Feminino' | 'Outro';
  graduacao: string;
  peso: number;
  idAssociacao: number;
  status: boolean;
  telefone: string;
  email: string;
}

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

export default api