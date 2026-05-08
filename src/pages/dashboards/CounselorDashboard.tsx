import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigate } from 'react-router-dom';
import {
  HeartHandshake, Users, AlertTriangle, TrendingDown, TrendingUp,
  Loader2, ShieldAlert, Target, Brain, BarChart3, Calendar,
  BookOpen, Activity, UserCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CounselingRequestsTracker } from '@/components/counselor/CounselingRequestsTracker';

interface StudentRisk {
  usn: string;
  sgpa: number;
  subjectCount: number;
  failingSubjects: number;
  riskLevel: 'high' | 'medium' | 'low';
}

const RISK_COLORS = {
  high: 'hsl(0, 72%, 50%)',
  medium: 'hsl(38, 92%, 50%)',
  low: 'hsl(142, 71%, 45%)',
};

const CounselorDashboard = () => {
  const { profile, role, isAuthenticated, loading: authLoading } = useAuth();
  const [studentRisks, setStudentRisks] = useState<StudentRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const { getStudentAttendanceSummaries, loading: attendanceLoading } = useAttendance();

  const gradeToGP = (grade: string | null): number => {
    const map: Record<string, number> = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
    return map[grade || ''] ?? 0;
  };

  useEffect(() => {
    const fetchRiskData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_marks')
        .select('student_usn, grade, internal_marks, external_marks, subjects(name, max_internal, max_external)')
        .order('student_usn');

      if (!error && data) {
        const groups: Record<string, typeof data> = {};
        data.forEach(m => {
          if (!groups[m.student_usn]) groups[m.student_usn] = [];
          groups[m.student_usn].push(m);
        });

        const risks: StudentRisk[] = Object.entries(groups).map(([usn, marks]) => {
          const totalGP = marks.reduce((s, m) => s + gradeToGP(m.grade), 0);
          const sgpa = marks.length > 0 ? totalGP / marks.length : 0;
          const failingSubjects = marks.filter(m => m.grade === 'F' || m.grade === 'Ab').length;
          let riskLevel: 'high' | 'medium' | 'low' = 'low';
          if (sgpa < 4 || failingSubjects >= 2) riskLevel = 'high';
          else if (sgpa < 6 || failingSubjects >= 1) riskLevel = 'medium';
          return { usn, sgpa: Number(sgpa.toFixed(2)), subjectCount: marks.length, failingSubjects, riskLevel };
        }).sort((a, b) => a.sgpa - b.sgpa);

        setStudentRisks(risks);
      }
      setLoading(false);
    };

    if (isAuthenticated && role === 'counselor') fetchRiskData();
  }, [isAuthenticated, role]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || role !== 'counselor') {
    return <Navigate to="/login/counselor" replace />;
  }

  const highRisk = studentRisks.filter(s => s.riskLevel === 'high');
  const mediumRisk = studentRisks.filter(s => s.riskLevel === 'medium');
  const lowRisk = studentRisks.filter(s => s.riskLevel === 'low');

  const riskPieData = [
    { name: 'High Risk', value: highRisk.length, color: RISK_COLORS.high },
    { name: 'Medium Risk', value: mediumRisk.length, color: RISK_COLORS.medium },
    { name: 'Low Risk', value: lowRisk.length, color: RISK_COLORS.low },
  ];

  const sgpaDistribution = [
    { range: '0-2', count: studentRisks.filter(s => s.sgpa < 2).length },
    { range: '2-4', count: studentRisks.filter(s => s.sgpa >= 2 && s.sgpa < 4).length },
    { range: '4-6', count: studentRisks.filter(s => s.sgpa >= 4 && s.sgpa < 6).length },
    { range: '6-8', count: studentRisks.filter(s => s.sgpa >= 6 && s.sgpa < 8).length },
    { range: '8-10', count: studentRisks.filter(s => s.sgpa >= 8).length },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <HeartHandshake className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Counselor Dashboard</p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Welcome, {profile?.full_name || 'Counselor'}
                </h1>
                <p className="text-muted-foreground mt-1">Monitor student well-being and academic risk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Total Students', value: studentRisks.length },
            { icon: AlertTriangle, label: 'High Risk', value: highRisk.length },
            { icon: TrendingDown, label: 'Medium Risk', value: mediumRisk.length },
            { icon: TrendingUp, label: 'Low Risk', value: lowRisk.length },
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
        <Tabs defaultValue="risk-overview" className="space-y-6">
          <TabsList className="flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="risk-overview" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <ShieldAlert className="h-4 w-4" />
              Risk Overview
            </TabsTrigger>
            <TabsTrigger value="at-risk" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <AlertTriangle className="h-4 w-4" />
              At-Risk Students
            </TabsTrigger>
            <TabsTrigger value="intervention" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Target className="h-4 w-4" />
              Intervention Planning
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <HeartHandshake className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <CounselingRequestsTracker />
          </TabsContent>

          <TabsContent value="risk-overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Risk Distribution</CardTitle>
                  <CardDescription>Students categorized by academic risk level</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={riskPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {riskPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">SGPA Distribution</CardTitle>
                  <CardDescription>Number of students across SGPA ranges</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sgpaDistribution}>
                          <defs>
                            <linearGradient id="counselorBarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} />
                          <Bar dataKey="count" fill="url(#counselorBarGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="at-risk" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      At-Risk Students
                    </CardTitle>
                    <CardDescription>Students requiring immediate attention ({highRisk.length} high risk, {mediumRisk.length} medium risk)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : highRisk.length === 0 && mediumRisk.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No at-risk students detected. All students are performing well!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...highRisk, ...mediumRisk].map((student) => (
                      <div key={student.usn} className="group flex items-center justify-between rounded-xl border border-border p-4 transition-all hover:shadow-sm hover:border-primary/30">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{student.usn}</p>
                            <p className="text-xs text-muted-foreground">{student.subjectCount} subjects | {student.failingSubjects} failing</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">SGPA: {student.sgpa}</p>
                          </div>
                          <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {student.riskLevel === 'high' ? 'High Risk' : 'Medium Risk'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intervention" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule Counseling Sessions
                  </CardTitle>
                  <CardDescription>Plan one-on-one sessions with at-risk students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {highRisk.slice(0, 5).map(student => (
                      <div key={student.usn} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                        <div>
                          <p className="font-medium text-foreground">{student.usn}</p>
                          <p className="text-xs text-muted-foreground">SGPA: {student.sgpa} | {student.failingSubjects} failing</p>
                        </div>
                        <Button size="sm" variant="outline">Schedule</Button>
                      </div>
                    ))}
                    {highRisk.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No high-risk students to schedule</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-primary" />
                    Recommended Study Plans
                  </CardTitle>
                  <CardDescription>AI-generated intervention strategies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                      <h4 className="font-semibold text-foreground mb-2">Focus Area: Core Subjects</h4>
                      <p className="text-sm text-muted-foreground">Students with SGPA below 4.0 should prioritize core subjects with dedicated tutoring sessions 3x per week.</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                      <h4 className="font-semibold text-foreground mb-2">Skill Development Programs</h4>
                      <p className="text-sm text-muted-foreground">Recommend peer mentoring and study group formation for students in the medium-risk category.</p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                      <h4 className="font-semibold text-foreground mb-2">Career Path Guidance</h4>
                      <p className="text-sm text-muted-foreground">Connect at-risk students with career counselors to align academic goals with interests.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Behavioral Trend Analysis
                  </CardTitle>
                  <CardDescription>Track patterns in student performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="text-sm font-medium text-foreground">Dropout Risk Score</span>
                      <Badge variant="outline">Based on SGPA trends</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="text-sm font-medium text-foreground">Attendance Correlation</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
                      <span className="text-sm font-medium text-foreground">Improvement Tracking</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Weak Area Identification
                  </CardTitle>
                  <CardDescription>Subjects where students struggle the most</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {highRisk.length > 0
                          ? `${highRisk.length} students have failing grades in multiple subjects requiring immediate intervention.`
                          : 'No critical weak areas detected across the student body.'}
                      </p>
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                        <p className="text-sm font-medium text-foreground">Total students analyzed: {studentRisks.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Average SGPA: {studentRisks.length > 0 ? (studentRisks.reduce((s, r) => s + r.sgpa, 0) / studentRisks.length).toFixed(2) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Attendance Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Low Attendance Alerts
                </CardTitle>
                <CardDescription>Students with attendance below 75%</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <div className="space-y-3">
                    {getStudentAttendanceSummaries().filter(s => s.percentage < 75).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <UserCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground">No low-attendance students detected.</p>
                      </div>
                    ) : (
                      getStudentAttendanceSummaries().filter(s => s.percentage < 75).map((s) => (
                        <div key={s.usn} className="flex items-center justify-between rounded-xl border border-border p-4 transition-all hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{s.usn}</p>
                              <p className="text-xs text-muted-foreground">{s.present}/{s.totalClasses} classes attended</p>
                            </div>
                          </div>
                          <Badge variant={s.percentage < 50 ? 'destructive' : 'secondary'}>
                            {s.percentage}%
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CounselorDashboard;
