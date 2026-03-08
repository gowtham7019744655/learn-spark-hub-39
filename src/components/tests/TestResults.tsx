import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, ArrowLeft, MinusCircle } from 'lucide-react';
import { logError } from '@/lib/errorLogger';
import { toast } from 'sonner';

interface QuestionWithAnswer {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  question_order: number;
  selected_answer: string | null;
  is_correct: boolean | null;
}

interface TestResultsProps {
  testId: string;
  testTitle: string;
  studentUsn: string;
  score: number | null;
  onBack: () => void;
}

export const TestResults = ({ testId, testTitle, studentUsn, score, onBack }: TestResultsProps) => {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      // Fetch questions and student answers in parallel
      const [questionsRes, answersRes] = await Promise.all([
        supabase
          .from('test_questions')
          .select('*')
          .eq('test_id', testId)
          .order('question_order'),
        supabase
          .from('student_answers')
          .select('*')
          .eq('test_id', testId)
          .eq('student_usn', studentUsn),
      ]);

      if (questionsRes.error) {
        logError('fetchTestResults:questions', questionsRes.error);
        toast.error('Failed to load test results');
        setLoading(false);
        return;
      }
      if (answersRes.error) {
        logError('fetchTestResults:answers', answersRes.error);
      }

      const answerMap = new Map(
        (answersRes.data || []).map(a => [a.question_id, a])
      );

      const merged: QuestionWithAnswer[] = (questionsRes.data || []).map(q => {
        const answer = answerMap.get(q.id);
        return {
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options as string[] : JSON.parse(q.options as string || '[]'),
          correct_answer: q.correct_answer,
          marks: q.marks,
          question_order: q.question_order,
          selected_answer: answer?.selected_answer ?? null,
          is_correct: answer?.is_correct ?? null,
        };
      });

      setQuestions(merged);
      setLoading(false);
    };

    fetchResults();
  }, [testId, studentUsn]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const correctCount = questions.filter(q => q.is_correct).length;
  const incorrectCount = questions.filter(q => q.is_correct === false).length;
  const unanswered = questions.filter(q => q.selected_answer === null).length;
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const earnedMarks = questions.filter(q => q.is_correct).reduce((s, q) => s + q.marks, 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Back to Tests
      </Button>

      {/* Score summary */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 py-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">{score ?? 0}%</h2>
          <p className="text-muted-foreground mt-1">{testTitle}</p>
        </div>
        <CardContent className="py-6">
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-muted-foreground">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
              <p className="text-muted-foreground">Incorrect</p>
            </div>
            {unanswered > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">{unanswered}</p>
                <p className="text-muted-foreground">Unanswered</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{earnedMarks}/{totalMarks}</p>
              <p className="text-muted-foreground">Marks</p>
            </div>
          </div>
          <Progress value={score ?? 0} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Detailed answers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Answer Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, i) => {
            const isCorrect = q.is_correct === true;
            const isUnanswered = q.selected_answer === null;

            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 ${
                  isUnanswered
                    ? 'border-border bg-muted/30'
                    : isCorrect
                    ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                    : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Badge
                    variant={isUnanswered ? 'secondary' : isCorrect ? 'default' : 'destructive'}
                    className="mt-0.5 shrink-0"
                  >
                    Q{i + 1}
                  </Badge>
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-foreground">{q.question_text}</p>

                    {/* Options list */}
                    <div className="space-y-1.5 mt-3">
                      {q.options.map((option, idx) => {
                        const isSelected = q.selected_answer === option;
                        const isCorrectOption = q.correct_answer === option;

                        let optionClass = 'border-border bg-background';
                        if (isCorrectOption) {
                          optionClass = 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30';
                        } else if (isSelected && !isCorrect) {
                          optionClass = 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30';
                        }

                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${optionClass}`}
                          >
                            {isCorrectOption ? (
                              <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                            ) : isSelected ? (
                              <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                            ) : (
                              <MinusCircle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                            )}
                            <span className={isCorrectOption ? 'font-medium text-green-700 dark:text-green-400' : isSelected && !isCorrect ? 'text-red-700 dark:text-red-400' : 'text-foreground'}>
                              {option}
                            </span>
                            {isSelected && <Badge variant="outline" className="ml-auto text-xs">Your answer</Badge>}
                            {isCorrectOption && !isSelected && <Badge variant="outline" className="ml-auto text-xs text-green-600">Correct</Badge>}
                          </div>
                        );
                      })}
                    </div>

                    {isUnanswered && (
                      <p className="text-sm text-muted-foreground italic">Not answered</p>
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
};
