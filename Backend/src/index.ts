import express, {Request, Response, ErrorRequestHandler} from 'express';
import { PrismaClient } from '../src/generated/prisma';
import cors from 'cors';
import RotaCategoria from './routes/RotaCategoria';
import RotaAtleta from './routes/RotaAtletas';

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

//Rotas 
app.use(RotaCategoria);
app.use(RotaAtleta);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});


const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err); 
    res.status(400).json({ error: 'Ocorreu algum erro.' });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

export default app;