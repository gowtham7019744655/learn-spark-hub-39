import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { data: profile } = await supabase
      .from("profiles")
      .select("usn")
      .eq("id", userId)
      .single();

    if (!profile?.usn) {
      return new Response(JSON.stringify({ error: "Profile not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student marks with subjects
    const { data: marks, error: marksError } = await supabase
      .from("student_marks")
      .select(`*, subjects (id, name, max_internal, max_external, semester)`)
      .eq("student_usn", profile.usn);

    if (marksError) {
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!marks || marks.length === 0) {
      return new Response(JSON.stringify({
        analysis: null,
        message: "No marks data available for analysis",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare performance data
    const performanceData = marks.map((mark: any) => ({
      subject: mark.subjects?.name || "Unknown",
      subjectId: mark.subjects?.id,
      semester: mark.subjects?.semester || 1,
      internal: mark.internal_marks,
      maxInternal: mark.subjects?.max_internal || 50,
      external: mark.external_marks,
      maxExternal: mark.subjects?.max_external || 100,
      grade: mark.grade,
      internalPct: Math.round((mark.internal_marks / (mark.subjects?.max_internal || 50)) * 100),
      externalPct: Math.round((mark.external_marks / (mark.subjects?.max_external || 100)) * 100),
      totalPct: Math.round(((mark.internal_marks + mark.external_marks) /
        ((mark.subjects?.max_internal || 50) + (mark.subjects?.max_external || 100))) * 100),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Server configuration error");
    }

    const systemPrompt = `You are an advanced educational data science AI. You perform 4 types of ML analysis on student performance data. Respond ONLY with valid JSON.`;

    const userPrompt = `Analyze this student's performance data using 4 ML models:

Data:
${performanceData.map((s: any) => `- ${s.subject} (Sem ${s.semester}): Internal ${s.internalPct}%, External ${s.externalPct}%, Total ${s.totalPct}%, Grade: ${s.grade || 'N/A'}`).join('\n')}

Perform ALL 4 analyses and return this exact JSON:
{
  "trendForecasting": {
    "currentTrajectory": "<improving|stable|declining>",
    "predictedNextSemesterAvg": <number 0-100>,
    "semesterTrends": [
      {"semester": <number>, "avgScore": <number>, "trend": "<up|down|stable>"}
    ],
    "forecastConfidence": <number 0-100>,
    "projections": [
      {"timeframe": "<string>", "predictedAvg": <number>, "bestCase": <number>, "worstCase": <number>}
    ],
    "trendInsights": ["<insight 1>", "<insight 2>", "<insight 3>"]
  },
  "clustering": {
    "studentCluster": "<high-achiever|consistent-performer|improving|at-risk|needs-support>",
    "clusterDescription": "<description of what this cluster means>",
    "clusterConfidence": <number 0-100>,
    "subjectClusters": [
      {"cluster": "<strong|average|weak>", "subjects": ["<subject names>"], "avgScore": <number>, "recommendation": "<action>"}
    ],
    "peerComparison": {
      "estimatedPercentile": <number 0-100>,
      "standingDescription": "<description>"
    }
  },
  "anomalyDetection": {
    "hasAnomalies": <boolean>,
    "anomalies": [
      {
        "subject": "<subject name>",
        "type": "<sudden-drop|unusual-gap|inconsistency|outlier>",
        "severity": "<low|medium|high>",
        "description": "<what was detected>",
        "internalScore": <number>,
        "externalScore": <number>,
        "expectedRange": "<expected range string>",
        "possibleCauses": ["<cause 1>", "<cause 2>"],
        "suggestedAction": "<action>"
      }
    ],
    "overallConsistency": <number 0-100>,
    "consistencyVerdict": "<highly-consistent|mostly-consistent|some-variation|inconsistent|highly-inconsistent>"
  },
  "subjectCorrelation": {
    "correlations": [
      {
        "subject1": "<name>",
        "subject2": "<name>",
        "correlationStrength": <number -1 to 1>,
        "direction": "<positive|negative|neutral>",
        "insight": "<what this means for the student>"
      }
    ],
    "strongestPositive": {"subjects": ["<name>", "<name>"], "strength": <number>, "meaning": "<description>"},
    "strongestNegative": {"subjects": ["<name>", "<name>"], "strength": <number>, "meaning": "<description>"},
    "internalExternalGaps": [
      {"subject": "<name>", "gap": <number>, "direction": "<internal-stronger|external-stronger>", "insight": "<what this means>"}
    ],
    "crossSubjectInsights": ["<insight 1>", "<insight 2>", "<insight 3>"]
  }
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to get AI analysis");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    let analysis;
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) ||
                        aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response, using fallback");
      analysis = buildFallbackAnalysis(performanceData);
    }

    return new Response(JSON.stringify({
      analysis,
      performanceData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ml-analysis:", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildFallbackAnalysis(data: any[]) {
  const avg = Math.round(data.reduce((a: number, s: any) => a + s.totalPct, 0) / data.length);
  const weak = data.filter((s: any) => s.totalPct < 50);
  const strong = data.filter((s: any) => s.totalPct >= 70);

  return {
    trendForecasting: {
      currentTrajectory: avg >= 60 ? "stable" : "declining",
      predictedNextSemesterAvg: avg,
      semesterTrends: [{ semester: 1, avgScore: avg, trend: "stable" }],
      forecastConfidence: 50,
      projections: [{ timeframe: "Next Semester", predictedAvg: avg, bestCase: Math.min(avg + 10, 100), worstCase: Math.max(avg - 10, 0) }],
      trendInsights: ["Insufficient historical data for detailed trend analysis"],
    },
    clustering: {
      studentCluster: avg >= 70 ? "consistent-performer" : avg >= 50 ? "improving" : "at-risk",
      clusterDescription: `Based on average score of ${avg}%`,
      clusterConfidence: 50,
      subjectClusters: [
        { cluster: "strong", subjects: strong.map((s: any) => s.subject), avgScore: strong.length ? Math.round(strong.reduce((a: number, s: any) => a + s.totalPct, 0) / strong.length) : 0, recommendation: "Maintain current effort" },
        { cluster: "weak", subjects: weak.map((s: any) => s.subject), avgScore: weak.length ? Math.round(weak.reduce((a: number, s: any) => a + s.totalPct, 0) / weak.length) : 0, recommendation: "Focus additional study time" },
      ],
      peerComparison: { estimatedPercentile: avg, standingDescription: `Estimated ${avg}th percentile` },
    },
    anomalyDetection: {
      hasAnomalies: false,
      anomalies: [],
      overallConsistency: 70,
      consistencyVerdict: "mostly-consistent",
    },
    subjectCorrelation: {
      correlations: [],
      strongestPositive: { subjects: [], strength: 0, meaning: "Insufficient data" },
      strongestNegative: { subjects: [], strength: 0, meaning: "Insufficient data" },
      internalExternalGaps: data.map((s: any) => ({
        subject: s.subject,
        gap: Math.abs(s.internalPct - s.externalPct),
        direction: s.internalPct > s.externalPct ? "internal-stronger" : "external-stronger",
        insight: `${Math.abs(s.internalPct - s.externalPct)}% gap between internal and external`,
      })),
      crossSubjectInsights: ["More data needed for cross-subject analysis"],
    },
  };
}
