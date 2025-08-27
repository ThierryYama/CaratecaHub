import express, {Request, Response, ErrorRequestHandler} from 'express';
import { PrismaClient } from '../src/generated/prisma';
import cors from 'cors';

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', //Frontend URL 
    credentials: true,
}));

app.use(express.json());

app.get('/api/categoria', async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});  

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});


const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err); // Exibe o erro no console
    res.status(400).json({ error: 'Ocorreu algum erro.' });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

export default app;