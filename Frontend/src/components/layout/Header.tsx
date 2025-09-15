
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNovoCampeonato?: () => void;
}

const Header = ({ onToggleSidebar, onNovoCampeonato }: HeaderProps) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    // Implementar lógica de logout aqui
    console.log('Logout realizado');
  };

  return (
    <header className="bg-slate-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-600 rounded-md transition-colors"
        >
          <div className="w-6 h-6 flex flex-col justify-center gap-1">
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
          </div>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
            🥋
          </div>
          <div>
            <h1 className="text-xl font-bold">CaratecaHub</h1>
            <p className="text-sm text-slate-300">Gerenciamento de Campeonatos</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={() => {
            if (onNovoCampeonato) return onNovoCampeonato();
            navigate('/campeonatos?novo=1');
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Campeonato
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarFallback className="bg-indigo-600 text-white">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
