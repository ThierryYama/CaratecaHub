
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Campeonatos from "./pages/Campeonatos";
import GerenciamentoCampeonato from "./pages/GerenciamentoCampeonato";
import Chaveamento from "./pages/Chaveamento";
import MeuCampeonato from "./pages/MeuCampeonato";
import ChaveamentosGerencia from "./pages/ChaveamentosGerencia";
import VincularModalidades from "./pages/VincularModalidades";
import Categorias from "./pages/Categorias";
import Atletas from "./pages/Atletas";
import NotFound from "./pages/NotFound";
import Equipes from "./pages/Equipes";
import VincularCategorias from "./pages/VincularCategoria";
import Inscricoes from "./pages/Inscricoes";
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
            <Route path="/" element={<Index />} />
            <Route path="/campeonatos" element={<Campeonatos />} />
            <Route path="/gerenciamento-campeonato" element={<GerenciamentoCampeonato />} />
            <Route path="/chaveamento" element={<Chaveamento />} />
            <Route path="/meu-campeonato/:id" element={<MeuCampeonato />} />
            <Route path="/meu-campeonato/:id/modalidades" element={<VincularCategorias />} />
            <Route path="/meu-campeonato/:id/inscricoes" element={<Inscricoes />} />
            <Route path="/chaveamentos-gerencia" element={<ChaveamentosGerencia />} />
            <Route path="/vincular-modalidades" element={<VincularModalidades />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/atletas" element={<Atletas />} />
            <Route path="/equipes" element={<Equipes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
