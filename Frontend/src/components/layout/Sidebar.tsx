
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  List,
  Trophy,
  UserPlus,
  Crown,
  Link
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'campeonatos', label: 'Campeonatos', icon: CalendarDays, path: '/campeonatos' },
  { id: 'meu-campeonato', label: 'Meu Campeonato', icon: Crown, path: '/meu-campeonato' },
  { id: 'modalidades', label: 'Vincular Modalidades', icon: Link, path: '/vincular-modalidades' },
  { id: 'categorias', label: 'Categorias', icon: List, path: '/categorias' },
  { id: 'atletas', label: 'Atletas', icon: Users, path: '/atletas' },
  { id: 'equipes', label: 'Equipes', icon: Users, path: '/equipes' },
  { id: 'inscricoes', label: 'Inscrições', icon: UserPlus, path: '/inscricoes' },
  { id: 'resultados', label: 'Resultados', icon: Trophy, path: '/resultados' },
  { id: 'ranking', label: 'Ranking', icon: Trophy, path: '/ranking' },
];

const Sidebar = ({ isCollapsed, activeItem, onItemClick }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (item: typeof menuItems[0]) => {
    onItemClick(item.id);
    navigate(item.path);
  };

  return (
    <aside className={cn(
      "bg-gray-900 text-white transition-all duration-300 flex flex-col shadow-xl",
      isCollapsed ? "w-0 lg:w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-700">
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-300",
          isCollapsed ? "opacity-0 lg:opacity-100" : "opacity-100"
        )}>
          {isCollapsed ? (
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-sm font-bold">
              🥋
            </div>
          ) : (
            <>
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-sm font-bold">
                🥋
              </div>
              <span className="font-bold text-lg">Karatê</span>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left",
                isActive
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "transition-opacity duration-300 whitespace-nowrap",
                isCollapsed ? "opacity-0 lg:opacity-0" : "opacity-100"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
