import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeStudentMarks } from '@/hooks/useRealtimeStudentMarks';
import { useRealtimeAssignments } from '@/hooks/useRealtimeAssignments';
import { RootCauseAnalyzer } from '@/components/analysis/RootCauseAnalyzer';
import { ProgressDashboard } from '@/components/analysis/ProgressDashboard';
import { PerformancePredictor } from '@/components/analysis/PerformancePredictor';
import { MLAnalysisDashboard } from '@/components/analysis/MLAnalysisDashboard';
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

// Indian grading system: Grade → Grade Point (10-point scale)
const gradeToGradePoint: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
  'Ab': 0,
};

// Calculate SGPA from marks (10-point scale, Indian standard)
const calculateSGPA = (marksData: any[]) => {
  if (marksData.length === 0) return 0;
  const totalCredits = marksData.length; // Each subject = 1 credit unit for simplicity
  const totalGradePoints = marksData.reduce((acc, m) => {
    const gp = gradeToGradePoint[m.grade || ''] ?? 0;
    return acc + gp;
  }, 0);
  return totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;
};

// Helper function to calculate relative time
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
  const { profile, role, isAuthenticated, user } = useAuth();
  const { marks, loading } = useRealtimeStudentMarks(profile?.usn || undefined);
  const { assignments } = useRealtimeAssignments();
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
        {/* Student Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{profile?.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">USN</p>
                <p className="font-semibold text-foreground">{profile?.usn || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold text-foreground">{profile?.email || user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="font-semibold text-foreground">6th Semester</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name || profile?.email}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your academic progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{calculateSGPA(marks)}</p>
                <p className="text-sm text-muted-foreground">SGPA (10-point)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{marks.length}</p>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgPercentage}%</p>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prediction" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Prediction
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Root-Cause
            </TabsTrigger>
            <TabsTrigger value="ml-analysis" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ML Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Performance Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Your average scores over the past months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-muted-foreground" />
                        <YAxis className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.2)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming
                  </CardTitle>
                  <CardDescription>Assignments due soon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No assignments yet</p>
                  ) : (
                    assignments.slice(0, 5).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-foreground">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.course_code}</p>
                        </div>
                        <Badge variant="outline">{getRelativeTime(assignment.due_date)}</Badge>
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
        </Tabs>

        {/* Subject Marks Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Subject-wise Marks</CardTitle>
            <CardDescription>Detailed marks for all subjects in current semester</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading marks...</p>
            ) : marks.length === 0 ? (
              <p className="text-muted-foreground">No marks available yet. Contact your lecturer to add marks.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Subject</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Internal</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">External</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Grade</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((mark) => (
                      <tr key={mark.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{mark.subjects?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {mark.internal_marks} / {mark.subjects?.max_internal || 50}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {mark.external_marks} / {mark.subjects?.max_external || 100}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-foreground">
                          {mark.internal_marks + mark.external_marks}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={mark.grade?.startsWith('A') || mark.grade === 'O' ? 'default' : 'secondary'}>
                            {mark.grade || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-foreground">
                          {gradeToGradePoint[mark.grade || ''] ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td className="px-4 py-3 font-semibold text-foreground">Total / SGPA</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">
                        {totalInternal}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">
                        {totalExternal}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">
                        {totalMarks}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge>{avgPercentage}%</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="default">{calculateSGPA(marks)}</Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/tests">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Take a Test
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
