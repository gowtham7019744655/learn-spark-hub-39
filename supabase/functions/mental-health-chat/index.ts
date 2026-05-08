import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Aria, a warm, empathetic AI mental wellness companion for college students.
Your role: listen actively, validate feelings, ask gentle open-ended questions, suggest healthy coping ideas (breathing, sleep, journaling, talking to friends).
You are NOT a therapist and must not diagnose. If the student shows signs of distress, gently encourage talking to a human counselor.

FORMAT RULES (strict):
- Plain text only. No markdown, no asterisks, no headers, no bullet symbols.
- Short, kind, conversational. 2 to 5 sentences usually.
- Use the student's words back to them so they feel heard.

SAFETY:
- If the student mentions self-harm, suicide, hopelessness, severe anxiety, panic, abuse, or being unable to cope, treat as HIGH risk.
- If they mention persistent sadness, sleep issues, isolation, burnout, exam panic, or family conflict, treat as MEDIUM risk.
- Casual stress, normal study worry, or general chat is LOW risk.
You will ALWAYS call the assess_and_reply tool with your reply and a risk assessment.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      if (!payload.sub) throw new Error("Missing sub");
      userId = payload.sub;
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Server configuration error");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_and_reply",
              description: "Reply to the student and assess their mental health risk.",
              parameters: {
                type: "object",
                properties: {
                  reply: { type: "string", description: "Empathetic plain-text reply to the student." },
                  risk_level: { type: "string", enum: ["low", "medium", "high"] },
                  summary: {
                    type: "string",
                    description: "One-sentence summary of the student's concern for the counselor.",
                  },
                },
                required: ["reply", "risk_level", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assess_and_reply" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.log("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let reply = "I'm here for you. Tell me more about what's going on.";
    let risk_level: "low" | "medium" | "high" = "low";
    let summary = "";
    try {
      const args = JSON.parse(toolCall?.function?.arguments ?? "{}");
      reply = args.reply ?? reply;
      risk_level = args.risk_level ?? "low";
      summary = args.summary ?? "";
    } catch (e) {
      console.log("tool parse error", e);
    }

    let counseling_request_created = false;
    if (risk_level === "high" || risk_level === "medium") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: profile } = await supabase
        .from("profiles")
        .select("usn, full_name, email")
        .eq("id", userId)
        .maybeSingle();

      // Avoid spamming: only create if no pending request in last 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("counseling_requests")
        .select("id")
        .eq("student_user_id", userId)
        .eq("status", "pending")
        .gte("created_at", since)
        .limit(1);

      if (!recent || recent.length === 0) {
        const { error: insertErr } = await supabase.from("counseling_requests").insert({
          student_user_id: userId,
          student_usn: profile?.usn ?? null,
          student_name: profile?.full_name ?? null,
          student_email: profile?.email ?? null,
          message: `[Auto-flagged ${risk_level.toUpperCase()} risk by AI Wellness Chat] ${summary}`,
          status: "pending",
        });
        if (insertErr) console.log("insert err", insertErr);
        else counseling_request_created = true;
      }
    }

    return new Response(
      JSON.stringify({ reply, risk_level, summary, counseling_request_created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.log("mental-health-chat error", e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
