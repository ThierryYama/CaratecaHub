import axios from "axios";


const api = axios.create({
  baseURL: "http://backend:5000",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  },
});

export interface Categoria {
  idCategoria: number;
  nome: string;
  descricao: string;
  idadeMinima: number;
  idadeMaxima: number;
  sexo: 'M' | 'F' | 'Misto';
  graduacaoMinima: string;
  graduacaoMaxima: string;
  peso?: number | null;
  ativo: boolean;
}

export type CategoriaInput = Omit<Categoria, 'idCategoria'>;


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
