import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Loader2,
  Lightbulb,
  Shield,
  XCircle,
} from 'lucide-react';
import { usePerformancePrediction, PerformancePrediction } from '@/hooks/usePerformancePrediction';

export const PerformancePredictor = () => {
  const { prediction, loading, error, fetchPrediction } = usePerformancePrediction();

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith('A')) return 'text-green-500';
    if (grade?.startsWith('B')) return 'text-blue-500';
    if (grade?.startsWith('C')) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing performance data...</p>
          <p className="text-xs text-muted-foreground mt-1">AI is generating predictions</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {error || 'No prediction data available'}
          </p>
          <Button onClick={fetchPrediction} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Prediction Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>AI Performance Prediction</CardTitle>
                <CardDescription>Machine learning analysis of your academic data</CardDescription>
              </div>
            </div>
            <Button onClick={fetchPrediction} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Predicted Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted Score</p>
                <p className="text-3xl font-bold text-foreground">{prediction.predictedScore}%</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={prediction.predictedScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Predicted Grade */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted Grade</p>
                <p className={`text-3xl font-bold ${getGradeColor(prediction.predictedGrade)}`}>
                  {prediction.predictedGrade}
                </p>
              </div>
              <div className="rounded-full bg-secondary/10 p-3">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Confidence: {prediction.confidenceScore}%
            </p>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                <div className="mt-1">
                  <Badge variant={getRiskColor(prediction.riskLevel)} className="text-sm">
                    {getRiskIcon(prediction.riskLevel)}
                    <span className="ml-1 capitalize">{prediction.riskLevel}</span>
                  </Badge>
                </div>
              </div>
              <div className={`rounded-full p-3 ${
                prediction.riskLevel === 'low' ? 'bg-green-500/10' :
                prediction.riskLevel === 'medium' ? 'bg-yellow-500/10' : 'bg-red-500/10'
              }`}>
                <Shield className={`h-6 w-6 ${
                  prediction.riskLevel === 'low' ? 'text-green-500' :
                  prediction.riskLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time to Target */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time to 70%</p>
                <p className="text-3xl font-bold text-foreground">
                  {prediction.weeksToTarget === null ? '✓' : `${prediction.weeksToTarget}w`}
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {prediction.weeksToTarget === null ? 'Already at target!' : 'Estimated weeks'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">AI Analysis Summary</h4>
              <p className="text-muted-foreground">{prediction.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>Personalized actions to improve your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prediction.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border border-border p-4"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  rec.priority === 1 ? 'bg-red-500/10 text-red-500' :
                  rec.priority === 2 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  <span className="text-sm font-bold">{rec.priority}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{rec.action}</h4>
                    <Badge variant="outline" className="text-xs">{rec.subject}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expected impact: <span className="font-medium text-green-500">{rec.impact}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prediction.strengths.map((strength, index) => (
                <li key={index} className="flex items-center gap-2 text-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {strength}
                </li>
              ))}
              {prediction.strengths.length === 0 && (
                <li className="text-muted-foreground">Keep building your strengths!</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prediction.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-center gap-2 text-foreground">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {weakness}
                </li>
              ))}
              {prediction.weaknesses.length === 0 && (
                <li className="text-muted-foreground">Great job! No major weaknesses detected.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
