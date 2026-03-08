import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';

interface QuestionDraft {
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
}

interface QuestionManagerProps {
  testId: string;
  onDone: () => void;
}

export const QuestionManager = ({ testId, onDone }: QuestionManagerProps) => {
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { question_text: '', options: ['', '', '', ''], correct_answer: '', marks: 1 },
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question_text: '', options: ['', '', '', ''], correct_answer: '', marks: 1 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionDraft, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const newOptions = [...q.options];
      newOptions[oIndex] = value;
      return { ...q, options: newOptions };
    }));
  };

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1}: Please enter question text`);
        return;
      }
      const validOptions = q.options.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast.error(`Question ${i + 1}: At least 2 options required`);
        return;
      }
      if (!q.correct_answer.trim()) {
        toast.error(`Question ${i + 1}: Please select a correct answer`);
        return;
      }
      if (!validOptions.includes(q.correct_answer)) {
        toast.error(`Question ${i + 1}: Correct answer must match one of the options`);
        return;
      }
    }

    setSaving(true);
    try {
      const rows = questions.map((q, i) => ({
        test_id: testId,
        question_text: q.question_text.trim(),
        question_type: 'mcq',
        options: q.options.filter(o => o.trim()),
        correct_answer: q.correct_answer.trim(),
        marks: q.marks,
        question_order: i + 1,
      }));

      const { error } = await supabase.from('test_questions').insert(rows);
      if (error) throw error;

      toast.success(`${questions.length} question(s) added successfully!`);
      onDone();
    } catch (error) {
      logError('saveQuestions', error);
      toast.error('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Add Questions</h3>
          <p className="text-sm text-muted-foreground">{questions.length} question(s)</p>
        </div>
        <Button variant="outline" onClick={addQuestion} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Add Question
        </Button>
      </div>

      {questions.map((q, qIndex) => (
        <Card key={qIndex} className="overflow-hidden">
          <CardHeader className="bg-muted/30 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Marks:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={q.marks}
                    onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                    className="h-8 w-16 text-center"
                  />
                </div>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeQuestion(qIndex)} disabled={questions.length <= 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                placeholder="Enter the question..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Options (click radio to set correct answer)</Label>
              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIndex, 'correct_answer', option)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      q.correct_answer === option && option.trim()
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30 hover:border-primary/50'
                    }`}
                  >
                    {q.correct_answer === option && option.trim() && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                    )}
                  </button>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                    className="h-10"
                  />
                </div>
              ))}
            </div>

            {q.correct_answer && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Correct: {q.correct_answer}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : `Save ${questions.length} Question(s)`}
        </Button>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
};
