import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const clientProfileId = body.client_profile_id;
    const monthInput = body.month; // "YYYY-MM"

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

    // 1. Fetch client profile
    const clientProfile = await base44.asServiceRole.entities.Profiles.get(clientProfileId);
    if (!clientProfile) {
      return Response.json({ error: 'Client profile not found' }, { status: 404 });
    }

    // 2. Authorization: platform admin or the client's assigned coach
    const callerProfiles = await base44.asServiceRole.entities.Profiles.filter({ base44_user_id: user.id });
    const callerProfile = Array.isArray(callerProfiles) ? callerProfiles[0] : null;
    const isPlatformAdmin = user.role === 'admin' || callerProfile?.role === 'admin' || callerProfile?.role === 'coach_admin';

    // 3. Fetch client record + coach profile for metadata
    let clientRecord = null;
    let coachProfile = null;
    if (clientProfile.base44_user_id) {
      const clientRows = await base44.asServiceRole.entities.Client.filter({ base44_user_id: clientProfile.base44_user_id });
      clientRecord = Array.isArray(clientRows) ? clientRows[0] : null;
      if (clientRecord?.coach_id) {
        coachProfile = await base44.asServiceRole.entities.Profiles.get(clientRecord.coach_id).catch(() => null);
      }
    }

    if (!isPlatformAdmin) {
      const isAssignedCoach = callerProfile?.id === clientRecord?.coach_id;
      if (!isAssignedCoach) {
        return Response.json({ error: 'Not authorized to view this client' }, { status: 403 });
      }
    }

    // 4. Fetch all interactions and inference runs for this client
    const [allInteractions, allRuns] = await Promise.all([
      base44.asServiceRole.entities.Interactions.filter({ client_profile_id: clientProfileId }),
      base44.asServiceRole.entities.InferenceRuns.filter({ client_profile_id: clientProfileId }),
    ]);

    // 5. Filter to the target month
    const inMonth = (d) => {
      if (!d) return false;
      const dateStr = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      return dateStr >= monthStartStr && dateStr <= monthEndStr;
    };

    const monthlyInteractions = allInteractions.filter(i => inMonth(i.created_date) || inMonth(i.week_ending_date));
    const monthlyRuns = allRuns.filter(r => inMonth(r.created_date));

    // 6. Sort chronologically
    monthlyInteractions.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    monthlyRuns.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    // 7. Build raw metrics
    const aciValues = monthlyRuns.map(r => r.aci).filter(v => typeof v === 'number');
    const avgAci = aciValues.length > 0 ? aciValues.reduce((a, b) => a + b, 0) / aciValues.length : null;
    const highestAci = aciValues.length > 0 ? Math.max(...aciValues) : null;
    const lowestAci = aciValues.length > 0 ? Math.min(...aciValues) : null;

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
      return sums.map((s, idx) => counts[idx] > 0 ? Math.round((s / counts[idx]) * 100) / 100 : 0);
    };
    const thoughtAvg = avgLevel(thoughtKeys);
    const actionAvg = avgLevel(actionKeys);

    const thoughtAverages = {
      level_1: thoughtAvg[0], level_2: thoughtAvg[1], level_3: thoughtAvg[2],
      level_4: thoughtAvg[3], level_5: thoughtAvg[4],
    };
    const actionAverages = {
      level_1: actionAvg[0], level_2: actionAvg[1], level_3: actionAvg[2],
      level_4: actionAvg[3], level_5: actionAvg[4],
    };

    // Drift patterns frequency
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

    // Reflection themes
    const reflections = monthlyInteractions
      .map(i => i.reflection_text || i.free_text || i.commitment_text)
      .filter(Boolean);

    // Gap analysis from runs
    const gapAnalysis = monthlyRuns.map(r => r.gap_analysis).filter(Boolean);

    // ACI trend
    let aciTrend = null;
    if (aciValues.length >= 2) {
      aciTrend = Math.round((aciValues[aciValues.length - 1] - aciValues[0]) * 100) / 100;
    }

    // 8. Build the LLM prompt
    const dataPacket = {
      month: monthInput,
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

    const prompt = `You are a senior leadership development analyst at The Leadership Nexus.

Your task: produce a pre-session executive coaching brief — NOT a narrative report or an explanation of the assessment.

CRITICAL CONTEXT: The coach will read this brief in approximately 90 seconds immediately before stepping into a coaching session with the client. Every word must serve the coach's preparation. Do not explain the framework. Do not describe what the data measures. Do not write a general leadership narrative. Be direct, specific, and actionable.

The Leadership Nexus framework assesses leaders across 5 levels:
- Level 1: Transactional (day-to-day operations, immediate tasks)
- Level 2: Managerial (functional execution, specialized work)
- Level 3: Tactical (cross-functional coordination, short-term planning)
- Level 4: Strategic (long-term direction, organizational vision)
- Level 5: Visionary (enterprise-wide transformation, industry influence)

"Thought" = time spent thinking at each level. "Action" = time spent acting at each level.

DATA:
${JSON.stringify(dataPacket, null, 2)}

Your brief must answer — and only answer — these five questions:

1. WHAT CHANGED? (executive_summary)
2. WHAT MATTERS MOST? (leadership_pattern)
3. WHAT RISK DESERVES ATTENTION? (watch_out_for)
4. WHAT SHOULD THE COACH DISCUSS? (whats_working + leadership_momentum)
5. WHAT SHOULD THE CLIENT PRACTICE NEXT? (leadership_practices)

WRITING RULES:
- Write as if speaking to a peer coach, not as if writing a report for a file.
- No filler phrases ("This month the participant...", "Overall the data suggests..."). Get straight to the point.
- Every claim must reference specific data points from the DATA section — numbers, levels, dates, or quoted reflections.
- Prefer shorter, punchier sentences over compound sentences.
- If something is uncertain or data is thin, say so plainly rather than hedging.
- Do not repeat information across fields. Each field must add new information.

Return ONLY a JSON object matching this exact schema:
{
  "executive_summary": {
    "headline": "A 2-5 word phrase naming the single most important shift this month — what changed for this leader. Not a theme; a change.",
    "narrative": "2-4 sentences answering: What changed this month? Reference the specific delta — ACI trend, level shifts, momentum direction, or pattern emergence. If nothing changed, say so and name what held steady.",
    "confidence": "High, Medium, or Low — based on data volume and consistency"
  },
  "leadership_pattern": {
    "title": "A concise name for the single pattern that matters most for this coaching session",
    "explanation": "1-2 sentences answering: Why does this matter most right now? Reference the specific data that makes this the priority over everything else.",
    "classification": "Strength, Emerging, or Watch"
  },
  "leadership_momentum": {
    "indicator": "Improving, Declining, Stable, or Emerging",
    "interpretation": "1-2 sentences answering: What should the coach discuss? Name the conversation the coach should open with, grounded in the momentum data."
  },
  "whats_working": ["1-3 specific, data-backed behaviors the coach should reinforce in session. Each is a single sentence referencing a concrete data point."],
  "watch_out_for": ["1-3 specific risks that deserve attention this session. Each is a single sentence naming the risk, the data signal behind it, and why it matters now."],
  "leadership_practices": {
    "primary_practice": {
      "title": "A concise name for the #1 practice the client should focus on before the next session",
      "purpose": "1 sentence answering: Why this practice, based on this month's data specifically?",
      "practice": "A specific, actionable instruction the client can execute this week — concrete enough that they know exactly what to do.",
      "reflection_question": "A single sharp question the client should sit with weekly"
    },
    "supporting_practice": {
      "title": "A concise name for a supporting practice",
      "purpose": "1 sentence: why this supports the primary practice",
      "practice": "Specific, actionable instruction",
      "reflection_question": "A weekly reflection question"
    },
    "growth_practice": {
      "title": "A concise name for a growth-oriented practice",
      "purpose": "1 sentence: why this stretches the client beyond their comfort zone right now",
      "practice": "Specific, actionable instruction",
      "reflection_question": "A weekly reflection question"
    }
  }
}

If there is insufficient data (zero interactions or inference runs), still produce the structure. Use "Insufficient data for this period" as the narrative, "N/A" for headline/confidence, and empty arrays for whats_working and watch_out_for. For leadership_practices, use "Awaiting data" as titles and explanations.`;

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: {
            type: "object",
            properties: {
              headline: { type: "string" },
              narrative: { type: "string" },
              confidence: { type: "string" },
            },
          },
          leadership_pattern: {
            type: "object",
            properties: {
              title: { type: "string" },
              explanation: { type: "string" },
              classification: { type: "string" },
            },
          },
          leadership_momentum: {
            type: "object",
            properties: {
              indicator: { type: "string" },
              interpretation: { type: "string" },
            },
          },
          whats_working: { type: "array", items: { type: "string" } },
          watch_out_for: { type: "array", items: { type: "string" } },
          leadership_practices: {
            type: "object",
            properties: {
              primary_practice: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  purpose: { type: "string" },
                  practice: { type: "string" },
                  reflection_question: { type: "string" },
                },
              },
              supporting_practice: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  purpose: { type: "string" },
                  practice: { type: "string" },
                  reflection_question: { type: "string" },
                },
              },
              growth_practice: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  purpose: { type: "string" },
                  practice: { type: "string" },
                  reflection_question: { type: "string" },
                },
              },
            },
          },
        },
      },
      model: "claude_sonnet_4_6",
    });

    // 9. Parse LLM response (may be string or object, possibly wrapped in "response")
    let review;
    if (typeof llmResponse === 'string') {
      try {
        review = JSON.parse(llmResponse);
      } catch {
        review = {};
      }
    } else {
      review = llmResponse || {};
    }
    // Unwrap if nested under a "response" key
    if (review.response && typeof review.response === 'object') {
      review = review.response;
    }

    // 10. Build complete report matching the report UI structure
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    const clientName = clientProfile.display_name || clientProfile.full_name || clientRecord?.full_name || "Participant";
    const coachName = coachProfile?.display_name || coachProfile?.full_name || "Coach";

    const report = {
      client_name: clientName,
      client_title: clientRecord?.role || "",
      client_company: clientRecord?.company || "",
      review_period: `${monthNames[month - 1]} ${year}`,
      coach_name: coachName,
      generated_date: new Date().toISOString().slice(0, 10),
      executive_summary: review.executive_summary,
      leadership_pattern: review.leadership_pattern,
      leadership_momentum: review.leadership_momentum,
      thought_averages: thoughtAverages,
      action_averages: actionAverages,
      whats_working: review.whats_working || [],
      watch_out_for: review.watch_out_for || [],
      leadership_practices: review.leadership_practices,
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});