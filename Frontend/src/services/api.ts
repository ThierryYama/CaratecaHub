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

export default api