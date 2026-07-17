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

WRITING STYLE:
Write as an experienced executive coach preparing another coach for a session. Be direct, confident, and useful.

- Lead with the insight, not the evidence. State the conclusion first; let the data sit underneath, not in front.
- One idea per sentence. No compound sentences stacking multiple observations.
- Prefer active verbs. "The client avoids delegation" — not "Delegation appears to be an area of avoidance."
- Prefer observable behaviors over abstract labels. Name what the client does, not a category it fits into.
- Remove all introductory phrases. No warm-up, no context-setting, no "This month..." or "Based on the data..."
- Remove unnecessary qualifiers. No "somewhat," "relatively," "appears to," "seems to," or hedging words.
- If data is thin, state it as a fact ("Only one check-in this period") — not as an apology or caveat.

BANNED PHRASES — do not use any of these or close variants:
- "The participant demonstrated"
- "The data suggests"
- "It appears that"
- "This indicates that"
- "The system appropriately flags"
- "With only one interaction"
- "Overall," "Generally," "It seems," "One might observe"

Do not write around these by substituting near-equivalents. If you find yourself writing an introductory or hedging phrase, delete it and lead with the actual insight.

NO REPEATED THEMES ACROSS SECTIONS:
Each section must contribute a distinct insight. Do not repeat the same point using different language. If a theme is named in one section, it must not reappear in another section unless the second section adds genuinely new information about it.

Section roles:
- Executive Summary: states the overall developmental story — the arc of the month.
- Leadership Pattern: identifies the primary recurring behavior — one specific pattern, not the same story retold.
- Leadership Momentum: describes direction only — improving, declining, stable, or emerging. Do not restate the pattern or the summary here.
- What's Working: strengths not already stated in the Executive Summary or Leadership Pattern.
- Watch Out For: risks not already stated in any other section.
- Recommended Focus: converts the single most important insight into practice. It may reference a theme from one other section (since it is the action layer), but must add a new angle — the practice itself — not just restate the insight.

Example of what NOT to do: if delegation is named in the Executive Summary, do not restate "delegation needs attention" in Leadership Pattern, Watch Out For, and Recommended Focus. Each section must surface a different facet or a different issue entirely.

NEVER reference internal scoring or inference mechanics. Do not mention:
- ACI (Alignment Capacity Index) or any index value
- Leadership Gap as a computed metric or score
- Score deltas, point changes, or numeric comparisons between levels
- Inference magnitude, run counts, or inference process
- Momentum calculations or how momentum was computed
- Percentage calculations, averages, or percentages
- Thought-leading or action-leading magnitude, or any reference to how far ahead one domain is in numeric terms
- Internal scoring logic, weights, or formulas

Instead, translate every metric into a plain coaching observation about the leader's behavior or readiness.

EXAMPLE — do not write:
"L4 Thought scored 4 while L1 and L2 Action scored 3."
Instead write:
"Strategic thinking is ahead of visible execution."

EXAMPLE — do not write:
"ACI improved by 0.3 this month with a momentum score of 2.1."
Instead write:
"The client's alignment is strengthening week over week."

EXAMPLE — do not write:
"The leadership gap narrowed by 15%, indicating thought-leading magnitude decreased."
Instead write:
"The client's actions are catching up to their thinking."

If a data signal is important, name the behavioral reality it points to — not the number, not the metric name, not how it was calculated.

FINAL EDITORIAL PASS — before returning the JSON, review every sentence and observation. For each, ask: "Does this materially improve the coach's preparation for the next conversation?" If no: remove it, shorten it, or combine it with a stronger statement. Then verify:
- All section word limits are met.
- No scoring logic is exposed (no ACI, deltas, percentages, or metric names).
- No developmental theme is repeated unnecessarily across sections.
- The report can be read in under 90 seconds.
- The content fits comfortably on one page.
Return only the final compressed content.

Return ONLY a JSON object matching this exact schema:

HARD WORD-COUNT LIMITS — treat as maximums. If any generated content exceeds its limit, shorten it before returning the final JSON. Count every word including articles and prepositions.
- executive_summary.narrative: 45 words maximum
- leadership_pattern.explanation: 20 words maximum
- leadership_momentum.interpretation: 18 words maximum
- whats_working: exactly 3 observations, maximum 8 words each
- watch_out_for: exactly 3 observations, maximum 8 words each
- Each leadership_practices title (primary, supporting, growth): 8 words maximum
- Each leadership_practices practice field: 22 words maximum
- Each leadership_practices reflection_question: 14 words maximum

{
  "executive_summary": {
    "headline": "A 2-5 word phrase naming the single most important shift this month — what changed for this leader. Not a theme; a change.",
    "narrative": "MAX 45 WORDS. What changed this month? If nothing changed, name what held steady. Translate data into behavioral reality, not metrics.",
    "confidence": "High, Medium, or Low — based on data volume and consistency"
  },
  "leadership_pattern": {
    "title": "A concise name for the single pattern that matters most for this coaching session (max 8 words)",
    "explanation": "MAX 20 WORDS. Why does this matter most right now? Ground in data, but as coaching language not metrics.",
    "classification": "Strength, Emerging, or Watch"
  },
  "leadership_momentum": {
    "indicator": "Improving, Declining, Stable, or Emerging",
    "interpretation": "MAX 18 WORDS. What should the coach discuss? Name the conversation to open with."
  },
  "whats_working": ["EXACTLY 3 items. Each is a phrase or short sentence, MAX 8 WORDS. One strength or behavior to reinforce per item. No explanation, no evidence, no metrics. No repetition across items or other sections. Style example: 'Recognizes delegation opportunities.' / 'Maintains strategic perspective under pressure.' / 'Prepares intentionally for executive conversations.'"],
  "watch_out_for": ["EXACTLY 3 items. Each is a phrase or short sentence, MAX 8 WORDS. One risk or behavior to watch per item. No explanation, no evidence, no metrics. No repetition across items or other sections. Style example: 'Escalations continue bypassing direct reports.' / 'Tactical work crowds strategic capacity.' / 'Delegation decisions remain incomplete.'"],
  "leadership_practices": {
    "primary_practice": {
      "title": "MAX 8 WORDS. Concise name for the #1 practice.",
      "practice": "MAX 22 WORDS. One specific, observable practice the client can execute this week. No purpose paragraph, no background explanation, no multiple steps unless essential. Style example: 'Define Jonathan's escalation authority before the next customer issue.'",
      "reflection_question": "MAX 14 WORDS. One sharp question to sit with weekly. Style example: 'What decision will I intentionally not make next week?'"
    },
    "supporting_practice": {
      "title": "MAX 8 WORDS. Concise name for a supporting practice.",
      "practice": "MAX 22 WORDS. One specific, observable practice. No purpose, no background, no multi-step unless essential.",
      "reflection_question": "MAX 14 WORDS. One weekly reflection question."
    },
    "growth_practice": {
      "title": "MAX 8 WORDS. Concise name for a growth-oriented practice.",
      "practice": "MAX 22 WORDS. One specific, observable practice. No purpose, no background, no multi-step unless essential.",
      "reflection_question": "MAX 14 WORDS. One weekly reflection question."
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
                  practice: { type: "string" },
                  reflection_question: { type: "string" },
                },
              },
              supporting_practice: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  practice: { type: "string" },
                  reflection_question: { type: "string" },
                },
              },
              growth_practice: {
                type: "object",
                properties: {
                  title: { type: "string" },
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