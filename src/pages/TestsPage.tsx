import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigate } from 'react-router-dom';
import { Clock, CheckCircle, PlayCircle, FileText, Award } from 'lucide-react';

interface Test {
  id: number;
  title: string;
  course: string;
  duration: string;
  questions: number;
  status: 'available' | 'completed' | 'upcoming';
  score?: number;
  dueDate?: string;
}

const tests: Test[] = [
  {
    id: 1,
    title: 'Calculus Midterm',
    course: 'Mathematics',
    duration: '60 min',
    questions: 25,
    status: 'completed',
    score: 88,
  },
  {
    id: 2,
    title: 'Physics Quiz 3',
    course: 'Physics',
    duration: '30 min',
    questions: 15,
    status: 'available',
    dueDate: 'Mar 15, 2024',
  },
  {
    id: 3,
    title: 'Programming Assignment',
    course: 'Computer Science',
    duration: '90 min',
    questions: 10,
    status: 'available',
    dueDate: 'Mar 18, 2024',
  },
  {
    id: 4,
    title: 'Literature Essay',
    course: 'English',
    duration: '45 min',
    questions: 5,
    status: 'upcoming',
    dueDate: 'Mar 25, 2024',
  },
  {
    id: 5,
    title: 'Chemistry Lab Exam',
    course: 'Chemistry',
    duration: '60 min',
    questions: 20,
    status: 'completed',
    score: 92,
  },
];

const TestsPage = () => {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'completed' | 'upcoming'>('available');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const filteredTests = tests.filter((test) => test.status === activeTab);

  const stats = {
    available: tests.filter((t) => t.status === 'available').length,
    completed: tests.filter((t) => t.status === 'completed').length,
    avgScore: Math.round(
      tests
        .filter((t) => t.status === 'completed' && t.score)
        .reduce((acc, t) => acc + (t.score || 0), 0) /
        tests.filter((t) => t.status === 'completed').length
    ),
  };

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
          <Button
            variant={activeTab === 'available' ? 'default' : 'outline'}
            onClick={() => setActiveTab('available')}
          >
            Available
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </Button>
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upcoming')}
          >
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
                    <CardDescription>{test.course}</CardDescription>
                  </div>
                  {test.status === 'completed' && test.score && (
                    <Badge
                      variant={test.score >= 80 ? 'default' : 'secondary'}
                    >
                      {test.score}%
                    </Badge>
                  )}
                  {test.status === 'available' && (
                    <Badge variant="outline">Ready</Badge>
                  )}
                  {test.status === 'upcoming' && (
                    <Badge variant="secondary">Scheduled</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {test.duration}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {test.questions} questions
                    </span>
                  </div>

                  {test.status === 'completed' && test.score && (
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-medium text-foreground">{test.score}%</span>
                      </div>
                      <Progress value={test.score} className="mt-1" />
                    </div>
                  )}

                  {test.dueDate && test.status !== 'completed' && (
                    <p className="text-sm text-muted-foreground">Due: {test.dueDate}</p>
                  )}

                  <Button
                    className="w-full"
                    variant={test.status === 'completed' ? 'outline' : 'default'}
                    disabled={test.status === 'upcoming'}
                  >
                    {test.status === 'available' && 'Start Test'}
                    {test.status === 'completed' && 'View Results'}
                    {test.status === 'upcoming' && 'Coming Soon'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-muted-foreground">No tests found in this category.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default TestsPage;
