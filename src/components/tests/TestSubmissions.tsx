import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Loader2, ArrowLeft, Download, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { logError } from '@/lib/errorLogger';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Submission {
  student_usn: string;
  full_name: string | null;
  score: number | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface TestSubmissionsProps {
  testId: string;
  testTitle: string;
  maxScore: number;
  onBack: () => void;
}

export const TestSubmissions = ({ testId, testTitle, maxScore, onBack }: TestSubmissionsProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('student_tests')
        .select('student_usn, score, status, started_at, completed_at')
        .eq('test_id', testId)
        .order('score', { ascending: false });

      if (error) {
        logError('fetchTestSubmissions', error);
        setLoading(false);
        return;
      }

      const usns = (data || []).map(d => d.student_usn);
      let profileMap = new Map<string, string | null>();

      if (usns.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('usn, full_name')
          .in('usn', usns);
        (profiles || []).forEach(p => {
          if (p.usn) profileMap.set(p.usn, p.full_name);
        });
      }

      setSubmissions(
        (data || []).map(d => ({
          student_usn: d.student_usn,
          full_name: profileMap.get(d.student_usn) || null,
          score: d.score,
          status: d.status,
          started_at: d.started_at,
          completed_at: d.completed_at,
        }))
      );
      setLoading(false);
    };

    fetchSubmissions();
  }, [testId]);

  const completedCount = submissions.filter(s => s.status === 'completed').length;
  const avgScore = completedCount > 0
    ? Math.round(submissions.filter(s => s.status === 'completed' && s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / completedCount)
    : 0;
  const highestScore = submissions.length > 0 ? Math.max(...submissions.filter(s => s.score !== null).map(s => s.score!), 0) : 0;
  const lowestScore = completedCount > 0 ? Math.min(...submissions.filter(s => s.status === 'completed' && s.score !== null).map(s => s.score!)) : 0;

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const now = format(new Date(), 'MMM dd, yyyy HH:mm');

      // Header
      doc.setFontSize(18);
      doc.text(testTitle, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Submissions Report • Generated ${now}`, 14, 28);
      doc.text(`Max Score: ${maxScore}`, 14, 34);

      // Stats summary
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Attempts: ${submissions.length}  |  Completed: ${completedCount}  |  Avg: ${avgScore}%  |  High: ${highestScore}%  |  Low: ${lowestScore}%`, 14, 44);

      // Table
      autoTable(doc, {
        startY: 52,
        head: [['#', 'Student Name', 'USN', 'Status', 'Score', 'Completed At']],
        body: submissions.map((sub, i) => [
          i + 1,
          sub.full_name || '—',
          sub.student_usn,
          sub.status === 'completed' ? 'Completed' : sub.status === 'in_progress' ? 'In Progress' : sub.status,
          sub.score !== null ? `${sub.score}%` : '—',
          sub.completed_at ? format(new Date(sub.completed_at), 'MMM dd, yyyy HH:mm') : '—',
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [14, 116, 144] },
      });

      doc.save(`${testTitle.replace(/[^a-zA-Z0-9]/g, '_')}_submissions.pdf`);
      toast.success('PDF exported successfully');
    } catch (err) {
      logError('exportSubmissionsPDF', err);
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Back to Tests
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{testTitle}</h2>
          <p className="text-muted-foreground">Student submissions and scores</p>
        </div>
        {submissions.length > 0 && (
          <Button variant="outline" className="gap-2" onClick={exportPDF}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{submissions.length}</p>
              <p className="text-xs text-muted-foreground">Total Attempts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xl font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-5 w-5 flex items-center justify-center text-primary font-bold text-sm">μ</div>
            <div>
              <p className="text-xl font-bold text-foreground">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Average Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-5 w-5 flex items-center justify-center text-primary font-bold text-sm">↕</div>
            <div>
              <p className="text-xl font-bold text-foreground">{highestScore}% / {lowestScore}%</p>
              <p className="text-xs text-muted-foreground">High / Low</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No students have attempted this test yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="hidden sm:table-cell">Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, i) => (
                    <TableRow key={sub.student_usn}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {sub.full_name || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sub.student_usn}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {sub.status === 'completed' ? (
                            <><CheckCircle className="mr-1 h-3 w-3" />Completed</>
                          ) : sub.status === 'in_progress' ? (
                            <><Clock className="mr-1 h-3 w-3" />In Progress</>
                          ) : (
                            sub.status
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              sub.score >= 80 ? 'text-green-600' : sub.score >= 60 ? 'text-primary' : sub.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {sub.score}%
                            </span>
                            <Progress value={sub.score} className="h-1.5 w-16" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {sub.completed_at ? format(new Date(sub.completed_at), 'MMM dd, yyyy HH:mm') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
