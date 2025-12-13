import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  MessageSquare,
  PlusCircle,
  Trash2,
  Calendar,
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
import { useAssignments } from '@/hooks/useAssignments';
import { format } from 'date-fns';

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
  const { profile, role, isAuthenticated } = useAuth();
  const { assignments, isLoading, addAssignment, deleteAssignment } = useAssignments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_code: '',
    due_date: '',
  });

  if (!isAuthenticated || role !== 'lecturer') {
    return <Navigate to="/login/lecturer" replace />;
  }

  const handleCreateAssignment = () => {
    if (!newAssignment.title || !newAssignment.course_code || !newAssignment.due_date) {
      return;
    }

    addAssignment.mutate({
      ...newAssignment,
      created_by: profile?.full_name || profile?.email || 'Unknown',
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewAssignment({ title: '', description: '', course_code: '', due_date: '' });
      },
    });
  };

  const handleDeleteAssignment = (id: string) => {
    deleteAssignment.mutate(id);
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, Prof. {profile?.full_name || profile?.email}!
            </h1>
            <p className="text-muted-foreground">Manage your courses and students</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Add a new assignment for your students.
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAssignment}
                  disabled={addAssignment.isPending || !newAssignment.title || !newAssignment.course_code || !newAssignment.due_date}
                >
                  {addAssignment.isPending ? 'Creating...' : 'Create Assignment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Active Assignments</p>
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

        {/* Assignments */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assignments
            </CardTitle>
            <CardDescription>Manage your course assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <p className="text-muted-foreground">No assignments yet. Create one to get started!</p>
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
                      disabled={deleteAssignment.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
