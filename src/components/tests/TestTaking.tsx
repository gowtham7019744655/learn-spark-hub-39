import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  marks: number;
  question_order: number;
}

interface TestTakingProps {
  testId: string;
  testTitle: string;
  durationMinutes: number;
  maxScore: number;
  studentUsn: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export const TestTaking = ({
  testId,
  testTitle,
  durationMinutes,
  maxScore,
  studentUsn,
  onComplete,
  onBack,
}: TestTakingProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('question_order');

      if (error) {
        logError('fetchQuestions', error);
        toast.error('Failed to load questions');
      } else {
        const parsed = (data || []).map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options as string[] : JSON.parse(q.options as string || '[]'),
        }));
        setQuestions(parsed);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (submitted || loading) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, loading]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);

    try {
      let totalScore = 0;
      const answerRows = questions.map(q => {
        const selected = answers[q.id] || '';
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) totalScore += q.marks;
        return {
          student_usn: studentUsn,
          test_id: testId,
          question_id: q.id,
          selected_answer: selected || null,
          is_correct: isCorrect,
        };
      });

      // Insert answers
      const { error: ansError } = await supabase.from('student_answers').upsert(answerRows, {
        onConflict: 'student_usn,question_id',
      });
      if (ansError) throw ansError;

      // Calculate percentage
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
      const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;

      // Update student_tests record
      const { error: stError } = await supabase.from('student_tests').upsert({
        student_usn: studentUsn,
        test_id: testId,
        score: percentage,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }, { onConflict: 'student_usn,test_id' });

      // If upsert fails due to no unique constraint, try insert
      if (stError) {
        await supabase.from('student_tests').insert({
          student_usn: studentUsn,
          test_id: testId,
          score: percentage,
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }

      setScore(percentage);
      setSubmitted(true);
      toast.success(`Test submitted! Score: ${percentage}%`);
      onComplete(percentage);
    } catch (error) {
      logError('submitTest', error);
      toast.error('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, studentUsn, testId, submitting, submitted, onComplete]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-foreground">No questions available</p>
          <p className="text-sm text-muted-foreground mt-1">This test doesn't have any questions yet.</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
    const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;

    return (
      <div className="space-y-6">
        <Card className="text-center overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-10">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">{score}%</h2>
            <p className="text-muted-foreground mt-1">Your Score</p>
          </div>
          <CardContent className="py-6">
            <div className="flex justify-center gap-8 text-sm">
              <div><p className="text-2xl font-bold text-foreground">{correctCount}</p><p className="text-muted-foreground">Correct</p></div>
              <div><p className="text-2xl font-bold text-foreground">{questions.length - correctCount}</p><p className="text-muted-foreground">Wrong</p></div>
              <div><p className="text-2xl font-bold text-foreground">{questions.length}</p><p className="text-muted-foreground">Total</p></div>
            </div>
            <Button className="mt-6" onClick={onBack}>Back to Tests</Button>
          </CardContent>
        </Card>

        {/* Review answers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Answer Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, i) => {
              const selected = answers[q.id];
              const isCorrect = selected === q.correct_answer;
              return (
                <div key={q.id} className={`rounded-xl border p-4 ${isCorrect ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'}`}>
                  <div className="flex items-start gap-3">
                    <Badge variant={isCorrect ? 'default' : 'destructive'} className="mt-0.5 shrink-0">Q{i + 1}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{q.question_text}</p>
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{selected || 'Not answered'}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="text-green-600 font-medium">{q.correct_answer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {/* Header with timer */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{testTitle}</h2>
          <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={timeLeft < 60 ? 'destructive' : 'outline'} className="gap-1.5 text-base px-3 py-1.5">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={(answeredCount / questions.length) * 100} className="h-2" />

      {/* Question navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
              i === currentIndex
                ? 'bg-primary text-primary-foreground shadow-sm'
                : answers[q.id]
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question {currentIndex + 1}</CardTitle>
            <Badge variant="outline">{currentQ.marks} mark{currentQ.marks > 1 ? 's' : ''}</Badge>
          </div>
          <CardDescription className="text-base text-foreground mt-2">{currentQ.question_text}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={(value) => setAnswers(prev => ({ ...prev, [currentQ.id]: value }))}
          >
            <div className="space-y-3">
              {currentQ.options.map((option, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${
                    answers[currentQ.id] === option
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <RadioGroupItem value={option} id={`option-${i}`} />
                  <Label htmlFor={`option-${i}`} className="cursor-pointer flex-1 text-sm font-normal">
                    {option}
                  </Label>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <div className="flex gap-2">
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex(prev => prev + 1)} className="gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2"
              variant={answeredCount < questions.length ? 'secondary' : 'default'}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Submit Test {answeredCount < questions.length && `(${questions.length - answeredCount} unanswered)`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
