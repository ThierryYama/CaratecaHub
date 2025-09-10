import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  List,
  Trophy,
  UserPlus,
  Crown,
  Link,
  UserRound,
  Medal,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  isCollapsed: boolean;
  onItemClick: (item: string) => void;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'campeonatos', label: 'Campeonatos', icon: CalendarDays, path: '/campeonatos' },
  { id: 'meu-campeonato', label: 'Meu Campeonato', icon: Crown, path: '/meu-campeonato' },
  { id: 'modalidades', label: 'Vincular Modalidades', icon: Link, path: '/vincular-modalidades' },
  { id: 'categorias', label: 'Categorias', icon: List, path: '/categorias' },
  { id: 'atletas', label: 'Atletas', icon: UserRound, path: '/atletas' },
  { id: 'equipes', label: 'Equipes', icon: Users, path: '/equipes' },
  { id: 'inscricoes', label: 'Inscrições', icon: UserPlus, path: '/inscricoes' },
  { id: 'resultados', label: 'Resultados', icon: Trophy, path: '/resultados' },
  { id: 'ranking', label: 'Ranking', icon: Medal, path: '/ranking' },
];

const Sidebar = ({ isCollapsed, onItemClick, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (item: typeof menuItems[0]) => {
    onItemClick(item.id);
    navigate(item.path);
  };

  return (
    <aside className={cn(
      "bg-gray-900 text-white transition-all duration-300 flex flex-col shadow-xl z-50",
      "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
      isCollapsed ? "-translate-x-full lg:w-25" : "translate-x-0 w-64"
    )}>
      <div className="p-4 border-b border-gray-700">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "lg:justify-center"
        )}>
          {isCollapsed ? (
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-sm font-bold shrink-0">
              🥋
            </div>
          ) : (
            <>
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-sm font-bold shrink-0">
                🥋
              </div>
              <span className="font-bold text-lg">CaratecaHub</span>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        <TooltipProvider delayDuration={0}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.id} disableHoverableContent={!isCollapsed}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 text-left",
                      isActive
                        ? "bg-red-600 text-white shadow-md"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={cn(
                      "whitespace-nowrap",
                      isCollapsed && "lg:hidden"
                    )}>
                      {item.label}
                    </span>
                  </button>
                </TooltipTrigger>
                {isCollapsed ? (
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center gap-3 w-full text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-3 rounded-lg"
        >
          {isCollapsed ? (
            <ChevronsRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
