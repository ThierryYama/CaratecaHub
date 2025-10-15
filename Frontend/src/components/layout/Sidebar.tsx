import React, { useMemo, useLayoutEffect, useState } from 'react';
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
  XCircle,
  GitBranch,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useQuery } from '@tanstack/react-query';
import { fetchEtapas } from '@/services/api';

interface SidebarProps {
  onItemClick?: (item: string) => void;
}

interface MenuItemBase {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  children?: MenuItemBase[];
}

const baseItems: MenuItemBase[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'campeonatos', label: 'Campeonatos', icon: CalendarDays, path: '/campeonatos' },
  { id: 'categorias', label: 'Categorias', icon: List, path: '/categorias' },
  { id: 'atletas', label: 'Atletas', icon: UserRound, path: '/atletas' },
  { id: 'equipes', label: 'Equipes', icon: Users, path: '/equipes' },
];

import { useSidebar } from '@/context/SidebarContext';

const SidebarComponent = ({ onItemClick }: SidebarProps) => {
  const { isCollapsed, toggle, setCollapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const routeRegex = /\/meu-campeonato\/(\d+)/;
  const execMatch = routeRegex.exec(location.pathname);
  const routeCampeonatoId = execMatch ? execMatch[1] : undefined;

  const [persistedCampeonatoId, setPersistedCampeonatoId] = useState<string | undefined>(() => {
    return routeCampeonatoId ?? localStorage.getItem('currentCampeonatoId') ?? undefined;
  });

  useLayoutEffect(() => {
    if (routeCampeonatoId && routeCampeonatoId !== persistedCampeonatoId) {
      localStorage.setItem('currentCampeonatoId', routeCampeonatoId);
      setPersistedCampeonatoId(routeCampeonatoId);
    }
  }, [routeCampeonatoId, persistedCampeonatoId]);

  const clearContext = () => {
    localStorage.removeItem('currentCampeonatoId');
    setPersistedCampeonatoId(undefined);
  };

  const effectiveCampeonatoId = routeCampeonatoId || persistedCampeonatoId;
  const { data: etapasStatus } = useQuery({
    queryKey: ['etapas', effectiveCampeonatoId],
    queryFn: () => (effectiveCampeonatoId ? fetchEtapas(Number(effectiveCampeonatoId)) : Promise.resolve(undefined)),
    enabled: !!effectiveCampeonatoId,
    staleTime: 0,
  });

  const contextualItems = useMemo(() => {
    const effectiveId = routeCampeonatoId || persistedCampeonatoId;
    if (!effectiveId) return baseItems;
    const contexto: MenuItemBase = {
      id: 'meu-campeonato',
      label: 'Meu Campeonato',
      icon: Crown,
      path: `/meu-campeonato/${effectiveId}`,
      children: [
        { id: 'inscricoes', label: 'Inscrições', icon: UserPlus, path: `/meu-campeonato/${effectiveId}/inscricoes` },
        { id: 'modalidades', label: 'Categorias', icon: Link, path: `/meu-campeonato/${effectiveId}/modalidades` },
        { id: 'chaveamentos', label: 'Chaveamentos', icon: GitBranch, path: `/meu-campeonato/${effectiveId}/chaveamentos` },
        { id: 'historico', label: 'Histórico', icon: Trophy, path: `/meu-campeonato/${effectiveId}/historico` },
        { id: 'resultados', label: 'Resultados', icon: Medal, path: `/meu-campeonato/${effectiveId}/resultados` },
        { id: 'sair-contexto', label: 'Sair', icon: XCircle, path: '#' },
      ]
    };
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'campeonatos', label: 'Campeonatos', icon: CalendarDays, path: '/campeonatos' },
      contexto,
      { id: 'categorias', label: 'Categorias', icon: List, path: '/categorias' },
      { id: 'atletas', label: 'Atletas', icon: UserRound, path: '/atletas' },
      { id: 'equipes', label: 'Equipes', icon: Users, path: '/equipes' },
    ];
  }, [routeCampeonatoId, persistedCampeonatoId]);

  const handleItemClick = (item: MenuItemBase) => {
    if (item.id === 'sair-contexto') {
      clearContext();
      navigate('/campeonatos');
      return;
    }
    if (item.path.startsWith('/meu-campeonato/')) {
      const match = /\/meu-campeonato\/(\d+)/.exec(item.path);
      if (match) {
        localStorage.setItem('currentCampeonatoId', match[1]);
        setPersistedCampeonatoId(match[1]);
      }
    }
    onItemClick?.(item.id);
    if (item.path !== '#') navigate(item.path);
    if (window.innerWidth < 1024) setCollapsed(true);
  };

  const renderItem = (item: MenuItemBase) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.children?.some(ch => location.pathname.startsWith(ch.path)) ?? false);
    const hasChildren = !!item.children?.length;
    return (
      <div key={item.id} className="space-y-1">
        <Tooltip disableHoverableContent={!isCollapsed}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleItemClick(item)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 text-left',
                isActive ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn('whitespace-nowrap', isCollapsed && 'hidden')}>{item.label}</span>
            </button>
          </TooltipTrigger>
          {isCollapsed ? <TooltipContent side="right"><p>{item.label}</p></TooltipContent> : null}
        </Tooltip>
        {hasChildren && !isCollapsed && (
          <div className="ml-4 border-l border-gray-700 pl-3 space-y-1">
            {item.children?.map(child => {
              const ChildIcon = child.icon;
              const childActive = location.pathname === child.path;
              let childStyle: string;
              const disabledChild = (child.id === 'inscricoes' && !!etapasStatus?.inscricoesConfirmadas)
                || (child.id === 'modalidades' && !!etapasStatus?.categoriasConfirmadas)
                || (child.id === 'chaveamentos' && !!etapasStatus?.chaveamentoGerado);
              if (child.id === 'sair-contexto') {
                childStyle = 'text-gray-500 hover:bg-gray-800 hover:text-white';
              } else if (childActive) {
                childStyle = 'bg-gray-800 text-white';
              } else {
                childStyle = cn('text-gray-400 hover:bg-gray-800 hover:text-white', disabledChild && 'opacity-60 cursor-not-allowed pointer-events-none');
              }
              let childTitle: string | undefined = undefined;
              if (disabledChild) {
                if (child.id === 'inscricoes') childTitle = 'Inscrições já confirmadas';
                else if (child.id === 'modalidades') childTitle = 'Categorias já confirmadas';
                else if (child.id === 'chaveamentos') childTitle = 'Campeões já definidos';
              }
              return (
                <button
                  key={child.id}
                  onClick={() => handleItemClick(child)}
                  className={cn('w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm transition-colors', childStyle)}
                  title={childTitle}
                >
                  <ChildIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={cn(
      "bg-gray-900 text-white motion-safe:transition-[width] motion-reduce:transition-none duration-300 flex flex-col shadow-xl z-50",
      "fixed inset-y-0 left-0 lg:relative",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-700">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
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
              <span className="font-bold text-lg truncate">CaratecaHub</span>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 pb-0 flex flex-col space-y-2 overflow-y-auto overflow-x-hidden min-h-0">
        <TooltipProvider delayDuration={0}>
          {contextualItems.map(renderItem)}
        </TooltipProvider>
        <div className="mt-auto sticky bottom-0 left-0 right-0 bg-gray-900 pt-4 pb-4 border-t border-gray-700">
          <button
            onClick={toggle}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'flex items-center justify-center w-full text-gray-300 hover:bg-gray-800 hover:text-white px-3 py-3 rounded-lg transition-colors',
              !isCollapsed && 'gap-3'
            )}
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
      </nav>
    </aside>
  );
};

const Sidebar = React.memo(SidebarComponent);

export default Sidebar;
