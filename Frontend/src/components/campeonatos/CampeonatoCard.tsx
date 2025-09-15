import React from 'react';
import { CalendarDays, Clock, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CampeonatoCardProps {
  nome: string;
  data: string;
  horario: string;
  local: string;
  associacaoOrganizadora: string;
  status: 'aberto' | 'em-andamento' | 'finalizado';
}

const CampeonatoCard = ({ nome, data, horario, local, associacaoOrganizadora, status }: CampeonatoCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'aberto':
        return 'bg-green-100 text-green-800';
      case 'em-andamento':
        return 'bg-blue-100 text-blue-800';
      case 'finalizado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'aberto':
        return 'Inscrições Abertas';
      case 'em-andamento':
        return 'Em Andamento';
      case 'finalizado':
        return 'Finalizado';
      default:
        return 'Indefinido';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {nome}
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm">{data}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{horario}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{local}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{associacaoOrganizadora}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampeonatoCard;
