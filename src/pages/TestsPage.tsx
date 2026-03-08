import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTests, useStudentTests } from '@/hooks/useTests';
import { useSubjects } from '@/hooks/useSubjects';
import { QuestionManager } from '@/components/tests/QuestionManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Navigate } from 'react-router-dom';
import { Clock, CheckCircle, PlayCircle, FileText, Award, Loader2, ArrowLeft, PlusCircle, Trash2, ListPlus, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { TestTaking } from '@/components/tests/TestTaking';

const TestsPage = () => {
  const { isAuthenticated, profile, role, user } = useAuth();
  const { tests, loading: testsLoading, addTest, deleteTest, updateTest } = useTests();
  const { subjects } = useSubjects();
  const { studentTests, loading: studentTestsLoading } = useStudentTests(profile?.usn || undefined);
  const [activeTab, setActiveTab] = useState<'available' | 'completed' | 'upcoming'>('available');
  const [takingTest, setTakingTest] = useState<string | null>(null);

  // Lecturer state
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [addingQuestionsToTest, setAddingQuestionsToTest] = useState<string | null>(null);
  const [newTest, setNewTest] = useState({
    title: '', description: '', subject_id: '', duration_minutes: 60,
    total_questions: 10, max_score: 100, due_date: '',
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isLecturer = role === 'lecturer';
  const loading = testsLoading || studentTestsLoading;
  const studentTestMap = new Map(studentTests.map(st => [st.test_id, st]));

  const myTests = isLecturer ? tests.filter(t => t.created_by === user?.id) : [];

  const categorizedTests = tests
    .filter(t => t.status === 'published')
    .map(test => {
      const studentTest = studentTestMap.get(test.id);
      let status: 'available' | 'completed' | 'upcoming' = 'available';
      
      if (studentTest?.status === 'completed') {
        status = 'completed';
      } else if (test.due_date && new Date(test.due_date) > new Date()) {
        const daysUntilDue = Math.ceil((new Date(test.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue > 7) {
          status = 'upcoming';
        }
      }

      return {
        ...test,
        displayStatus: status,
        score: studentTest?.score || null,
        studentTestStatus: studentTest?.status || null,
      };
    });

  const filteredTests = categorizedTests.filter((test) => test.displayStatus === activeTab);

  const stats = {
    available: categorizedTests.filter((t) => t.displayStatus === 'available').length,
    completed: categorizedTests.filter((t) => t.displayStatus === 'completed').length,
    avgScore: (() => {
      const completedWithScores = categorizedTests.filter((t) => t.displayStatus === 'completed' && t.score);
      if (completedWithScores.length === 0) return 0;
      return Math.round(
        completedWithScores.reduce((acc, t) => acc + (t.score || 0), 0) / completedWithScores.length
      );
    })(),
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
  const handleDeleteTest = async (id: string) => { await deleteTest(id); };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Test-taking mode (students only)
  if (takingTest && profile?.usn && !isLecturer) {
    const test = categorizedTests.find(t => t.id === takingTest);
    if (!test) {
      setTakingTest(null);
      return null;
    }

    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => setTakingTest(null)}>
            <ArrowLeft className="h-4 w-4" /> Back to Tests
          </Button>
          <TestTaking
            testId={test.id}
            testTitle={test.title}
            durationMinutes={test.duration_minutes}
            maxScore={test.max_score}
            studentUsn={profile.usn}
            onComplete={() => {}}
            onBack={() => setTakingTest(null)}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tests & Assessments</h1>
            <p className="text-muted-foreground">
              {isLecturer ? 'Create and manage tests for your students' : 'Take tests and view your assessment results'}
            </p>
          </div>
          {isLecturer && (
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
          )}
        </div>

        {/* Lecturer: My Tests Section */}
        {isLecturer && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    My Tests
                  </CardTitle>
                  <CardDescription>Tests you've created — add questions and publish to make them available</CardDescription>
                </div>
                <Badge variant="outline">{myTests.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {myTests.length === 0 ? (
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
                            <>
                              <Button variant="outline" size="sm" className="shadow-sm gap-1" onClick={() => setAddingQuestionsToTest(test.id)}>
                                <ListPlus className="h-3.5 w-3.5" /> Questions
                              </Button>
                              <Button variant="outline" size="sm" className="shadow-sm" onClick={() => handlePublishTest(test.id)}>Publish</Button>
                            </>
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
        )}

        {/* Question Manager Dialog */}
        {addingQuestionsToTest && (
          <Dialog open={!!addingQuestionsToTest} onOpenChange={(open) => { if (!open) setAddingQuestionsToTest(null); }}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Questions to Test</DialogTitle>
                <DialogDescription>Add MCQ questions for students to answer</DialogDescription>
              </DialogHeader>
              <QuestionManager
                testId={addingQuestionsToTest}
                onDone={() => setAddingQuestionsToTest(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Stats (for students or general view) */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <PlayCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available Tests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Published Tests Section */}
        <h2 className="mb-4 text-xl font-semibold text-foreground">Published Tests</h2>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button variant={activeTab === 'available' ? 'default' : 'outline'} onClick={() => setActiveTab('available')}>
            Available
          </Button>
          <Button variant={activeTab === 'completed' ? 'default' : 'outline'} onClick={() => setActiveTab('completed')}>
            Completed
          </Button>
          <Button variant={activeTab === 'upcoming' ? 'default' : 'outline'} onClick={() => setActiveTab('upcoming')}>
            Upcoming
          </Button>
        </div>

        {/* Test Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test) => (
            <Card key={test.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <CardDescription>{test.subjects?.name || 'General'}</CardDescription>
                  </div>
                  {test.displayStatus === 'completed' && test.score !== null && (
                    <Badge variant={test.score >= 80 ? 'default' : 'secondary'}>{test.score}%</Badge>
                  )}
                  {test.displayStatus === 'available' && <Badge variant="outline">Ready</Badge>}
                  {test.displayStatus === 'upcoming' && <Badge variant="secondary">Scheduled</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {test.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {test.total_questions} questions
                    </span>
                  </div>

                  {test.displayStatus === 'completed' && test.score !== null && (
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-medium text-foreground">{test.score}%</span>
                      </div>
                      <Progress value={test.score} className="mt-1" />
                    </div>
                  )}

                  {test.due_date && test.displayStatus !== 'completed' && (
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(test.due_date), 'MMM dd, yyyy')}
                    </p>
                  )}

                  {!isLecturer && (
                    <Button
                      className="w-full"
                      variant={test.displayStatus === 'completed' ? 'outline' : 'default'}
                      disabled={test.displayStatus === 'upcoming'}
                      onClick={() => {
                        if (test.displayStatus === 'available' && profile?.usn) {
                          setTakingTest(test.id);
                        }
                      }}
                    >
                      {test.displayStatus === 'available' && 'Start Test'}
                      {test.displayStatus === 'completed' && 'View Results'}
                      {test.displayStatus === 'upcoming' && 'Coming Soon'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">
                {tests.length === 0 
                  ? 'No tests have been created yet.'
                  : 'No tests found in this category.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default TestsPage;
