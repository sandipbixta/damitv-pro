import { Fixture } from '@/hooks/useSportsDashboard';
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
import { Calendar, AlertCircle } from 'lucide-react';

interface FixturesTableProps {
  fixtures: Fixture[];
  loading: boolean;
  error: string | null;
}

export function FixturesTable({ fixtures, loading, error }: FixturesTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Fixtures (Next 24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : loading && fixtures.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No upcoming fixtures in the next 24 hours</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Competition</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead className="w-[120px]">Kickoff (AEDT)</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixtures.map((fixture, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {fixture.comp}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{fixture.teams}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {fixture.kickoff}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{fixture.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
