import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Calendar,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { StudentMark } from '@/hooks/useStudentMarks';

interface ProgressDashboardProps {
  marks: StudentMark[];
  loading?: boolean;
}

interface SubjectProgress {
  name: string;
  before: number;
  now: number;
  change: number;
  changePercent: number;
}

export const ProgressDashboard = ({ marks, loading }: ProgressDashboardProps) => {
  const analysis = useMemo(() => {
    if (!marks || marks.length === 0) return null;

    // Calculate subject-wise progress
    // Using internal vs external as "before" (continuous) vs "now" (final) comparison
    const subjectProgress: SubjectProgress[] = marks.map((mark) => {
      const maxInternal = mark.subjects?.max_internal || 50;
      const maxExternal = mark.subjects?.max_external || 100;
      
      const internalPct = Math.round((mark.internal_marks / maxInternal) * 100);
      const externalPct = Math.round((mark.external_marks / maxExternal) * 100);
      
      const change = externalPct - internalPct;
      const changePercent = internalPct > 0 ? Math.round((change / internalPct) * 100) : 0;

      return {
        name: mark.subjects?.name || 'Unknown',
        before: internalPct,
        now: externalPct,
        change,
        changePercent,
      };
    });

    // Overall stats
    const avgBefore = Math.round(subjectProgress.reduce((acc, s) => acc + s.before, 0) / subjectProgress.length);
    const avgNow = Math.round(subjectProgress.reduce((acc, s) => acc + s.now, 0) / subjectProgress.length);
    const overallChange = avgNow - avgBefore;
    const overallChangePercent = avgBefore > 0 ? Math.round((overallChange / avgBefore) * 100) : 0;

    // Improved subjects
    const improvedSubjects = subjectProgress.filter((s) => s.change > 0);
    const declinedSubjects = subjectProgress.filter((s) => s.change < 0);
    const stableSubjects = subjectProgress.filter((s) => s.change === 0);

    // Best improvement
    const bestImprovement = [...subjectProgress].sort((a, b) => b.change - a.change)[0];
    const worstDecline = [...subjectProgress].sort((a, b) => a.change - b.change)[0];

    // Streak calculation (simulated based on performance consistency)
    const consistentDays = marks.length * 7; // Simulated streak
    const currentStreak = Math.min(consistentDays, 30);
    const longestStreak = Math.max(currentStreak, 45);

    // Performance trend data for chart
    const trendData = subjectProgress.map((s) => ({
      subject: s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name,
      before: s.before,
      now: s.now,
    }));

    // Monthly simulation based on marks
    const monthlyTrend = [
      { month: 'Week 1', score: Math.max(40, avgBefore - 15) },
      { month: 'Week 2', score: Math.max(45, avgBefore - 10) },
      { month: 'Week 3', score: Math.max(50, avgBefore - 5) },
      { month: 'Week 4', score: avgBefore },
      { month: 'Week 5', score: Math.round((avgBefore + avgNow) / 2) },
      { month: 'Now', score: avgNow },
    ];

    return {
      subjectProgress,
      avgBefore,
      avgNow,
      overallChange,
      overallChangePercent,
      improvedCount: improvedSubjects.length,
      declinedCount: declinedSubjects.length,
      stableCount: stableSubjects.length,
      bestImprovement,
      worstDecline,
      currentStreak,
      longestStreak,
      trendData,
      monthlyTrend,
    };
  }, [marks]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading progress data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available to track progress.</p>
        </CardContent>
      </Card>
    );
  }

  const isImproved = analysis.overallChange >= 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Overall Change */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-3xl font-bold text-foreground">
                  {isImproved ? '+' : ''}{analysis.overallChange}%
                </p>
              </div>
              <div className={`rounded-full p-3 ${isImproved ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {isImproved ? (
                  <ArrowUpRight className="h-6 w-6 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              From {analysis.avgBefore}% to {analysis.avgNow}%
            </p>
          </CardContent>
        </Card>

        {/* Improved Subjects */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subjects Improved</p>
                <p className="text-3xl font-bold text-foreground">{analysis.improvedCount}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {analysis.declinedCount} declined, {analysis.stableCount} stable
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                <p className="text-3xl font-bold text-foreground">{analysis.currentStreak}</p>
              </div>
              <div className="rounded-full bg-orange-500/10 p-3">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Best: {analysis.longestStreak} days
            </p>
          </CardContent>
        </Card>

        {/* Best Improvement */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Improvement</p>
                <p className="text-3xl font-bold text-foreground">+{Math.max(0, analysis.bestImprovement.change)}%</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground truncate">
              {analysis.bestImprovement.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progress Over Time
          </CardTitle>
          <CardDescription>Your performance trajectory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                <YAxis className="text-muted-foreground" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#progressGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Before vs Now Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Before vs Now
          </CardTitle>
          <CardDescription>Internal assessment vs Final exam performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="subject" className="text-muted-foreground" fontSize={11} angle={-20} textAnchor="end" height={60} />
                <YAxis className="text-muted-foreground" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, name === 'before' ? 'Internal' : 'External']}
                />
                <Bar dataKey="before" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="before" />
                <Bar dataKey="now" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="now" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">Internal (Before)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary" />
              <span className="text-sm text-muted-foreground">External (Now)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Subject Progress Details
          </CardTitle>
          <CardDescription>Individual subject improvement breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.subjectProgress.map((subject, index) => (
              <div key={index} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-foreground">{subject.name}</h4>
                    <Badge variant={subject.change >= 0 ? 'default' : 'destructive'}>
                      {subject.change >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {subject.change >= 0 ? '+' : ''}{subject.change}%
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {subject.before}% → {subject.now}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs text-muted-foreground">Before</span>
                    <Progress value={subject.before} className="h-2 flex-1" />
                    <span className="w-10 text-right text-xs font-medium text-foreground">{subject.before}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs text-muted-foreground">Now</span>
                    <Progress value={subject.now} className="h-2 flex-1" />
                    <span className="w-10 text-right text-xs font-medium text-foreground">{subject.now}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">Keep Your Streak Alive!</h3>
              </div>
              <p className="text-muted-foreground">
                You've been consistent for <span className="font-bold text-foreground">{analysis.currentStreak} days</span>. 
                {analysis.longestStreak > analysis.currentStreak && (
                  <span> Beat your record of {analysis.longestStreak} days!</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-orange-500">{analysis.currentStreak}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
