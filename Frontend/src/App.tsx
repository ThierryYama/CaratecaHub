
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
            <Route path="/" element={<Index />} /> 
            <Route path="/campeonatos" element={<Campeonatos />} /> 
            <Route path="/campeonatos-publicos" element={<CampeonatosPublicos />} /> 
            <Route path="/inscrever-atletas/:id" element={<InscreverAtletas />} /> 
            <Route path="/meu-campeonato/:id" element={<MeuCampeonato />} /> 
            <Route path="/meu-campeonato/:id/modalidades" element={<VincularCategorias />} /> 
            <Route path="/meu-campeonato/:id/inscricoes" element={<Inscricoes />} /> 
            <Route path="/categorias" element={<Categorias />} /> 
            <Route path="/atletas" element={<Atletas />} /> 
            <Route path="/equipes" element={<Equipes />} /> 
            <Route path="/perfil" element={<Perfil />} /> 
            <Route path="/meu-campeonato/:id/chaveamentos" element={<ChaveamentosGerencia />} /> 
            <Route path="/meu-campeonato/:id/historico" element={<HistoricoBrackets />} /> 
            <Route path="/meu-campeonato/:id/resultados" element={<ResultadosFinais />} /> 
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
