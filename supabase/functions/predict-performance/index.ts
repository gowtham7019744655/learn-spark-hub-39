import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's USN from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("usn")
      .eq("id", user.id)
      .single();

    if (!profile?.usn) {
      return new Response(JSON.stringify({ error: "No USN found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student marks with subjects
    const { data: marks, error: marksError } = await supabase
      .from("student_marks")
      .select(`
        *,
        subjects (
          id,
          name,
          max_internal,
          max_external,
          semester
        )
      `)
      .eq("student_usn", profile.usn);

    if (marksError) {
      console.error("Error fetching marks:", marksError);
      return new Response(JSON.stringify({ error: "Failed to fetch marks" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!marks || marks.length === 0) {
      return new Response(JSON.stringify({ 
        prediction: null,
        message: "No marks data available for prediction" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare performance data for AI analysis
    const performanceData = marks.map((mark: any) => ({
      subject: mark.subjects?.name || "Unknown",
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

    // Calculate overall stats
    const avgPerformance = Math.round(
      performanceData.reduce((acc: number, s: any) => acc + s.totalPct, 0) / performanceData.length
    );
    const weakSubjects = performanceData.filter((s: any) => s.totalPct < 50);
    const strongSubjects = performanceData.filter((s: any) => s.totalPct >= 70);

    // Call Lovable AI for prediction
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an educational performance prediction AI. Analyze student performance data and provide:
1. A predicted final semester score (0-100)
2. Risk level (low/medium/high) of failing
3. Top 3 specific, actionable improvement recommendations
4. Predicted grade if current trajectory continues
5. Time estimate to reach target score of 70%

Be data-driven and specific. Use the actual subject names and scores in your analysis.
Respond in valid JSON format only.`;

    const userPrompt = `Analyze this student's performance data:

Current Average: ${avgPerformance}%
Total Subjects: ${performanceData.length}
Weak Subjects (below 50%): ${weakSubjects.length}
Strong Subjects (above 70%): ${strongSubjects.length}

Subject-wise breakdown:
${performanceData.map((s: any) => `- ${s.subject}: Internal ${s.internalPct}%, External ${s.externalPct}%, Total ${s.totalPct}%, Grade: ${s.grade || 'N/A'}`).join('\n')}

Provide prediction in this exact JSON format:
{
  "predictedScore": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "predictedGrade": "<grade letter>",
  "confidenceScore": <number 0-100>,
  "weeksToTarget": <number or null if already at target>,
  "recommendations": [
    {"priority": 1, "action": "<specific action>", "subject": "<subject name or 'General'>", "impact": "<expected improvement>"},
    {"priority": 2, "action": "<specific action>", "subject": "<subject name or 'General'>", "impact": "<expected improvement>"},
    {"priority": 3, "action": "<specific action>", "subject": "<subject name or 'General'>", "impact": "<expected improvement>"}
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "summary": "<2-3 sentence summary of the student's performance and outlook>"
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
        temperature: 0.3,
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
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("Failed to get AI prediction");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let prediction;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      prediction = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Fallback prediction based on data
      prediction = {
        predictedScore: avgPerformance,
        riskLevel: avgPerformance < 40 ? "high" : avgPerformance < 60 ? "medium" : "low",
        predictedGrade: avgPerformance >= 80 ? "A" : avgPerformance >= 60 ? "B" : avgPerformance >= 40 ? "C" : "F",
        confidenceScore: 60,
        weeksToTarget: avgPerformance >= 70 ? null : Math.ceil((70 - avgPerformance) / 5),
        recommendations: [
          { priority: 1, action: "Focus on weakest subjects", subject: weakSubjects[0]?.subject || "General", impact: "+10% improvement" },
          { priority: 2, action: "Maintain consistent study schedule", subject: "General", impact: "+5% improvement" },
          { priority: 3, action: "Practice previous exam questions", subject: "General", impact: "+8% improvement" },
        ],
        strengths: strongSubjects.slice(0, 2).map((s: any) => `Strong in ${s.subject}`),
        weaknesses: weakSubjects.slice(0, 2).map((s: any) => `Needs improvement in ${s.subject}`),
        summary: `Current performance at ${avgPerformance}% with ${weakSubjects.length} subjects needing attention.`,
      };
    }

    return new Response(JSON.stringify({
      prediction,
      performanceData,
      stats: {
        avgPerformance,
        totalSubjects: performanceData.length,
        weakCount: weakSubjects.length,
        strongCount: strongSubjects.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in predict-performance:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
