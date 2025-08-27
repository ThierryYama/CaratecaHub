import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

interface Categoria {
  idCategoria: number;
  nome: string;
}

function App() {
  const [users, setUsers] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categoria');  // Usa o proxy: /api/ -> http://localhost:3000/
        setUsers(response.data);
      } catch (err) {
        setError('Erro ao conectar à API');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Usuários do caratecahub</h1>
        {users.length > 0 ? (
          <ul>
            {users.map((user) => (
              <li key={user.idCategoria}>
                {user.nome ? user.nome : 'Sem nome'} ({user.idCategoria})
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum usuário encontrado.</p>
        )}
      </header>
    </div>
  );
}

export default App;