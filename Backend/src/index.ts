import express, {Request, Response, ErrorRequestHandler} from 'express';
import cors from 'cors';
import RotaCategoria from './routes/RotaCategoria';
import RotaAtleta from './routes/RotaAtletas';
import RotaEquipe from './routes/RotaEquipe';
import RotaCampeonato from './routes/RotaCampeonato';
import RotaInscricao from './routes/RotaInscricao';
import RotaChaveamento from './routes/RotaChaveamento';


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
app.use(RotaEquipe);
app.use(RotaCampeonato);
app.use(RotaInscricao);
app.use(RotaChaveamento);

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