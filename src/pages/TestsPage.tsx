import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTests, useStudentTests } from '@/hooks/useTests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigate } from 'react-router-dom';
import { Clock, CheckCircle, PlayCircle, FileText, Award, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { TestTaking } from '@/components/tests/TestTaking';

const TestsPage = () => {
  const { isAuthenticated, profile, role } = useAuth();
  const { tests, loading: testsLoading } = useTests();
  const { studentTests, loading: studentTestsLoading } = useStudentTests(profile?.usn || undefined);
  const [activeTab, setActiveTab] = useState<'available' | 'completed' | 'upcoming'>('available');
  const [takingTest, setTakingTest] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const loading = testsLoading || studentTestsLoading;
  const studentTestMap = new Map(studentTests.map(st => [st.test_id, st]));

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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Test-taking mode
  if (takingTest && profile?.usn) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tests & Assessments</h1>
          <p className="text-muted-foreground">
            Take tests and view your assessment results
          </p>
        </div>

        {/* Stats */}
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

                  <Button
                    className="w-full"
                    variant={test.displayStatus === 'completed' ? 'outline' : 'default'}
                    disabled={test.displayStatus === 'upcoming' || (role !== 'student')}
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
                  ? 'No tests have been created yet. Check back later!'
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
