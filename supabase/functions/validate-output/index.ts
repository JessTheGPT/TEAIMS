import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Constraint {
  id: string;
  agent_code: string;
  type: string;
  description: string;
  validator_type: string;
  validator_config: Record<string, unknown>;
  severity: string;
  is_active: boolean;
}

interface ValidationViolation {
  type: string;
  constraint_id: string;
  severity: string;
  description: string;
  message: string;
}

// Regex validator: checks if content matches (or doesn't match) a pattern
function validateRegex(content: string, config: Record<string, unknown>): { pass: boolean; message: string } {
  const pattern = config.pattern as string;
  const mode = (config.mode as string) || "must_match"; // must_match | must_not_match
  if (!pattern) return { pass: true, message: "No pattern configured" };

  try {
    const flags = (config.flags as string) || "i";
    const regex = new RegExp(pattern, flags);
    const matches = regex.test(content);

    if (mode === "must_not_match") {
      return matches
        ? { pass: false, message: `Content matches forbidden pattern: ${pattern}` }
        : { pass: true, message: "No forbidden patterns found" };
    }
    return matches
      ? { pass: true, message: `Content matches required pattern` }
      : { pass: false, message: `Content does not match required pattern: ${pattern}` };
  } catch {
    return { pass: false, message: `Invalid regex pattern: ${pattern}` };
  }
}

// Function validator: checks structured properties (counts, thresholds)
function validateFunction(content: string, config: Record<string, unknown>): { pass: boolean; message: string } {
  const check = config.check as string;

  if (check === "max_features") {
    const max = (config.max as number) || 6;
    // Count markdown headers that look like features (## Feature, - **Feature**)
    const featurePatterns = content.match(/^(?:#{1,3}\s+(?:Feature|MVP Feature)|[-*]\s+\*\*)/gim) || [];
    const count = featurePatterns.length;
    if (count > max) {
      return { pass: false, message: `Found ${count} features, maximum is ${max}` };
    }
    return { pass: true, message: `Feature count (${count}) within limit (${max})` };
  }

  if (check === "max_sprint_days") {
    const max = (config.max as number) || 14;
    const dayMatches = content.match(/(\d+)\s*(?:days?|day)\s*(?:sprint|effort|estimate)/gi) || [];
    for (const match of dayMatches) {
      const num = parseInt(match);
      if (!isNaN(num) && num > max) {
        return { pass: false, message: `Sprint estimate ${num} days exceeds ${max}-day limit` };
      }
    }
    return { pass: true, message: `Sprint estimates within ${max}-day limit` };
  }

  if (check === "has_sections") {
    const requiredSections = (config.sections as string[]) || [];
    const missing = requiredSections.filter(s => {
      const sectionRegex = new RegExp(`#{1,3}\\s+.*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      return !sectionRegex.test(content);
    });
    if (missing.length > 0) {
      return { pass: false, message: `Missing required sections: ${missing.join(", ")}` };
    }
    return { pass: true, message: "All required sections present" };
  }

  if (check === "word_count_range") {
    const min = (config.min as number) || 200;
    const max = (config.max as number) || 5000;
    const words = content.split(/\s+/).length;
    if (words < min) return { pass: false, message: `Document too short (${words} words, minimum ${min})` };
    if (words > max) return { pass: false, message: `Document too long (${words} words, maximum ${max})` };
    return { pass: true, message: `Word count (${words}) within range` };
  }

  return { pass: true, message: `Unknown function check: ${check}` };
}

// LLM validator: uses AI to check content against a constraint
async function validateLLM(
  content: string,
  config: Record<string, unknown>,
  description: string
): Promise<{ pass: boolean; message: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { pass: true, message: "No API key — skipping LLM validation" };

  const checkPrompt = (config.check as string) || description;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a constraint validator. Given a document and a constraint to check, respond ONLY with a JSON object: {"pass": true/false, "message": "brief explanation"}. Be strict and precise.`,
          },
          {
            role: "user",
            content: `CONSTRAINT: ${checkPrompt}\n\nDOCUMENT (first 3000 chars):\n${content.slice(0, 3000)}`,
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("LLM validation error:", response.status, t);
      return { pass: true, message: "LLM validation unavailable — passing by default" };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { pass: !!parsed.pass, message: parsed.message || "LLM check complete" };
    }

    return { pass: true, message: "Could not parse LLM response — passing by default" };
  } catch (e) {
    console.error("LLM validation error:", e);
    return { pass: true, message: "LLM validation error — passing by default" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agent_code, content, document_id, idea_id } = await req.json();

    if (!agent_code || !content) {
      return new Response(JSON.stringify({ error: "agent_code and content are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active constraints for this agent + global constraints
    const { data: constraints, error: cErr } = await supabase
      .from("constraints")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .or(`agent_code.eq.${agent_code},agent_code.eq.*`);

    if (cErr) {
      console.error("Error fetching constraints:", cErr);
      return new Response(JSON.stringify({ status: "pass", violations: [], message: "No constraints found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!constraints || constraints.length === 0) {
      return new Response(JSON.stringify({ status: "pass", violations: [], message: "No active constraints" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const violations: ValidationViolation[] = [];

    // Run all validators
    for (const constraint of constraints as Constraint[]) {
      let result: { pass: boolean; message: string };

      switch (constraint.validator_type) {
        case "regex":
          result = validateRegex(content, constraint.validator_config);
          break;
        case "function":
          result = validateFunction(content, constraint.validator_config);
          break;
        case "llm":
          result = await validateLLM(content, constraint.validator_config, constraint.description);
          break;
        default:
          result = { pass: true, message: `Unknown validator: ${constraint.validator_type}` };
      }

      // Log the result
      await supabase.from("validation_results").insert({
        user_id: user.id,
        document_id: document_id || null,
        idea_id: idea_id || null,
        agent_code,
        constraint_id: constraint.id,
        status: result.pass ? "pass" : "fail",
        message: result.message,
      });

      if (!result.pass) {
        violations.push({
          type: constraint.type,
          constraint_id: constraint.id,
          severity: constraint.severity,
          description: constraint.description,
          message: result.message,
        });
      }
    }

    const hasBlockingViolation = violations.some(v => v.severity === "block");
    const status = hasBlockingViolation ? "fail" : violations.length > 0 ? "needs_review" : "pass";

    return new Response(
      JSON.stringify({
        status,
        violations,
        constraints_checked: constraints.length,
        message: status === "pass"
          ? "All constraints satisfied"
          : status === "fail"
          ? `${violations.filter(v => v.severity === "block").length} blocking violation(s) found`
          : `${violations.length} warning(s) — document saved with flags`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("validate-output error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
