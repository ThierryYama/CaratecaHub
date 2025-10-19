
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Campeonatos from "./pages/Campeonatos";
import MeuCampeonato from "./pages/MeuCampeonato";
import ChaveamentosGerencia from "./pages/ChaveamentosGerencia";
import HistoricoBrackets from "./pages/HistoricoBrackets";
import ResultadosFinais from "./pages/ResultadosFinais";
import Categorias from "./pages/Categorias";
import Atletas from "./pages/Atletas";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import Equipes from "./pages/Equipes";
import VincularCategorias from "./pages/VincularCategoria";
import Inscricoes from "./pages/Inscricoes";
import CampeonatosPublicos from "./pages/CampeonatosPublicos";
import InscreverAtletas from "./pages/InscreverAtletas";
import { SidebarProvider } from "./context/SidebarContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Campeonatos /></ProtectedRoute>} /> 
            <Route path="/campeonatos" element={<ProtectedRoute><Campeonatos /></ProtectedRoute>} /> 
            <Route path="/campeonatos-publicos" element={<ProtectedRoute><CampeonatosPublicos /></ProtectedRoute>} /> 
            <Route path="/inscrever-atletas/:id" element={<ProtectedRoute><InscreverAtletas /></ProtectedRoute>} /> 
            <Route path="/meu-campeonato/:id" element={<ProtectedRoute><MeuCampeonato /></ProtectedRoute>} /> 
            <Route path="/meu-campeonato/:id/modalidades" element={<ProtectedRoute><VincularCategorias /></ProtectedRoute>} /> 
            <Route path="/meu-campeonato/:id/inscricoes" element={<ProtectedRoute><Inscricoes /></ProtectedRoute>} /> 
            <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} /> 
            <Route path="/atletas" element={<ProtectedRoute><Atletas /></ProtectedRoute>} /> 
            <Route path="/equipes" element={<ProtectedRoute><Equipes /></ProtectedRoute>} /> 
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} /> 
            <Route path="/meu-campeonato/:id/chaveamentos" element={<ProtectedRoute><ChaveamentosGerencia /></ProtectedRoute>} /> 
            <Route path="/meu-campeonato/:id/historico" element={<ProtectedRoute><HistoricoBrackets /></ProtectedRoute>} /> 
            <Route path="/meu-campeonato/:id/resultados" element={<ProtectedRoute><ResultadosFinais /></ProtectedRoute>} /> 
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
