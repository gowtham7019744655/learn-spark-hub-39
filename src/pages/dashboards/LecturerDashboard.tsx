import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeAssignments } from '@/hooks/useRealtimeAssignments';
import { useTests } from '@/hooks/useTests';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link, Navigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  PlusCircle,
  Trash2,
  Calendar,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_code: '',
    due_date: '',
  });
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    subject_id: '',
    duration_minutes: 60,
    total_questions: 10,
    max_score: 100,
    due_date: '',
  });

  // Fetch all student marks for the lecturer view
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

  // Group marks by student USN for the table
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
    if (!newAssignment.title || !newAssignment.course_code || !newAssignment.due_date) {
      return;
    }

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
    if (!newTest.title || !newTest.due_date) {
      return;
    }

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
      setNewTest({
        title: '',
        description: '',
        subject_id: '',
        duration_minutes: 60,
        total_questions: 10,
        max_score: 100,
        due_date: '',
      });
    }
  };

  const handlePublishTest = async (testId: string) => {
    await updateTest(testId, { status: 'published' });
  };

  const handleDeleteAssignment = async (id: string) => {
    await deleteAssignment(id);
  };

  const handleDeleteTest = async (id: string) => {
    await deleteTest(id);
  };

  const myTests = tests.filter(t => t.created_by === user?.id);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, Prof. {profile?.full_name || profile?.email}!
            </h1>
            <p className="text-muted-foreground">Manage your courses and students</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Add a new assignment for your students. They'll see it instantly!
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="Assignment title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      placeholder="Assignment description (optional)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course">Course</Label>
                    <Select
                      value={newAssignment.course_code}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, course_code: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.code} value={course.code}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAssignment}
                    disabled={!newAssignment.title || !newAssignment.course_code || !newAssignment.due_date}
                  >
                    Create Assignment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Test
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Test</DialogTitle>
                  <DialogDescription>
                    Create a test for your students. Publish when ready!
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="test-title">Title</Label>
                    <Input
                      id="test-title"
                      value={newTest.title}
                      onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                      placeholder="Test title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="test-description">Description</Label>
                    <Textarea
                      id="test-description"
                      value={newTest.description}
                      onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                      placeholder="Test description (optional)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="test-subject">Subject</Label>
                    <Select
                      value={newTest.subject_id}
                      onValueChange={(value) => setNewTest({ ...newTest, subject_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duration (min)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newTest.duration_minutes}
                        onChange={(e) => setNewTest({ ...newTest, duration_minutes: parseInt(e.target.value) || 60 })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="questions">Questions</Label>
                      <Input
                        id="questions"
                        type="number"
                        value={newTest.total_questions}
                        onChange={(e) => setNewTest({ ...newTest, total_questions: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max-score">Max Score</Label>
                      <Input
                        id="max-score"
                        type="number"
                        value={newTest.max_score}
                        onChange={(e) => setNewTest({ ...newTest, max_score: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="test-due-date">Due Date</Label>
                    <Input
                      id="test-due-date"
                      type="datetime-local"
                      value={newTest.due_date}
                      onChange={(e) => setNewTest({ ...newTest, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTest}
                    disabled={!newTest.title || !newTest.due_date}
                  >
                    Create Test
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">143</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
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
                <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <ClipboardCheck className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{myTests.length}</p>
                <p className="text-sm text-muted-foreground">Tests Created</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="student-marks">Student Marks</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Class Performance Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Class Performance</CardTitle>
                  <CardDescription>Average scores across your courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="class" className="text-muted-foreground" />
                        <YAxis className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                          }}
                        />
                        <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.course_code}</p>
                      </div>
                      <Badge variant="outline">Assignment</Badge>
                    </div>
                  ))}
                  {myTests.slice(0, 2).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{test.title}</p>
                        <p className="text-sm text-muted-foreground">{test.subjects?.name || 'General'}</p>
                      </div>
                      <Badge variant={test.status === 'published' ? 'default' : 'secondary'}>
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
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Current semester course management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {courses.map((course, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{course.name}</p>
                          <p className="text-sm text-muted-foreground">{course.code}</p>
                        </div>
                        <Badge variant="secondary">{course.students} students</Badge>
                      </div>
                      <Progress value={course.progress} className="mt-3" />
                      <p className="mt-1 text-sm text-muted-foreground">
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Student Marks
                </CardTitle>
                <CardDescription>View marks and SGPA for all students ({studentSummaries.length} students found)</CardDescription>
              </CardHeader>
              <CardContent>
                {marksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : studentSummaries.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No student marks found.</p>
                ) : (
                  <div className="space-y-6">
                    {studentSummaries.map(({ usn, marks, sgpa, subjectCount }) => (
                      <div key={usn} className="rounded-lg border border-border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{usn}</p>
                            <p className="text-sm text-muted-foreground">{subjectCount} subjects</p>
                          </div>
                          <Badge variant={sgpa >= 8 ? 'default' : sgpa >= 5 ? 'secondary' : 'destructive'}>
                            SGPA: {sgpa.toFixed(2)}
                          </Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Internal</TableHead>
                              <TableHead>External</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Grade</TableHead>
                              <TableHead>GP</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {marks.map((mark) => (
                              <TableRow key={mark.id}>
                                <TableCell className="font-medium">{mark.subjects?.name || 'Unknown'}</TableCell>
                                <TableCell>{mark.internal_marks}/{mark.subjects?.max_internal || 50}</TableCell>
                                <TableCell>{mark.external_marks}/{mark.subjects?.max_external || 100}</TableCell>
                                <TableCell>{mark.internal_marks + mark.external_marks}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{mark.grade || 'N/A'}</Badge>
                                </TableCell>
                                <TableCell>{gradeToGradePoint(mark.grade)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Assignments
                </CardTitle>
                <CardDescription>Manage your course assignments - students see these in real-time!</CardDescription>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No assignments yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{assignment.title}</p>
                            <Badge variant="secondary">{assignment.course_code}</Badge>
                          </div>
                          {assignment.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>
                          )}
                          <p className="mt-1 text-sm text-muted-foreground">
                            Due: {format(new Date(assignment.due_date), 'PPP p')}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
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
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Tests
                </CardTitle>
                <CardDescription>Create and manage tests - publish to make them available to students!</CardDescription>
              </CardHeader>
              <CardContent>
                {testsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : myTests.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">
                    No tests yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{test.title}</p>
                            <Badge variant={test.status === 'published' ? 'default' : 'secondary'}>
                              {test.status}
                            </Badge>
                            {test.subjects && (
                              <Badge variant="outline">{test.subjects.name}</Badge>
                            )}
                          </div>
                          {test.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{test.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{test.duration_minutes} min</span>
                            <span>{test.total_questions} questions</span>
                            <span>Max: {test.max_score} points</span>
                            {test.due_date && (
                              <span>Due: {format(new Date(test.due_date), 'PPP')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {test.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishTest(test.id)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteTest(test.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/manage-subjects">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Subjects & Marks
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default LecturerDashboard;
