import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeAssignments } from '@/hooks/useRealtimeAssignments';
import { useTests } from '@/hooks/useTests';
import { useSubjects } from '@/hooks/useSubjects';
import { useAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Link, Navigate } from 'react-router-dom';
import {
  Users, BookOpen, FileText, TrendingUp, Clock, PlusCircle, Trash2,
  Calendar, ClipboardCheck, Loader2, LayoutDashboard, UserCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const classPerformance = [
  { class: 'CS101', avg: 85 },
  { class: 'CS201', avg: 78 },
  { class: 'CS301', avg: 82 },
  { class: 'CS401', avg: 90 },
];

const courses = [
  { name: 'Introduction to Programming', code: 'CS101', students: 45, progress: 65 },
  { name: 'Data Structures', code: 'CS201', students: 38, progress: 78 },
  { name: 'Algorithms', code: 'CS301', students: 32, progress: 55 },
  { name: 'Software Engineering', code: 'CS401', students: 28, progress: 82 },
];

const LecturerDashboard = () => {
  const { profile, role, isAuthenticated, user, loading: authLoading } = useAuth();
  const { assignments, loading: assignmentsLoading, addAssignment, deleteAssignment } = useRealtimeAssignments();
  const { tests, loading: testsLoading, addTest, deleteTest, updateTest } = useTests();
  const { subjects } = useSubjects();
  const { markAttendance, getStudentAttendanceSummaries, loading: attendanceLoading } = useAttendance();

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceUsns, setAttendanceUsns] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');

  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', course_code: '', due_date: '',
  });
  const [newTest, setNewTest] = useState({
    title: '', description: '', subject_id: '', duration_minutes: 60,
    total_questions: 10, max_score: 100, due_date: '',
  });

  interface AllStudentMark {
    id: string;
    student_usn: string;
    subject_id: string;
    internal_marks: number;
    external_marks: number;
    grade: string | null;
    subjects?: { id: string; name: string; max_internal: number; max_external: number } | null;
  }

  const [allStudentMarks, setAllStudentMarks] = useState<AllStudentMark[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);

  const gradeToGradePoint = (grade: string | null): number => {
    const map: Record<string, number> = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
    return map[grade || ''] ?? 0;
  };

  useEffect(() => {
    const fetchAllMarks = async () => {
      setMarksLoading(true);
      const { data, error } = await supabase
        .from('student_marks')
        .select('*, subjects(id, name, max_internal, max_external)')
        .order('student_usn');
      if (!error && data) setAllStudentMarks(data);
      setMarksLoading(false);
    };
    if (isAuthenticated && role === 'lecturer') fetchAllMarks();
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

  if (!isAuthenticated || role !== 'lecturer') {
    return <Navigate to="/login/lecturer" replace />;
  }

  const studentGroups = allStudentMarks.reduce<Record<string, AllStudentMark[]>>((acc, mark) => {
    if (!acc[mark.student_usn]) acc[mark.student_usn] = [];
    acc[mark.student_usn].push(mark);
    return acc;
  }, {});

  const studentSummaries = Object.entries(studentGroups).map(([usn, marks]) => {
    const totalGP = marks.reduce((sum, m) => sum + gradeToGradePoint(m.grade), 0);
    const sgpa = marks.length > 0 ? (totalGP / marks.length).toFixed(2) : '0.00';
    const totalInternal = marks.reduce((sum, m) => sum + m.internal_marks, 0);
    const totalExternal = marks.reduce((sum, m) => sum + m.external_marks, 0);
    return { usn, marks, sgpa: parseFloat(sgpa), totalInternal, totalExternal, subjectCount: marks.length };
  }).sort((a, b) => b.sgpa - a.sgpa);

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.course_code || !newAssignment.due_date) return;
    const success = await addAssignment({
      ...newAssignment,
      created_by: profile?.full_name || profile?.email || 'Unknown',
    });
    if (success) {
      setIsAssignmentDialogOpen(false);
      setNewAssignment({ title: '', description: '', course_code: '', due_date: '' });
    }
  };

  const handleCreateTest = async () => {
    if (!newTest.title || !newTest.due_date) return;
    const success = await addTest({
      title: newTest.title,
      description: newTest.description || null,
      subject_id: newTest.subject_id || null,
      duration_minutes: newTest.duration_minutes,
      total_questions: newTest.total_questions,
      max_score: newTest.max_score,
      due_date: newTest.due_date,
      created_by: user?.id || '',
      status: 'draft',
    });
    if (success) {
      setIsTestDialogOpen(false);
      setNewTest({ title: '', description: '', subject_id: '', duration_minutes: 60, total_questions: 10, max_score: 100, due_date: '' });
    }
  };

  const handlePublishTest = async (testId: string) => { await updateTest(testId, { status: 'published' }); };
  const handleDeleteAssignment = async (id: string) => { await deleteAssignment(id); };
  const handleDeleteTest = async (id: string) => { await deleteTest(id); };

  const myTests = tests.filter(t => t.created_by === user?.id);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <LayoutDashboard className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lecturer Dashboard</p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Welcome, Prof. {profile?.full_name || profile?.email}
                </h1>
                <p className="text-muted-foreground mt-1">Manage your courses, students, and assessments</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                    Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>Add a new assignment for your students. They'll see it instantly!</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} placeholder="Assignment title" className="h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} placeholder="Assignment description (optional)" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="course">Course</Label>
                      <Select value={newAssignment.course_code} onValueChange={(value) => setNewAssignment({ ...newAssignment, course_code: value })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select a course" /></SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.code} value={course.code}>{course.code} - {course.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input id="due_date" type="datetime-local" value={newAssignment.due_date} onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })} className="h-11" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateAssignment} disabled={!newAssignment.title || !newAssignment.course_code || !newAssignment.due_date}>Create Assignment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                    Create Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Test</DialogTitle>
                    <DialogDescription>Create a test for your students. Publish when ready!</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="test-title">Title</Label>
                      <Input id="test-title" value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} placeholder="Test title" className="h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="test-description">Description</Label>
                      <Textarea id="test-description" value={newTest.description} onChange={(e) => setNewTest({ ...newTest, description: e.target.value })} placeholder="Test description (optional)" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="test-subject">Subject</Label>
                      <Select value={newTest.subject_id} onValueChange={(value) => setNewTest({ ...newTest, subject_id: value })}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (min)</Label>
                        <Input id="duration" type="number" value={newTest.duration_minutes} onChange={(e) => setNewTest({ ...newTest, duration_minutes: parseInt(e.target.value) || 60 })} className="h-11" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="questions">Questions</Label>
                        <Input id="questions" type="number" value={newTest.total_questions} onChange={(e) => setNewTest({ ...newTest, total_questions: parseInt(e.target.value) || 10 })} className="h-11" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="max-score">Max Score</Label>
                        <Input id="max-score" type="number" value={newTest.max_score} onChange={(e) => setNewTest({ ...newTest, max_score: parseInt(e.target.value) || 100 })} className="h-11" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="test-due-date">Due Date</Label>
                      <Input id="test-due-date" type="datetime-local" value={newTest.due_date} onChange={(e) => setNewTest({ ...newTest, due_date: e.target.value })} className="h-11" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTest} disabled={!newTest.title || !newTest.due_date}>Create Test</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Total Students', value: '143' },
            { icon: BookOpen, label: 'Subjects', value: subjects.length },
            { icon: Clock, label: 'Assignments', value: assignments.length },
            { icon: ClipboardCheck, label: 'Tests Created', value: myTests.length },
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
            <TabsTrigger value="student-marks" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Student Marks</TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Assignments</TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">Tests</TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <UserCheck className="h-4 w-4" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Class Performance Chart */}
              <Card className="lg:col-span-2 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Class Performance</CardTitle>
                      <CardDescription>Average scores across your courses</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">Current Semester</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classPerformance}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="class" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px hsl(0 0% 0% / 0.1)',
                          }}
                        />
                        <Bar dataKey="avg" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-start justify-between rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{assignment.course_code}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0 text-xs">Assignment</Badge>
                    </div>
                  ))}
                  {myTests.slice(0, 2).map((test) => (
                    <div key={test.id} className="flex items-start justify-between rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{test.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{test.subjects?.name || 'General'}</p>
                      </div>
                      <Badge variant={test.status === 'published' ? 'default' : 'secondary'} className="ml-2 shrink-0 text-xs">
                        {test.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Courses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">My Courses</CardTitle>
                    <CardDescription>Current semester course management</CardDescription>
                  </div>
                  <Badge variant="outline">{courses.length} courses</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {courses.map((course, index) => (
                    <div key={index} className="group rounded-xl border border-border p-5 transition-all hover:shadow-sm hover:border-primary/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{course.name}</p>
                          <p className="text-sm text-muted-foreground">{course.code}</p>
                        </div>
                        <Badge variant="secondary">{course.students} students</Badge>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {course.progress}% syllabus covered
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student-marks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-primary" />
                      All Student Marks
                    </CardTitle>
                    <CardDescription>View marks and SGPA for all students ({studentSummaries.length} students found)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {marksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : studentSummaries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No student marks found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentSummaries.map(({ usn, marks, sgpa, subjectCount }) => (
                      <div key={usn} className="rounded-xl border border-border p-5 transition-all hover:shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{usn}</p>
                              <p className="text-xs text-muted-foreground">{subjectCount} subjects</p>
                            </div>
                          </div>
                          <Badge variant={sgpa >= 8 ? 'default' : sgpa >= 5 ? 'secondary' : 'destructive'} className="text-sm px-3 py-1">
                            SGPA: {sgpa.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="text-xs uppercase tracking-wider">Subject</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider">Internal</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider">External</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider">Total</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider">Grade</TableHead>
                                <TableHead className="text-xs uppercase tracking-wider">GP</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {marks.map((mark) => (
                                <TableRow key={mark.id} className="hover:bg-muted/20">
                                  <TableCell className="font-medium">{mark.subjects?.name || 'Unknown'}</TableCell>
                                  <TableCell>{mark.internal_marks}/{mark.subjects?.max_internal || 50}</TableCell>
                                  <TableCell>{mark.external_marks}/{mark.subjects?.max_external || 100}</TableCell>
                                  <TableCell className="font-semibold">{mark.internal_marks + mark.external_marks}</TableCell>
                                  <TableCell><Badge variant="outline">{mark.grade || 'N/A'}</Badge></TableCell>
                                  <TableCell>{gradeToGradePoint(mark.grade)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                      Assignments
                    </CardTitle>
                    <CardDescription>Manage your course assignments - students see these in real-time!</CardDescription>
                  </div>
                  <Badge variant="outline">{assignments.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No assignments yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="group flex items-center justify-between rounded-xl border border-border p-4 transition-all hover:shadow-sm hover:border-primary/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{assignment.title}</p>
                            <Badge variant="secondary" className="text-xs">{assignment.course_code}</Badge>
                          </div>
                          {assignment.description && (
                            <p className="mt-1 text-sm text-muted-foreground truncate">{assignment.description}</p>
                          )}
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Due: {format(new Date(assignment.due_date), 'PPP p')}
                          </p>
                        </div>
                        <Button variant="destructive" size="icon" className="shrink-0 ml-3 opacity-70 hover:opacity-100" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Tests
                    </CardTitle>
                    <CardDescription>Create and manage tests - publish to make them available to students!</CardDescription>
                  </div>
                  <Badge variant="outline">{myTests.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {testsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : myTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No tests yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTests.map((test) => (
                      <div key={test.id} className="group rounded-xl border border-border p-4 transition-all hover:shadow-sm hover:border-primary/30">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground">{test.title}</p>
                              <Badge variant={test.status === 'published' ? 'default' : 'secondary'} className="text-xs">{test.status}</Badge>
                              {test.subjects && <Badge variant="outline" className="text-xs">{test.subjects.name}</Badge>}
                            </div>
                            {test.description && (
                              <p className="mt-1 text-sm text-muted-foreground truncate">{test.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{test.duration_minutes} min</span>
                              <span>{test.total_questions} questions</span>
                              <span>Max: {test.max_score} pts</span>
                              {test.due_date && <span>Due: {format(new Date(test.due_date), 'PPP')}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-3">
                            {test.status === 'draft' && (
                              <Button variant="outline" size="sm" className="shadow-sm" onClick={() => handlePublishTest(test.id)}>Publish</Button>
                            )}
                            <Button variant="destructive" size="icon" className="opacity-70 hover:opacity-100" onClick={() => handleDeleteTest(test.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Mark Attendance Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Mark Attendance
                  </CardTitle>
                  <CardDescription>Record attendance for a class session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="att-subject">Subject</Label>
                    <Select value={attendanceSubject} onValueChange={setAttendanceSubject}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="att-date">Date</Label>
                    <Input id="att-date" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="h-11" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="att-usns">Student USNs (comma-separated)</Label>
                    <Textarea id="att-usns" value={attendanceUsns} onChange={(e) => setAttendanceUsns(e.target.value)} placeholder="1XX21CS001, 1XX21CS002, ..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="att-status">Status</Label>
                    <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!attendanceSubject || !attendanceDate || !attendanceUsns.trim()}
                    onClick={async () => {
                      const usns = attendanceUsns.split(',').map(u => u.trim()).filter(Boolean);
                      const success = await markAttendance(usns, attendanceSubject, attendanceDate, attendanceStatus, user?.id || '');
                      if (success) setAttendanceUsns('');
                    }}
                  >
                    Mark Attendance
                  </Button>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Attendance Summary</CardTitle>
                  <CardDescription>Overview of attendance across all students</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {getStudentAttendanceSummaries().length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <UserCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
                          <p className="text-muted-foreground">No attendance records yet.</p>
                        </div>
                      ) : (
                        getStudentAttendanceSummaries().map((s) => (
                          <div key={s.usn} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
                            <div>
                              <p className="font-medium text-foreground">{s.usn}</p>
                              <p className="text-xs text-muted-foreground">{s.present}/{s.totalClasses} classes attended</p>
                            </div>
                            <Badge variant={s.percentage >= 75 ? 'default' : s.percentage >= 60 ? 'secondary' : 'destructive'}>
                              {s.percentage}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/manage-subjects">
            <Button variant="outline" size="lg" className="gap-2 shadow-sm">
              <BookOpen className="h-4 w-4" />
              Manage Subjects & Marks
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default LecturerDashboard;
