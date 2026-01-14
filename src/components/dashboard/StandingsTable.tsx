import { Standing } from '@/hooks/useSportsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, AlertCircle } from 'lucide-react';

interface StandingsTableProps {
  standings: Standing[];
  loading: boolean;
  error: string | null;
}

export function StandingsTable({ standings, loading, error }: StandingsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          A-League Standings (Top 8)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : loading && standings.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : standings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Standings data unavailable</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-[50px] text-center">Pld</TableHead>
                <TableHead className="w-[40px] text-center">W</TableHead>
                <TableHead className="w-[40px] text-center">D</TableHead>
                <TableHead className="w-[40px] text-center">L</TableHead>
                <TableHead className="w-[50px] text-center hidden sm:table-cell">GF</TableHead>
                <TableHead className="w-[50px] text-center hidden sm:table-cell">GA</TableHead>
                <TableHead className="w-[60px] text-center font-bold">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((team) => (
                <TableRow 
                  key={team.pos}
                  className={team.pos <= 3 ? 'bg-primary/5' : team.pos <= 6 ? 'bg-muted/30' : ''}
                >
                  <TableCell className="text-center font-bold">
                    {team.pos <= 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                        {team.pos}
                      </span>
                    ) : (
                      team.pos
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{team.team}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{team.pld}</TableCell>
                  <TableCell className="text-center text-green-600 dark:text-green-400">{team.w}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{team.d}</TableCell>
                  <TableCell className="text-center text-destructive">{team.l}</TableCell>
                  <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{team.gf}</TableCell>
                  <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{team.ga}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{team.pts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
