import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  FileText,
  MessageSquare,
  Calendar,
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

const courses = [
  { name: 'Mathematics', grade: 'A', progress: 92, color: 'bg-primary' },
  { name: 'Physics', grade: 'B+', progress: 85, color: 'bg-secondary' },
  { name: 'Computer Science', grade: 'A', progress: 95, color: 'bg-primary' },
  { name: 'English', grade: 'B', progress: 78, color: 'bg-muted' },
];

const upcomingAssignments = [
  { title: 'Calculus Problem Set', course: 'Mathematics', due: '2 days' },
  { title: 'Physics Lab Report', course: 'Physics', due: '5 days' },
  { title: 'Essay Draft', course: 'English', due: '1 week' },
];

const StudentDashboard = () => {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || role !== 'student') {
    return <Navigate to="/login/student" replace />;
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name}!
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
                <p className="text-2xl font-bold text-foreground">3.8</p>
                <p className="text-sm text-muted-foreground">Current GPA</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">6</p>
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
                <p className="text-2xl font-bold text-foreground">85%</p>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
              {upcomingAssignments.map((assignment, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.course}</p>
                  </div>
                  <Badge variant="outline">{assignment.due}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Current semester course progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{course.name}</p>
                      <Badge>{course.grade}</Badge>
                    </div>
                    <Progress value={course.progress} className="mt-2" />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.progress}% complete
                    </p>
                  </div>
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
              Take a Test
            </Button>
          </Link>
          <Link to="/chatbot">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
