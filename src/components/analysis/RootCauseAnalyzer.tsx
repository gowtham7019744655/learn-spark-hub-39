import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import type { StudentMark } from '@/hooks/useStudentMarks';

interface SubjectAnalysis {
  subjectId: string;
  subjectName: string;
  internalScore: number;
  externalScore: number;
  totalScore: number;
  maxTotal: number;
  percentage: number;
  difficultyScore: number; // 0-100, higher = harder for student
  performanceGap: number; // difference from average
  internalVsExternalGap: number; // consistency measure
  status: 'critical' | 'warning' | 'good' | 'excellent';
  actionItems: string[];
}

interface PerformanceFactors {
  consistencyScore: number; // how consistent across subjects
  internalExamScore: number; // performance in internals
  externalExamScore: number; // performance in externals
  subjectDiversityScore: number; // spread of performance
  overallStrength: string;
  primaryWeakness: string;
}

interface RootCauseAnalyzerProps {
  marks: StudentMark[];
  loading?: boolean;
}

export const RootCauseAnalyzer = ({ marks, loading }: RootCauseAnalyzerProps) => {
  const analysis = useMemo(() => {
    if (!marks || marks.length === 0) return null;

    // Analyze each subject
    const subjectAnalyses: SubjectAnalysis[] = marks.map((mark) => {
      const maxInternal = mark.subjects?.max_internal || 50;
      const maxExternal = mark.subjects?.max_external || 100;
      const maxTotal = maxInternal + maxExternal;
      const totalScore = mark.internal_marks + mark.external_marks;
      const percentage = Math.round((totalScore / maxTotal) * 100);

      const internalPct = (mark.internal_marks / maxInternal) * 100;
      const externalPct = (mark.external_marks / maxExternal) * 100;
      const internalVsExternalGap = Math.abs(internalPct - externalPct);

      // Difficulty score: inverse of percentage (higher = harder for student)
      const difficultyScore = Math.round(100 - percentage);

      // Determine status
      let status: SubjectAnalysis['status'];
      if (percentage >= 80) status = 'excellent';
      else if (percentage >= 60) status = 'good';
      else if (percentage >= 40) status = 'warning';
      else status = 'critical';

      // Generate action items based on analysis
      const actionItems: string[] = [];
      if (percentage < 40) {
        actionItems.push('Prioritize this subject immediately');
        actionItems.push('Schedule daily 1-hour practice sessions');
      } else if (percentage < 60) {
        actionItems.push('Focus on weak topics within this subject');
        actionItems.push('Practice previous exam questions');
      }
      if (internalVsExternalGap > 20) {
        if (internalPct > externalPct) {
          actionItems.push('Improve exam preparation strategies');
          actionItems.push('Practice timed tests');
        } else {
          actionItems.push('Focus on consistent class participation');
          actionItems.push('Complete all assignments on time');
        }
      }

      return {
        subjectId: mark.subject_id,
        subjectName: mark.subjects?.name || 'Unknown',
        internalScore: mark.internal_marks,
        externalScore: mark.external_marks,
        totalScore,
        maxTotal,
        percentage,
        difficultyScore,
        performanceGap: 0, // Will be calculated after average
        internalVsExternalGap,
        status,
        actionItems,
      };
    });

    // Calculate average and update performance gaps
    const avgPercentage = subjectAnalyses.reduce((acc, s) => acc + s.percentage, 0) / subjectAnalyses.length;
    subjectAnalyses.forEach((s) => {
      s.performanceGap = Math.round(s.percentage - avgPercentage);
    });

    // Sort by difficulty (hardest first)
    subjectAnalyses.sort((a, b) => b.difficultyScore - a.difficultyScore);

    // Calculate performance factors
    const percentages = subjectAnalyses.map((s) => s.percentage);
    const stdDev = Math.sqrt(
      percentages.reduce((sum, p) => sum + Math.pow(p - avgPercentage, 2), 0) / percentages.length
    );
    const consistencyScore = Math.max(0, Math.round(100 - stdDev * 2));

    const avgInternalPct = marks.reduce((acc, m) => 
      acc + (m.internal_marks / (m.subjects?.max_internal || 50)) * 100, 0) / marks.length;
    const avgExternalPct = marks.reduce((acc, m) => 
      acc + (m.external_marks / (m.subjects?.max_external || 100)) * 100, 0) / marks.length;

    // Identify strengths and weaknesses
    const bestSubject = [...subjectAnalyses].sort((a, b) => b.percentage - a.percentage)[0];
    const worstSubject = subjectAnalyses[0]; // Already sorted by difficulty

    let overallStrength = 'Balanced performance';
    if (avgInternalPct > avgExternalPct + 10) {
      overallStrength = 'Strong in continuous assessment';
    } else if (avgExternalPct > avgInternalPct + 10) {
      overallStrength = 'Strong in final exams';
    } else if (consistencyScore > 80) {
      overallStrength = 'Consistent across subjects';
    }

    let primaryWeakness = 'No major concerns';
    if (worstSubject.percentage < 40) {
      primaryWeakness = `Critical: ${worstSubject.subjectName}`;
    } else if (consistencyScore < 50) {
      primaryWeakness = 'Inconsistent performance';
    } else if (avgExternalPct < avgInternalPct - 15) {
      primaryWeakness = 'Exam preparation needs work';
    }

    const factors: PerformanceFactors = {
      consistencyScore,
      internalExamScore: Math.round(avgInternalPct),
      externalExamScore: Math.round(avgExternalPct),
      subjectDiversityScore: Math.round(stdDev),
      overallStrength,
      primaryWeakness,
    };

    // Generate priority actions
    const priorityActions: { action: string; urgency: 'high' | 'medium' | 'low'; subject?: string }[] = [];
    
    const criticalSubjects = subjectAnalyses.filter((s) => s.status === 'critical');
    const warningSubjects = subjectAnalyses.filter((s) => s.status === 'warning');

    criticalSubjects.forEach((s) => {
      priorityActions.push({
        action: `Immediate focus: ${s.subjectName} (${s.percentage}%)`,
        urgency: 'high',
        subject: s.subjectName,
      });
    });

    if (consistencyScore < 60) {
      priorityActions.push({
        action: 'Balance study time across all subjects',
        urgency: 'medium',
      });
    }

    warningSubjects.slice(0, 2).forEach((s) => {
      priorityActions.push({
        action: `Improve ${s.subjectName} to avoid falling behind`,
        urgency: 'medium',
        subject: s.subjectName,
      });
    });

    if (avgInternalPct < avgExternalPct - 10) {
      priorityActions.push({
        action: 'Focus on assignments and class participation',
        urgency: 'low',
      });
    }

    return {
      subjects: subjectAnalyses,
      factors,
      priorityActions: priorityActions.slice(0, 5),
      avgPercentage: Math.round(avgPercentage),
      criticalCount: criticalSubjects.length,
      warningCount: warningSubjects.length,
    };
  }, [marks]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Root-Cause Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Analyzing performance data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Root-Cause Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No marks data available for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: SubjectAnalysis['status']) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'good': return 'outline';
      case 'excellent': return 'default';
    }
  };

  const getUrgencyColor = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Factors Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Performance Analysis
          </CardTitle>
          <CardDescription>
            Understanding why your performance is at {analysis.avgPercentage}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Consistency Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Consistency</span>
                <span className="text-sm font-bold text-foreground">{analysis.factors.consistencyScore}%</span>
              </div>
              <Progress value={analysis.factors.consistencyScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {analysis.factors.consistencyScore >= 70 
                  ? 'Good balance across subjects' 
                  : 'Uneven performance across subjects'}
              </p>
            </div>

            {/* Internal Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Internal Exams</span>
                <span className="text-sm font-bold text-foreground">{analysis.factors.internalExamScore}%</span>
              </div>
              <Progress value={analysis.factors.internalExamScore} className="h-2" />
              <p className="text-xs text-muted-foreground">Class tests & assignments</p>
            </div>

            {/* External Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">External Exams</span>
                <span className="text-sm font-bold text-foreground">{analysis.factors.externalExamScore}%</span>
              </div>
              <Progress value={analysis.factors.externalExamScore} className="h-2" />
              <p className="text-xs text-muted-foreground">Final examinations</p>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Key Insights</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Strength:</span> {analysis.factors.overallStrength}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Focus:</span> {analysis.factors.primaryWeakness}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Actions */}
      {analysis.priorityActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Priority Actions
            </CardTitle>
            <CardDescription>
              {analysis.criticalCount > 0 
                ? `${analysis.criticalCount} subject(s) need immediate attention`
                : 'Recommended improvements based on your performance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.priorityActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <Badge variant={getUrgencyColor(action.urgency)} className="shrink-0">
                    {action.urgency}
                  </Badge>
                  <span className="text-sm text-foreground">{action.action}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Difficulty Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Subject Difficulty Analysis
          </CardTitle>
          <CardDescription>
            Subjects ranked by difficulty (hardest first based on your performance)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{subject.subjectName}</h4>
                      <Badge variant={getStatusColor(subject.status)}>
                        {subject.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Score: {subject.percentage}%</span>
                      <span className="flex items-center gap-1">
                        {subject.performanceGap >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        {subject.performanceGap > 0 ? '+' : ''}{subject.performanceGap}% vs avg
                      </span>
                    </div>
                    <Progress value={subject.percentage} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{subject.difficultyScore}</p>
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                  </div>
                </div>
                
                {subject.actionItems.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      Recommended Actions
                    </p>
                    <ul className="space-y-1">
                      {subject.actionItems.map((action, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
