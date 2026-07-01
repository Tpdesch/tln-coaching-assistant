import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const clientProfileId = body.client_profile_id;
    const monthInput = body.month; // expected "YYYY-MM"

    if (!clientProfileId) {
      return Response.json({ error: 'client_profile_id is required' }, { status: 400 });
    }
    if (!monthInput || !/^\d{4}-\d{2}$/.test(monthInput)) {
      return Response.json({ error: 'month is required in YYYY-MM format' }, { status: 400 });
    }

    // Compute date range for the month
    const [yearStr, monthStr] = monthInput.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-based
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);

    // 1. Fetch all interactions and inference runs for this client
    const [allInteractions, allRuns] = await Promise.all([
      base44.asServiceRole.entities.Interactions.filter({ client_profile_id: clientProfileId }),
      base44.asServiceRole.entities.InferenceRuns.filter({ client_profile_id: clientProfileId }),
    ]);

    // 2. Filter to the target month
    const inMonth = (d) => {
      if (!d) return false;
      const dateStr = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      return dateStr >= monthStartStr && dateStr <= monthEndStr;
    };

    const monthlyInteractions = allInteractions.filter(i => inMonth(i.created_date) || inMonth(i.week_ending_date));
    const monthlyRuns = allRuns.filter(r => inMonth(r.created_date));

    // 3. Sort chronologically
    const sortByDate = (a, b) => new Date(a.created_date) - new Date(b.created_date);
    monthlyInteractions.sort(sortByDate);
    monthlyRuns.sort(sortByDate);

    // 4. Build raw metrics for the LLM prompt
    const aciValues = monthlyRuns.map(r => r.aci).filter(v => typeof v === 'number');
    const avgAci = aciValues.length > 0 ? aciValues.reduce((a, b) => a + b, 0) / aciValues.length : null;
    const highestAci = aciValues.length > 0 ? Math.max(...aciValues) : null;
    const lowestAci = aciValues.length > 0 ? Math.min(...aciValues) : null;

    // Thought vs Action monthly averages (levels 1-5)
    const thoughtKeys = ['thought_l1', 'thought_l2', 'thought_l3', 'thought_l4', 'thought_l5'];
    const actionKeys = ['action_l1', 'action_l2', 'action_l3', 'action_l4', 'action_l5'];
    const avgLevel = (keys) => {
      const sums = [0, 0, 0, 0, 0];
      const counts = [0, 0, 0, 0, 0];
      monthlyInteractions.forEach(i => {
        keys.forEach((k, idx) => {
          const v = i[k];
          if (typeof v === 'number') { sums[idx] += v; counts[idx]++; }
        });
      });
      return sums.map((s, idx) => counts[idx] > 0 ? Math.round((s / counts[idx]) * 100) / 100 : null);
    };
    const thoughtAvg = avgLevel(thoughtKeys);
    const actionAvg = avgLevel(actionKeys);

    // Drift patterns (derailers) frequency
    const derailerCounts = {};
    monthlyRuns.forEach(r => {
      const patterns = r.drift_patterns || [];
      patterns.forEach(p => {
        const label = p.label || p.name || p.pattern || p.description || JSON.stringify(p);
        derailerCounts[label] = (derailerCounts[label] || 0) + 1;
      });
    });
    const topDerailers = Object.entries(derailerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    // Alignment momentum directions
    const momentumDirections = {};
    monthlyRuns.forEach(r => {
      const dir = r.alignment_momentum_direction;
      if (dir) momentumDirections[dir] = (momentumDirections[dir] || 0) + 1;
    });

    // Reflection themes (free text and commitment text)
    const reflections = monthlyInteractions
      .map(i => i.reflection_text || i.free_text || i.commitment_text)
      .filter(Boolean);

    // Gap analysis from runs
    const gapAnalysis = monthlyRuns.map(r => r.gap_analysis).filter(Boolean);

    // Trend: latest ACI - oldest ACI
    let aciTrend = null;
    if (aciValues.length >= 2) {
      aciTrend = Math.round((aciValues[aciValues.length - 1] - aciValues[0]) * 100) / 100;
    }

    // Alignment trend 4wk from runs (if available)
    const alignmentTrends = monthlyRuns.map(r => r.alignment_trend_4wk).filter(v => typeof v === 'number');

    // 5. Build the LLM prompt
    const dataPacket = {
      month: monthInput,
      client_profile_id: clientProfileId,
      total_interactions: monthlyInteractions.length,
      total_inference_runs: monthlyRuns.length,
      aci_summary: {
        average: avgAci,
        highest: highestAci,
        lowest: lowestAci,
        trend: aciTrend,
        all_values: aciValues,
      },
      thought_monthly_averages: thoughtAvg,
      action_monthly_averages: actionAvg,
      most_frequent_derailers: topDerailers,
      alignment_momentum_directions: momentumDirections,
      alignment_trend_4wk_values: alignmentTrends,
      gap_analyses: gapAnalysis,
      reflection_texts: reflections,
      interactions: monthlyInteractions.map(i => ({
        created_date: i.created_date,
        week_ending_date: i.week_ending_date,
        reflection_text: i.reflection_text,
        free_text: i.free_text,
        commitment_text: i.commitment_text,
        leadership_gap: i.leadership_gap,
        leadership_gap_direction: i.leadership_gap_direction,
        leadership_gap_interpretation: i.leadership_gap_interpretation,
        alignment_rating: i.alignment_rating,
        stress_rating: i.stress_rating,
        tags: i.tags,
        alignment_momentum_score: i.alignment_momentum_score,
        alignment_momentum_direction: i.alignment_momentum_direction,
        alignment_momentum_summary: i.alignment_momentum_summary,
      })),
      inference_runs: monthlyRuns.map(r => ({
        created_date: r.created_date,
        aci: r.aci,
        aci_delta: r.aci_delta,
        primary_level: r.primary_level,
        drift_patterns: r.drift_patterns,
        gap_analysis: r.gap_analysis,
        gap_companion: r.gap_companion,
        alignment_momentum_score: r.alignment_momentum_score,
        alignment_momentum_direction: r.alignment_momentum_direction,
        alignment_momentum_summary: r.alignment_momentum_summary,
        alignment_trend_4wk: r.alignment_trend_4wk,
        gap_trend_4wk: r.gap_trend_4wk,
        coach_reflection_text: r.coach_reflection_text,
      })),
    };

    const prompt = `You are a senior leadership development analyst. Analyze the following monthly coaching data for a participant and produce a structured leadership review.

DATA:
${JSON.stringify(dataPacket, null, 2)}

Produce a comprehensive monthly leadership review. Return ONLY a JSON object matching this schema:
{
  "executive_summary": "A concise 3-5 sentence overview of the participant's month, key themes, and overall trajectory.",
  "alignment_metrics": {
    "average_aci": number or null,
    "highest_aci": number or null,
    "lowest_aci": number or null,
    "trend": "improving | declining | stable | insufficient_data",
    "trend_description": "Brief explanation of the ACI trend across the month."
  },
  "most_frequent_derailers": [
    { "pattern": "Name of the derailer/drift pattern", "frequency": number, "impact": "Brief description of impact on leadership alignment." }
  ],
  "thought_vs_action": {
    "thought_monthly_averages": [5 numbers or nulls for levels 1-5],
    "action_monthly_averages": [5 numbers or nulls for levels 1-5],
    "analysis": "Brief interpretation of the gap between thought and action levels."
  },
  "growth_momentum": {
    "direction": "improving | declining | stable | emerging | insufficient_data",
    "summary": "Summary of alignment momentum and growth trajectory."
  },
  "reflection_themes": [
    { "theme": "Theme name", "description": "Brief description of what the participant reflected on." }
  ],
  "suggested_coaching_conversation": "2-4 sentences with a suggested focus area and opening question for the next coaching session.",
  "recommended_priorities": [
    { "priority": "Priority title", "rationale": "Why this matters based on the data." }
  ]
}`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          alignment_metrics: {
            type: "object",
            properties: {
              average_aci: { type: ["number", "null"] },
              highest_aci: { type: ["number", "null"] },
              lowest_aci: { type: ["number", "null"] },
              trend: { type: "string" },
              trend_description: { type: "string" },
            },
          },
          most_frequent_derailers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                frequency: { type: "number" },
                impact: { type: "string" },
              },
            },
          },
          thought_vs_action: {
            type: "object",
            properties: {
              thought_monthly_averages: { type: "array", items: { type: ["number", "null"] } },
              action_monthly_averages: { type: "array", items: { type: ["number", "null"] } },
              analysis: { type: "string" },
            },
          },
          growth_momentum: {
            type: "object",
            properties: {
              direction: { type: "string" },
              summary: { type: "string" },
            },
          },
          reflection_themes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                theme: { type: "string" },
                description: { type: "string" },
              },
            },
          },
          suggested_coaching_conversation: { type: "string" },
          recommended_priorities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority: { type: "string" },
                rationale: { type: "string" },
              },
            },
          },
        },
      },
      model: "claude_sonnet_4_6",
    });

    return Response.json({
      client_profile_id: clientProfileId,
      month: monthInput,
      generated_at: new Date().toISOString(),
      raw_metrics: {
        total_interactions: monthlyInteractions.length,
        total_inference_runs: monthlyRuns.length,
        aci_summary: { average: avgAci, highest: highestAci, lowest: lowestAci, trend: aciTrend, all_values: aciValues },
        thought_monthly_averages: thoughtAvg,
        action_monthly_averages: actionAvg,
        most_frequent_derailers: topDerailers,
        alignment_momentum_directions: momentumDirections,
      },
      review: llmResponse,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});