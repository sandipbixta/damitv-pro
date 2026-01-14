import { LiveMatch } from '@/hooks/useSportsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, AlertCircle } from 'lucide-react';

interface LiveScoresTableProps {
  matches: LiveMatch[];
  loading: boolean;
  error: string | null;
}

export function LiveScoresTable({ matches, loading, error }: LiveScoresTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-destructive animate-pulse" />
          Live Scores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : loading && matches.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No live matches at the moment</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Competition</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead className="w-[80px]">Time</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="hidden md:table-cell">Venue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match, index) => {
                const isLive = match.status === 'LIVE' || match.status.toLowerCase().includes('live');
                
                return (
                  <TableRow key={index} className={isLive ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {match.comp}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{match.match}</TableCell>
                    <TableCell className="font-bold text-primary">{match.score || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{match.time}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={isLive ? 'destructive' : 'secondary'}
                        className={isLive ? 'animate-pulse' : ''}
                      >
                        {match.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                      {match.venue || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
