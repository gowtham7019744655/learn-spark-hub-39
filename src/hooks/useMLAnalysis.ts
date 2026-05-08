import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrendForecasting {
  currentTrajectory: 'improving' | 'stable' | 'declining';
  predictedNextSemesterAvg: number;
  semesterTrends: { semester: number; avgScore: number; trend: string }[];
  forecastConfidence: number;
  projections: { timeframe: string; predictedAvg: number; bestCase: number; worstCase: number }[];
  trendInsights: string[];
}

export interface Clustering {
  studentCluster: string;
  clusterDescription: string;
  clusterConfidence: number;
  subjectClusters: { cluster: string; subjects: string[]; avgScore: number; recommendation: string }[];
  peerComparison: { estimatedPercentile: number; standingDescription: string };
}

export interface AnomalyDetection {
  hasAnomalies: boolean;
  anomalies: {
    subject: string;
    type: string;
    severity: string;
    description: string;
    internalScore: number;
    externalScore: number;
    expectedRange: string;
    possibleCauses: string[];
    suggestedAction: string;
  }[];
  overallConsistency: number;
  consistencyVerdict: string;
}

export interface SubjectCorrelation {
  correlations: {
    subject1: string;
    subject2: string;
    correlationStrength: number;
    direction: string;
    insight: string;
  }[];
  strongestPositive: { subjects: string[]; strength: number; meaning: string };
  strongestNegative: { subjects: string[]; strength: number; meaning: string };
  internalExternalGaps: { subject: string; gap: number; direction: string; insight: string }[];
  crossSubjectInsights: string[];
}

export interface MLAnalysis {
  trendForecasting: TrendForecasting;
  clustering: Clustering;
  anomalyDetection: AnomalyDetection;
  subjectCorrelation: SubjectCorrelation;
}

export const useMLAnalysis = () => {
  const [analysis, setAnalysis] = useState<MLAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeSession = session?.expires_at && session.expires_at * 1000 <= Date.now()
        ? (await supabase.auth.refreshSession()).data.session
        : session;

      if (!activeSession?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error: invokeError } = await supabase.functions.invoke('ml-analysis', {
        body: {},
      });

      if (invokeError) {
        const context = invokeError.context as Response | undefined;
        if (context?.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
        if (context?.status === 402) throw new Error('Usage limit reached.');
        throw new Error(invokeError.message || 'Failed to get analysis');
      }

      setAnalysis(data.analysis);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get analysis';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analysis, loading, error, fetchAnalysis };
};
