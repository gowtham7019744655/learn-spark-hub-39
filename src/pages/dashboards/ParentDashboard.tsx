import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link, Navigate } from 'react-router-dom';
import {
  GraduationCap,
  TrendingUp,
  Calendar,
  Bell,
  MessageSquare,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const performanceTrend = [
  { month: 'Sep', score: 75 },
  { month: 'Oct', score: 78 },
  { month: 'Nov', score: 82 },
  { month: 'Dec', score: 80 },
  { month: 'Jan', score: 85 },
  { month: 'Feb', score: 88 },
];

const childCourses = [
  { name: 'Mathematics', grade: 'A-', attendance: 95, teacher: 'Prof. Smith' },
  { name: 'Physics', grade: 'B+', attendance: 92, teacher: 'Prof. Johnson' },
  { name: 'Computer Science', grade: 'A', attendance: 98, teacher: 'Prof. Davis' },
  { name: 'English', grade: 'B', attendance: 90, teacher: 'Prof. Williams' },
];

const notifications = [
  { title: 'Parent-Teacher Meeting', date: 'March 15, 2024', type: 'event' },
  { title: 'Math Quiz Results Posted', date: 'March 10, 2024', type: 'grade' },
  { title: 'Science Fair Registration Open', date: 'March 8, 2024', type: 'announcement' },
];

const ParentDashboard = () => {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || role !== 'parent') {
    return <Navigate to="/login/parent" replace />;
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Monitor your child's academic progress
          </p>
        </div>

        {/* Child Overview Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">Alex Johnson</h2>
              <p className="text-muted-foreground">Grade 10 • Class 10-A</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">3.7</p>
              <p className="text-sm text-muted-foreground">Current GPA</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">88%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">94%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">6</p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Bell className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">New Updates</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Performance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Your child's progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrend}>
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
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Updates
              </CardTitle>
              <CardDescription>Recent school notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.date}</p>
                  </div>
                  <Badge variant="outline">{notification.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Course Overview</CardTitle>
            <CardDescription>Performance in each subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {childCourses.map((course, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{course.name}</p>
                      <p className="text-sm text-muted-foreground">{course.teacher}</p>
                    </div>
                    <Badge>{course.grade}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className="font-medium text-foreground">{course.attendance}%</span>
                    </div>
                    <Progress value={course.attendance} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/chatbot">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact School
            </Button>
          </Link>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
