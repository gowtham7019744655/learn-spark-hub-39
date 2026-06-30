import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Loader2, Crown } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

interface LeaderboardEntry {
  student_usn: string;
  score: number;
  full_name: string | null;
  completed_at: string | null;
}

interface TestOption {
  id: string;
  title: string;
}

interface TestLeaderboardProps {
  tests: TestOption[];
  currentUsn?: string;
}

export const TestLeaderboard = ({ tests, currentUsn }: TestLeaderboardProps) => {
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTestId) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_test_leaderboard', { p_test_id: selectedTestId, p_limit: 20 });

      if (error) {
        logError('fetchLeaderboard', error);
        setEntries([]);
        setLoading(false);
        return;
      }

      const merged: LeaderboardEntry[] = (data || []).map((d: any) => ({
        student_usn: d.student_usn,
        score: d.score!,
        full_name: d.full_name,
        completed_at: d.completed_at,
      }));

      setEntries(merged);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [selectedTestId]);

  const publishedTests = tests.filter(t => t.id);

  if (publishedTests.length === 0) {
    return null;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-primary/10 border-primary/30';
    if (rank === 1) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900';
    if (rank === 2) return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800';
    if (rank === 3) return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900';
    return 'bg-background border-border';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Leaderboard
          </CardTitle>
          <Select value={selectedTestId} onValueChange={setSelectedTestId}>
            <SelectTrigger className="w-full sm:w-[250px] h-9">
              <SelectValue placeholder="Select a test" />
            </SelectTrigger>
            <SelectContent>
              {publishedTests.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No scores yet for this test</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isCurrentUser = currentUsn === entry.student_usn;
              return (
                <div
                  key={entry.student_usn}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${getRankBg(rank, isCurrentUser)}`}
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
                    <p className="text-xs text-muted-foreground">{entry.student_usn}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${
                      entry.score >= 80 ? 'text-green-600' : entry.score >= 60 ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {entry.score}%
                    </p>
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
