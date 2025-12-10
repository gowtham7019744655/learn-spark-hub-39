import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link, Navigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  MessageSquare,
  PlusCircle,
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

const classPerformance = [
  { class: 'CS101', avg: 85 },
  { class: 'CS201', avg: 78 },
  { class: 'CS301', avg: 82 },
  { class: 'CS401', avg: 90 },
];

const recentSubmissions = [
  { student: 'John Doe', assignment: 'Lab Report 3', course: 'CS101', status: 'pending' },
  { student: 'Jane Smith', assignment: 'Project Proposal', course: 'CS201', status: 'graded' },
  { student: 'Mike Johnson', assignment: 'Quiz 5', course: 'CS301', status: 'pending' },
  { student: 'Emily Brown', assignment: 'Final Essay', course: 'CS401', status: 'graded' },
];

const courses = [
  { name: 'Introduction to Programming', code: 'CS101', students: 45, progress: 65 },
  { name: 'Data Structures', code: 'CS201', students: 38, progress: 78 },
  { name: 'Algorithms', code: 'CS301', students: 32, progress: 55 },
  { name: 'Software Engineering', code: 'CS401', students: 28, progress: 82 },
];

const LecturerDashboard = () => {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || role !== 'lecturer') {
    return <Navigate to="/login/lecturer" replace />;
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, Prof. {user?.name}!
            </h1>
            <p className="text-muted-foreground">Manage your courses and students</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
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
                <p className="text-2xl font-bold text-foreground">4</p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">84%</p>
                <p className="text-sm text-muted-foreground">Avg. Class Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

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

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Submissions
              </CardTitle>
              <CardDescription>Latest student work to review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{submission.student}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.assignment}
                    </p>
                  </div>
                  <Badge
                    variant={submission.status === 'graded' ? 'default' : 'outline'}
                  >
                    {submission.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="mt-6">
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

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/tests">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </Link>
          <Link to="/chatbot">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              AI Assistant
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default LecturerDashboard;
