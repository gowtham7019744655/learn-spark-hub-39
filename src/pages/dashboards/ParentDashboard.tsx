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
  Download,
  Loader2,
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

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

const childInfo = {
  name: 'Alex Johnson',
  grade: 'Grade 10',
  class: 'Class 10-A',
  gpa: 3.7,
  avgScore: 88,
  attendance: 94,
};

const ParentDashboard = () => {
  const { profile, role, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || role !== 'parent') {
    return <Navigate to="/login/parent" replace />;
  }

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(0, 136, 204); // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Performance Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Student Performance Hub', pageWidth / 2, 32, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Student Info Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Information', 14, 55);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${childInfo.name}`, 14, 65);
    doc.text(`Grade: ${childInfo.grade}`, 14, 72);
    doc.text(`Class: ${childInfo.class}`, 14, 79);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 86);
    
    // Performance Summary Box
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(14, 95, pageWidth - 28, 35, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Summary', 20, 107);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryY = 117;
    doc.text(`Current GPA: ${childInfo.gpa}`, 20, summaryY);
    doc.text(`Average Score: ${childInfo.avgScore}%`, 80, summaryY);
    doc.text(`Attendance: ${childInfo.attendance}%`, 145, summaryY);
    
    // Course Performance Table
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Course Performance', 14, 145);
    
    autoTable(doc, {
      startY: 150,
      head: [['Course', 'Grade', 'Attendance', 'Teacher']],
      body: childCourses.map(course => [
        course.name,
        course.grade,
        `${course.attendance}%`,
        course.teacher,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [0, 136, 204],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 250, 255],
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
    });
    
    // Performance Trend
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Trend (Monthly Scores)', 14, finalY + 15);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Month', 'Score']],
      body: performanceTrend.map(item => [item.month, `${item.score}%`]),
      theme: 'grid',
      headStyles: {
        fillColor: [0, 136, 204],
        textColor: 255,
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
      },
      tableWidth: 'wrap',
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      'This report was generated by Student Performance Hub. For questions, contact your school administrator.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Save the PDF
    doc.save(`${childInfo.name.replace(' ', '_')}_Performance_Report.pdf`);
    toast.success('Report downloaded successfully!');
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {profile?.full_name || profile?.email}!
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
              <h2 className="text-2xl font-bold text-foreground">{childInfo.name}</h2>
              <p className="text-muted-foreground">{childInfo.grade} • {childInfo.class}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{childInfo.gpa}</p>
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
                <p className="text-2xl font-bold text-foreground">{childInfo.avgScore}%</p>
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
                <p className="text-2xl font-bold text-foreground">{childInfo.attendance}%</p>
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
          <Button variant="outline" onClick={generatePDFReport}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
