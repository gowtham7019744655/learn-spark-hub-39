import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeStudentMarks } from '@/hooks/useRealtimeStudentMarks';
import { useRealtimeAssignments } from '@/hooks/useRealtimeAssignments';
import { useAttendance } from '@/hooks/useAttendance';
import { RootCauseAnalyzer } from '@/components/analysis/RootCauseAnalyzer';
import { ProgressDashboard } from '@/components/analysis/ProgressDashboard';
import { PerformancePredictor } from '@/components/analysis/PerformancePredictor';
import { MLAnalysisDashboard } from '@/components/analysis/MLAnalysisDashboard';
import { SkillInterestAnalysis } from '@/components/student/SkillInterestAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, Navigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  FileText,
  Calendar,
  Target,
  BarChart3,
  Brain,
  Activity,
  Loader2,
  GraduationCap,
  Mail,
  Hash,
  Layers,
  Compass,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const performanceData = [
  { month: 'Jan', score: 72 },
  { month: 'Feb', score: 78 },
  { month: 'Mar', score: 75 },
  { month: 'Apr', score: 82 },
  { month: 'May', score: 85 },
  { month: 'Jun', score: 88 },
];

const gradeToGradePoint: Record<string, number> = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0, 'Ab': 0,
};

const calculateSGPA = (marksData: any[]) => {
  if (marksData.length === 0) return 0;
  const totalCredits = marksData.length;
  const totalGradePoints = marksData.reduce((acc, m) => {
    const gp = gradeToGradePoint[m.grade || ''] ?? 0;
    return acc + gp;
  }, 0);
  return totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;
};

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 14) return '1 week';
  return `${Math.ceil(diffDays / 7)} weeks`;
};

const StudentDashboard = () => {
  const { profile, role, isAuthenticated, user, loading: authLoading } = useAuth();
  const { marks, loading } = useRealtimeStudentMarks(profile?.usn || undefined);
  const { assignments } = useRealtimeAssignments();
  const { getSummaryByStudent, getOverallPercentage, loading: attendanceLoading } = useAttendance(profile?.usn || undefined);

  const attendanceSummary = getSummaryByStudent(profile?.usn || undefined);
  const overallAttendance = getOverallPercentage(profile?.usn || undefined);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || role !== 'student') {
    return <Navigate to="/login/student" replace />;
  }

  const totalInternal = marks.reduce((acc, m) => acc + m.internal_marks, 0);
  const totalExternal = marks.reduce((acc, m) => acc + m.external_marks, 0);
  const totalMarks = totalInternal + totalExternal;
  const maxTotal = marks.reduce((acc, m) => acc + (m.subjects?.max_internal || 50) + (m.subjects?.max_external || 100), 0);
  const avgPercentage = marks.length > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {profile?.full_name || profile?.email}
                  </h1>
                </div>
              </div>
              <p className="text-muted-foreground">
                Here's an overview of your academic progress
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {[
                { icon: Hash, label: 'USN', value: profile?.usn || 'N/A' },
                { icon: Mail, label: 'Email', value: profile?.email || user?.email },
                { icon: Layers, label: 'Semester', value: '6th Semester' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/30">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-foreground truncate max-w-[180px]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TrendingUp, label: 'SGPA (10-point)', value: calculateSGPA(marks), color: 'primary' },
            { icon: BookOpen, label: 'Subjects', value: marks.length, color: 'primary' },
            { icon: Clock, label: 'Pending Tasks', value: 12, color: 'primary' },
            { icon: UserCheck, label: 'Attendance', value: `${overallAttendance}%`, color: 'primary' },
            { icon: Award, label: 'Avg. Score', value: `${avgPercentage}%`, color: 'primary' },
          ].map((stat) => (
            <Card key={stat.label} className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <CardContent className="relative flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="prediction" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Brain className="h-4 w-4" />
              AI Prediction
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Target className="h-4 w-4" />
              Root-Cause
            </TabsTrigger>
            <TabsTrigger value="ml-analysis" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4" />
              ML Models
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Compass className="h-4 w-4" />
              Skills & Interests
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <UserCheck className="h-4 w-4" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Performance Chart */}
              <Card className="lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Performance Trend</CardTitle>
                      <CardDescription>Your average scores over the past months</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">Last 6 months</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px hsl(0 0% 0% / 0.1)',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          fill="url(#scoreGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Assignments */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming
                  </CardTitle>
                  <CardDescription>Assignments due soon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No assignments yet</p>
                    </div>
                  ) : (
                    assignments.slice(0, 5).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="group flex items-start justify-between rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{assignment.course_code}</p>
                        </div>
                        <Badge
                          variant={getRelativeTime(assignment.due_date) === 'Overdue' ? 'destructive' : 'outline'}
                          className="ml-2 shrink-0 text-xs"
                        >
                          {getRelativeTime(assignment.due_date)}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prediction">
            <PerformancePredictor />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressDashboard marks={marks} loading={loading} />
          </TabsContent>

          <TabsContent value="analysis">
            <RootCauseAnalyzer marks={marks} loading={loading} />
          </TabsContent>

          <TabsContent value="ml-analysis">
            <MLAnalysisDashboard />
          </TabsContent>

          <TabsContent value="skills">
            <SkillInterestAnalysis marks={marks} />
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserCheck className="h-5 w-5 text-primary" />
                      Attendance Overview
                    </CardTitle>
                    <CardDescription>Your attendance across all subjects</CardDescription>
                  </div>
                  <Badge variant={overallAttendance >= 75 ? 'default' : 'destructive'}>
                    Overall: {overallAttendance}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : attendanceSummary.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <UserCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No attendance records yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attendanceSummary.map((s) => (
                      <div key={s.subject_id} className="rounded-xl border border-border p-4 transition-all hover:shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-foreground">{s.subject_name}</p>
                          <Badge variant={s.percentage >= 75 ? 'default' : s.percentage >= 60 ? 'secondary' : 'destructive'}>
                            {s.percentage}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Total: {s.total_classes}</span>
                          <span className="text-green-600">Present: {s.present}</span>
                          <span className="text-red-600">Absent: {s.absent}</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${s.percentage >= 75 ? 'bg-primary' : s.percentage >= 60 ? 'bg-yellow-500' : 'bg-destructive'}`}
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Subject Marks Table */}
        <Card className="mt-8 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Subject-wise Marks</CardTitle>
                <CardDescription>Detailed marks for all subjects in current semester</CardDescription>
              </div>
              <Badge variant="outline">{marks.length} subjects</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : marks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No marks available yet.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Contact your lecturer to add marks.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internal</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">External</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {marks.map((mark) => (
                      <tr key={mark.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3.5 font-medium text-foreground">{mark.subjects?.name || 'Unknown'}</td>
                        <td className="px-4 py-3.5 text-center text-foreground">
                          {mark.internal_marks} / {mark.subjects?.max_internal || 50}
                        </td>
                        <td className="px-4 py-3.5 text-center text-foreground">
                          {mark.external_marks} / {mark.subjects?.max_external || 100}
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-foreground">
                          {mark.internal_marks + mark.external_marks}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant={mark.grade?.startsWith('A') || mark.grade === 'O' ? 'default' : 'secondary'}>
                            {mark.grade || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-foreground">
                          {gradeToGradePoint[mark.grade || ''] ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-primary/5 font-semibold">
                      <td className="px-4 py-3.5 text-foreground">Total / SGPA</td>
                      <td className="px-4 py-3.5 text-center text-foreground">{totalInternal}</td>
                      <td className="px-4 py-3.5 text-center text-foreground">{totalExternal}</td>
                      <td className="px-4 py-3.5 text-center text-foreground">{totalMarks}</td>
                      <td className="px-4 py-3.5 text-center"><Badge>{avgPercentage}%</Badge></td>
                      <td className="px-4 py-3.5 text-center"><Badge variant="default">{calculateSGPA(marks)}</Badge></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/tests">
            <Button size="lg" className="gap-2 shadow-sm">
              <FileText className="h-4 w-4" />
              Take a Test
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
