import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Crown, Medal, Award, Loader2 } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

interface CumulativeEntry {
  student_usn: string;
  full_name: string | null;
  totalScore: number;
  testsCompleted: number;
  avgScore: number;
}

interface OverallLeaderboardProps {
  currentUsn?: string;
}

export const OverallLeaderboard = ({ currentUsn }: OverallLeaderboardProps) => {
  const [entries, setEntries] = useState<CumulativeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCumulative = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('get_overall_leaderboard', { p_limit: 25 });

      if (error) {
        logError('fetchOverallLeaderboard', error);
        setLoading(false);
        return;
      }

      const result: CumulativeEntry[] = (data || []).map((row: any) => ({
        student_usn: row.student_usn,
        full_name: row.full_name,
        totalScore: Number(row.total_score) || 0,
        testsCompleted: Number(row.tests_completed) || 0,
        avgScore: Number(row.avg_score) || 0,
      }));

      setEntries(result);
      setLoading(false);
    };

    fetchCumulative();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-primary/10';
    if (rank === 1) return 'bg-yellow-50 dark:bg-yellow-950/20';
    if (rank === 2) return 'bg-gray-50 dark:bg-gray-950/20';
    if (rank === 3) return 'bg-amber-50 dark:bg-amber-950/20';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Overall Leaderboard
        </CardTitle>
        <CardDescription>Cumulative rankings across all tests</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No completed tests yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isCurrentUser = currentUsn === entry.student_usn;
              return (
                <div
                  key={entry.student_usn}
                  className={`flex items-center gap-3 rounded-xl border border-border p-3 transition-all ${getRankBg(rank, isCurrentUser)}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {getRankIcon(rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {entry.full_name || entry.student_usn}
                      </p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs shrink-0">You</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.student_usn} · {entry.testsCompleted} test{entry.testsCompleted !== 1 ? 's' : ''} · Avg {entry.avgScore}%
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-foreground">{entry.totalScore}%</p>
                    <p className="text-xs text-muted-foreground">cumulative</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
