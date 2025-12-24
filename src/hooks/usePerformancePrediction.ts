import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Recommendation {
  priority: number;
  action: string;
  subject: string;
  impact: string;
}

export interface PerformancePrediction {
  predictedScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  predictedGrade: string;
  confidenceScore: number;
  weeksToTarget: number | null;
  recommendations: Recommendation[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

interface PredictionResponse {
  prediction: PerformancePrediction | null;
  performanceData: any[];
  stats: {
    avgPerformance: number;
    totalSubjects: number;
    weakCount: number;
    strongCount: number;
  };
}

export const usePerformancePrediction = () => {
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-performance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('Usage limit reached.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get prediction');
      }

      const data: PredictionResponse = await response.json();
      setPrediction(data.prediction);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get prediction';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prediction,
    loading,
    error,
    fetchPrediction,
  };
};
