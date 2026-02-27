import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  AlertTriangle,
  Link2,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Search,
  GitBranch,
} from 'lucide-react';
import { useMLAnalysis } from '@/hooks/useMLAnalysis';
import type { TrendForecasting, Clustering, AnomalyDetection, SubjectCorrelation } from '@/hooks/useMLAnalysis';

export const MLAnalysisDashboard = () => {
  const { analysis, loading, error, fetchAnalysis } = useMLAnalysis();

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Running ML analysis on your data...</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'No analysis data available'}</p>
          <Button onClick={fetchAnalysis} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>ML-Powered Analysis</CardTitle>
                <CardDescription>4 machine learning models analyzing your academic data</CardDescription>
              </div>
            </div>
            <Button onClick={fetchAnalysis} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-1 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" /> Trends
          </TabsTrigger>
          <TabsTrigger value="clusters" className="flex items-center gap-1 text-xs sm:text-sm">
            <Layers className="h-4 w-4" /> Clusters
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-1 text-xs sm:text-sm">
            <Search className="h-4 w-4" /> Anomalies
          </TabsTrigger>
          <TabsTrigger value="correlations" className="flex items-center gap-1 text-xs sm:text-sm">
            <GitBranch className="h-4 w-4" /> Correlations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <TrendForecastingView data={analysis.trendForecasting} />
        </TabsContent>
        <TabsContent value="clusters">
          <ClusteringView data={analysis.clustering} />
        </TabsContent>
        <TabsContent value="anomalies">
          <AnomalyDetectionView data={analysis.anomalyDetection} />
        </TabsContent>
        <TabsContent value="correlations">
          <SubjectCorrelationView data={analysis.subjectCorrelation} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TrendForecastingView = ({ data }: { data: TrendForecasting }) => {
  const trajectoryIcon = data.currentTrajectory === 'improving' ? <TrendingUp className="h-5 w-5 text-green-500" /> :
    data.currentTrajectory === 'declining' ? <TrendingDown className="h-5 w-5 text-red-500" /> :
    <Minus className="h-5 w-5 text-yellow-500" />;

  const trajectoryColor = data.currentTrajectory === 'improving' ? 'default' :
    data.currentTrajectory === 'declining' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trajectory</p>
                <Badge variant={trajectoryColor} className="mt-1 capitalize">
                  {trajectoryIcon}
                  <span className="ml-1">{data.currentTrajectory}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Predicted Next Semester</p>
            <p className="text-3xl font-bold text-foreground">{data.predictedNextSemesterAvg}%</p>
            <Progress value={data.predictedNextSemesterAvg} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Forecast Confidence</p>
            <p className="text-3xl font-bold text-foreground">{data.forecastConfidence}%</p>
            <Progress value={data.forecastConfidence} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {data.projections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.projections.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="font-medium text-foreground">{p.timeframe}</span>
                  <div className="flex gap-3 text-sm">
                    <span className="text-red-500">Worst: {p.worstCase}%</span>
                    <span className="font-semibold text-foreground">Predicted: {p.predictedAvg}%</span>
                    <span className="text-green-500">Best: {p.bestCase}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Trend Insights</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.trendInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground">
                <ArrowUpRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

const ClusteringView = ({ data }: { data: Clustering }) => {
  const clusterColor = data.studentCluster === 'high-achiever' ? 'default' :
    data.studentCluster === 'at-risk' || data.studentCluster === 'needs-support' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Student Cluster</p>
              <Badge variant={clusterColor} className="mt-1 text-sm capitalize">
                {data.studentCluster.replace(/-/g, ' ')}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{data.clusterDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">Confidence: {data.clusterConfidence}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Estimated Standing</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{data.peerComparison.estimatedPercentile}th</p>
            <p className="text-sm text-muted-foreground">percentile</p>
            <Progress value={data.peerComparison.estimatedPercentile} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">{data.peerComparison.standingDescription}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Subject Groupings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.subjectClusters.map((sc, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={sc.cluster === 'strong' ? 'default' : sc.cluster === 'weak' ? 'destructive' : 'secondary'} className="capitalize">
                    {sc.cluster}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">{sc.avgScore}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{sc.subjects.join(', ') || 'None'}</p>
                <p className="text-xs text-primary mt-1">{sc.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AnomalyDetectionView = ({ data }: { data: AnomalyDetection }) => {
  const consistencyColor = data.overallConsistency >= 80 ? 'text-green-500' :
    data.overallConsistency >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overall Consistency</p>
            <p className={`text-3xl font-bold ${consistencyColor}`}>{data.overallConsistency}%</p>
            <Progress value={data.overallConsistency} className="mt-2 h-2" />
            <Badge variant="outline" className="mt-2 capitalize">{data.consistencyVerdict.replace(/-/g, ' ')}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Anomalies Detected</p>
            <p className="text-3xl font-bold text-foreground">{data.anomalies.length}</p>
            <Badge variant={data.hasAnomalies ? 'destructive' : 'default'} className="mt-2">
              {data.hasAnomalies ? 'Issues Found' : 'No Issues'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {data.anomalies.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Detected Anomalies</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.anomalies.map((anomaly, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      anomaly.severity === 'high' ? 'text-red-500' :
                      anomaly.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <span className="font-medium text-foreground">{anomaly.subject}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{anomaly.type.replace(/-/g, ' ')}</Badge>
                    <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'} className="capitalize text-xs">{anomaly.severity}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Internal: {anomaly.internalScore}% | External: {anomaly.externalScore}% | Expected: {anomaly.expectedRange}</p>
                  <p className="text-primary">Action: {anomaly.suggestedAction}</p>
                  {anomaly.possibleCauses.length > 0 && (
                    <p>Possible causes: {anomaly.possibleCauses.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!data.hasAnomalies && (
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <Activity className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-foreground font-medium">No anomalies detected</p>
            <p className="text-sm text-muted-foreground">Your performance is consistent across subjects</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const SubjectCorrelationView = ({ data }: { data: SubjectCorrelation }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {data.strongestPositive.subjects.length >= 2 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-foreground">Strongest Positive Correlation</p>
              </div>
              <p className="font-semibold text-foreground">{data.strongestPositive.subjects.join(' ↔ ')}</p>
              <p className="text-sm text-muted-foreground mt-1">{data.strongestPositive.meaning}</p>
              <Badge variant="default" className="mt-2">Strength: {(data.strongestPositive.strength * 100).toFixed(0)}%</Badge>
            </CardContent>
          </Card>
        )}
        {data.strongestNegative.subjects.length >= 2 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-foreground">Strongest Negative Correlation</p>
              </div>
              <p className="font-semibold text-foreground">{data.strongestNegative.subjects.join(' ↔ ')}</p>
              <p className="text-sm text-muted-foreground mt-1">{data.strongestNegative.meaning}</p>
              <Badge variant="destructive" className="mt-2">Strength: {(Math.abs(data.strongestNegative.strength) * 100).toFixed(0)}%</Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {data.correlations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Subject Pair Correlations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.correlations.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{c.subject1} ↔ {c.subject2}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.direction === 'positive' ? 'default' : c.direction === 'negative' ? 'destructive' : 'secondary'} className="capitalize text-xs">
                    {c.direction}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{(c.correlationStrength * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.internalExternalGaps.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Internal vs External Gaps</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.internalExternalGaps.map((gap, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{gap.subject}</span>
                  <Badge variant="outline" className="text-xs capitalize">{gap.direction.replace(/-/g, ' ')}</Badge>
                </div>
                <Progress value={Math.min(gap.gap, 100)} className="h-1.5 my-1" />
                <p className="text-xs text-muted-foreground">{gap.insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Cross-Subject Insights</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.crossSubjectInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground">
                <GitBranch className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
