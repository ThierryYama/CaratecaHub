
import React from 'react';
import { Trophy, Users, Medal, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type BracketParticipant = {
  idInscricao: number | null;
  nome: string;
  detalhe?: string;
  associacao?: string;
  isBye?: boolean;
};

export interface BracketMatch {
  id: number;
  round: number;
  position: number;
  resultado: string | null;
  vencedorSlot: 1 | 2 | null;
  participants: [BracketParticipant, BracketParticipant];
}

export interface BracketRound {
  round: number;
  matches: BracketMatch[];
}

export type BracketType = 'ATLETA' | 'EQUIPE';

export interface NormalizedBracket {
  type: BracketType;
  rounds: BracketRound[];
  totalParticipants: number;
  champion?: BracketParticipant | null;
}

interface ChaveamentoBracketProps {
  titulo: string;
  modalidade: string;
  bracket: NormalizedBracket | null;
  loading?: boolean;
  emptyMessage?: string;
  onAdvance?: (match: BracketMatch, vencedor: 1 | 2) => void;
  advancingMatchId?: number | null;
}

const roundLabel = (round: number, totalRounds: number) => {
  const distanceFromEnd = totalRounds - round;
  if (distanceFromEnd === 0) return 'Final';
  if (distanceFromEnd === 1) return 'Semifinal';
  if (distanceFromEnd === 2) return 'Quartas';
  if (distanceFromEnd === 3) return 'Oitavas';
  return `${round}ª rodada`;
};

const ChaveamentoBracket: React.FC<ChaveamentoBracketProps> = ({
  titulo,
  modalidade,
  bracket,
  loading = false,
  emptyMessage = 'Nenhum chaveamento disponível para esta categoria.',
  onAdvance,
  advancingMatchId = null,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (!bracket || bracket.rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Trophy className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const totalRounds = bracket.rounds.length;
  const participantCount = bracket.totalParticipants;
  const champion = bracket.champion;
  const championParticipantId = champion?.idInscricao ?? null;
  const championName = champion?.nome;

  const renderParticipant = (
    participant: BracketParticipant,
    {
      highlight,
      match,
      slot,
      canAdvance,
      isAdvancing,
    }: {
      highlight: boolean;
      match: BracketMatch;
      slot: 1 | 2;
      canAdvance: boolean;
      isAdvancing: boolean;
    },
  ) => {
    const baseClasses = ['rounded-md border p-2 text-xs md:text-sm text-left transition-colors'];
    if (highlight) {
      baseClasses.push('border-green-500 bg-green-50 text-green-700');
    } else if (participant.isBye) {
      baseClasses.push('border-dashed border-gray-300 bg-gray-50 text-gray-400');
    } else {
      baseClasses.push('border-gray-200 bg-white text-gray-700');
    }

    const isChampion = championParticipantId !== null && championParticipantId !== undefined
      ? participant.idInscricao === championParticipantId
      : !!championName && participant.nome === championName;

    const content = (
      <div className={cn(baseClasses)}>
        <div className="flex items-center gap-2">
          {isChampion && <Trophy className="h-3 w-3 text-amber-500" aria-hidden="true" />}
          <div className="font-medium truncate" title={participant.nome}>
            {participant.nome}
          </div>
        </div>
        {(participant.detalhe || participant.associacao) && (
          <div className="text-[11px] text-gray-500 truncate space-y-0.5">
            {participant.detalhe && (
              <div title={participant.detalhe}>{participant.detalhe}</div>
            )}
            {participant.associacao && (
              <div className="flex items-center gap-1" title={participant.associacao}>
                <Building2 className="h-2.5 w-2.5" />
                <span>{participant.associacao}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );

    if (!canAdvance || !onAdvance || !participant.idInscricao || participant.isBye) {
      return content;
    }

    return (
      <button
        type="button"
        onClick={() => onAdvance(match, slot)}
        disabled={isAdvancing}
        className={cn(
          'text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-300 rounded-md transition',
          isAdvancing && 'cursor-progress opacity-70',
        )}
        aria-label={`Avançar ${participant.nome}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 flex-wrap">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{participantCount} participantes</span>
          </div>
          <Badge variant="outline">{modalidade}</Badge>
          <Badge variant="secondary">
            {bracket.type === 'ATLETA' ? 'Disputa Individual' : 'Disputa por Equipe'}
          </Badge>
        </div>
      </div>

      {champion && (
        <Card className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-amber-200">
          <CardContent className="py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                <Medal className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-amber-600 font-semibold">Campeão</p>
                <p className="text-lg font-semibold text-amber-800">{champion.nome}</p>
                {champion.detalhe && (
                  <p className="text-sm text-amber-700">{champion.detalhe}</p>
                )}
              </div>
            </div>
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white px-3 py-1">
              <Trophy className="h-4 w-4 mr-1" />
              Campeão Geral
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <div className="flex items-start gap-6 min-w-full">
          {bracket.rounds.map((round, idx) => {
            const label = roundLabel(round.round, totalRounds);
            return (
              <div key={round.round} className="flex flex-col items-stretch min-w-[240px] gap-4">
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                    {label}
                  </h4>
                  <div className="text-xs text-gray-500">{round.matches.length} partidas</div>
                </div>
                <div className={cn('flex-1 flex flex-col justify-evenly gap-6 py-2', idx === 0 ? 'pt-0' : 'pt-10')}>
                  {round.matches.map((match) => {
                    const [p1, p2] = match.participants;
                    const vencedorSlot = match.vencedorSlot;
                    const canAdvance = Boolean(
                      onAdvance &&
                      !match.resultado &&
                      match.participants.every((participant) => participant.idInscricao && !participant.isBye),
                    );
                    const isAdvancing = advancingMatchId === match.id;
                    return (
                      <Card key={match.id} className="shadow-sm border-gray-200">
                        <CardContent className="p-3 space-y-3">
                          {renderParticipant(p1, {
                            highlight: vencedorSlot === 1,
                            match,
                            slot: 1,
                            canAdvance,
                            isAdvancing,
                          })}
                          <div className="text-center text-[11px] text-gray-400 uppercase tracking-wide">vs</div>
                          {renderParticipant(p2, {
                            highlight: vencedorSlot === 2,
                            match,
                            slot: 2,
                            canAdvance,
                            isAdvancing,
                          })}
                          {canAdvance && (
                            <div className="text-center text-[11px] text-blue-600 font-medium">
                              {isAdvancing ? (
                                <span className="inline-flex items-center gap-1 justify-center">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Atualizando…
                                </span>
                              ) : (
                                'Clique em um competidor para avançar'
                              )}
                            </div>
                          )}
                          {match.resultado && match.resultado.startsWith('VENCEDOR') && (
                            <div className="text-center">
                              <Badge variant="outline" className="text-[11px]">
                                <Trophy className="h-3 w-3 mr-1" />
                                Vencedor {vencedorSlot}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t text-xs text-gray-500 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 rounded-sm bg-green-100 border border-green-400" />
          <span>Vencedor da partida</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 rounded-sm bg-white border border-gray-300" />
          <span>Competidor ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 rounded-sm bg-gray-100 border border-dashed border-gray-300" />
          <span>Bye / Aguardando adversário</span>
        </div>
      </div>
    </div>
  );
};

export default ChaveamentoBracket;
