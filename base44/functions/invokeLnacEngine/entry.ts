import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { interaction_id } = body;

  if (!interaction_id) {
    return Response.json({ error: 'interaction_id is required' }, { status: 400 });
  }

  // Fetch the interaction
  let interaction = null;
  try {
    interaction = await base44.asServiceRole.entities.Interactions.get(interaction_id);
  } catch (_) {}
  if (!interaction) {
    return Response.json({ error: 'Interaction not found' }, { status: 404 });
  }

  const profile_id = interaction.client_profile_id;

  // Fetch the client profile for anchor/role context
  let profile = null;
  try {
    profile = await base44.asServiceRole.entities.Profiles.get(profile_id);
  } catch (_) {}

  // Fetch the client record for anchor/required level data
  let client = null;
  if (interaction.client_id) {
    try {
      client = await base44.asServiceRole.entities.Client.get(interaction.client_id);
    } catch (_) {}
  }

  // --- LNAC Core Calculation ---

  // Raw action and thought values (1–5 Likert)
  const actionVals = [
    interaction.action_l1 || 1,
    interaction.action_l2 || 1,
    interaction.action_l3 || 1,
    interaction.action_l4 || 1,
    interaction.action_l5 || 1,
  ];
  const thoughtVals = [
    interaction.thought_l1 || 1,
    interaction.thought_l2 || 1,
    interaction.thought_l3 || 1,
    interaction.thought_l4 || 1,
    interaction.thought_l5 || 1,
  ];

  const actionTotal = actionVals.reduce((s, v) => s + v, 0);
  const thoughtTotal = thoughtVals.reduce((s, v) => s + v, 0);

  // Leadership gap fields
  const total_action_score = actionTotal;
  const total_thought_score = thoughtTotal;
  const leadership_gap = total_thought_score - total_action_score;
  const leadership_gap_direction = leadership_gap > 0 ? 'thought_ahead' : leadership_gap < 0 ? 'action_ahead' : 'aligned';
  const leadership_gap_interpretation = leadership_gap > 0
    ? 'Your strategic thinking is slightly ahead of your visible action this week — a sign of forward momentum.'
    : leadership_gap < 0
      ? 'Your actions are moving a little faster than your strategic thinking this week — worth noticing.'
      : 'Your thinking and actions are well-balanced this week.';

  // Percentage distributions
  const action_pct = {};
  const thought_pct = {};
  actionVals.forEach((v, i) => { action_pct[`l${i + 1}`] = (v / actionTotal) * 100; });
  thoughtVals.forEach((v, i) => { thought_pct[`l${i + 1}`] = (v / thoughtTotal) * 100; });

  // Primary action levels (top 2)
  const actionSorted = actionVals
    .map((v, i) => ({ level: i + 1, val: v }))
    .sort((a, b) => b.val - a.val);
  const top_action_level_1 = actionSorted[0]?.level ?? 1;
  const top_action_level_2 = actionSorted[1]?.level ?? 2;

  // Primary level = weighted center of gravity
  const actionWeighted = actionVals.reduce((s, v, i) => s + v * (i + 1), 0) / actionTotal;
  const thoughtWeighted = thoughtVals.reduce((s, v, i) => s + v * (i + 1), 0) / thoughtTotal;
  const primary_level = Math.round((actionWeighted + thoughtWeighted) / 2);

  // ACI: alignment between action and thought distributions
  // Uses cosine-similarity-like score scaled to 0–100
  const dotProduct = actionVals.reduce((s, v, i) => s + v * thoughtVals[i], 0);
  const actionMag = Math.sqrt(actionVals.reduce((s, v) => s + v * v, 0));
  const thoughtMag = Math.sqrt(thoughtVals.reduce((s, v) => s + v * v, 0));
  const cosine = dotProduct / (actionMag * thoughtMag);
  const aci = Math.round(cosine * 100);

  // Fetch the 4 most recent weekly_checkin interactions for this profile (ordered by date desc)
  // This is the source of truth for Growth Direction — we use actual check-in data, not inference runs.
  const recentCheckins = await base44.asServiceRole.entities.Interactions.filter(
    { client_profile_id: profile_id, type: 'weekly_checkin' },
    '-week_ending_date',
    4
  );
  const historicalCheckins = Array.isArray(recentCheckins) ? recentCheckins.filter(c => c.id !== interaction.id) : [];

  // ACI delta: compare to the most recent prior check-in's stored ACI (via InferenceRuns)
  let aci_delta = null;
  const prevRuns = await base44.asServiceRole.entities.InferenceRuns.filter(
    { client_profile_id: profile_id },
    '-created_date',
    2
  );
  const recentRuns = Array.isArray(prevRuns) ? prevRuns : [];
  const prevRun = recentRuns.length > 0 ? recentRuns[0] : null;
  if (prevRun?.aci != null) {
    aci_delta = aci - prevRun.aci;
  }

  // AMS: Rolling Alignment Momentum Score based on the 4 most recent weekly check-ins.
  // Requires at least 3 check-ins (including the current one) to compute a meaningful trend.
  // If fewer than 3 exist, direction = 'emerging'.
  const current_abs_gap = Math.abs(leadership_gap);

  // Build a timeline using stored scores from historical check-ins + current check-in
  // Each entry: { aci_score, abs_gap } — we compute ACI from raw Likert values for prior check-ins
  function computeAciFromCheckin(c) {
    const av = [c.action_l1||1, c.action_l2||1, c.action_l3||1, c.action_l4||1, c.action_l5||1];
    const tv = [c.thought_l1||1, c.thought_l2||1, c.thought_l3||1, c.thought_l4||1, c.thought_l5||1];
    const dot = av.reduce((s,v,i) => s + v*tv[i], 0);
    const aMag = Math.sqrt(av.reduce((s,v) => s+v*v, 0));
    const tMag = Math.sqrt(tv.reduce((s,v) => s+v*v, 0));
    return Math.round((dot / (aMag * tMag)) * 100);
  }

  const timeline = [
    { aci_score: aci, abs_gap: current_abs_gap },
    ...historicalCheckins.map(c => ({
      aci_score: computeAciFromCheckin(c),
      abs_gap: Math.abs((c.total_thought_score || 0) - (c.total_action_score || 0)),
    })),
  ];

  // Rolling trend calculations across the full timeline window
  // alignment_trend_4wk = latest aci - oldest aci in window
  // gap_trend_4wk = oldest abs_gap - latest abs_gap (positive = gap shrinking = good)
  const alignment_trend_4wk = timeline.length >= 2
    ? timeline[0].aci_score - timeline[timeline.length - 1].aci_score
    : null;
  const gap_trend_4wk = timeline.length >= 2
    ? timeline[timeline.length - 1].abs_gap - timeline[0].abs_gap
    : null;

  // Need at least 3 data points (current + 2 prior) for a meaningful trend
  let alignment_momentum_score = 0;
  let alignment_momentum_direction;
  let alignment_momentum_summary;

  if (timeline.length < 3) {
    alignment_momentum_direction = 'emerging';
    alignment_momentum_summary = 'Growth direction will become visible once more check-ins are completed.';
    alignment_momentum_score = 0;
  } else {
    // Classify using the 4-week trend fields:
    // alignment_trend_4wk: positive = alignment improving
    // gap_trend_4wk: positive = gap shrinking = good
    const alignmentImproving = alignment_trend_4wk != null && alignment_trend_4wk >= 3;
    const alignmentDeclining = alignment_trend_4wk != null && alignment_trend_4wk <= -3;
    const gapShrinking = gap_trend_4wk != null && gap_trend_4wk >= 1;
    const gapWidening = gap_trend_4wk != null && gap_trend_4wk <= -1;

    if (alignmentImproving || gapShrinking) {
      alignment_momentum_direction = 'improving';
      alignment_momentum_summary = 'Your growth direction is improving — your leadership alignment is strengthening over time.';
    } else if (alignmentDeclining || gapWidening) {
      alignment_momentum_direction = 'declining';
      alignment_momentum_summary = 'Your growth direction shows some variation — this is a useful signal to explore in your next check-in.';
    } else {
      alignment_momentum_direction = 'stable';
      alignment_momentum_summary = 'Your growth direction is steady — your leadership alignment is holding consistent.';
    }

    // Compute a numeric score for legacy use: weighted sum of the two trend signals
    const rawScore = ((alignment_trend_4wk ?? 0) * 0.6) + ((gap_trend_4wk ?? 0) * 0.4);
    alignment_momentum_score = Math.max(-10, Math.min(10, Math.round(rawScore)));
  }

  // Drift pattern detection
  const drift_patterns = [];
  const levelLabels = ['Transactional', 'Managerial', 'Tactical', 'Strategic', 'Transformational'];
  actionVals.forEach((av, i) => {
    const tv = thoughtVals[i];
    const diff = Math.abs(av - tv);
    if (diff >= 2) {
      drift_patterns.push({
        level: i + 1,
        label: levelLabels[i],
        action_val: av,
        thought_val: tv,
        direction: av > tv ? 'action_leading' : 'thought_leading',
        magnitude: diff,
      });
    }
  });

  // Gap analysis: compare actual distribution to required role distribution
  const gap_analysis = {};
  const requiredKeys = ['l1', 'l2', 'l3', 'l4', 'l5'];
  const clientSource = client || profile;
  if (clientSource) {
    requiredKeys.forEach((k, i) => {
      const reqField = `required_${k}_pct`;
      const req = clientSource[reqField] ?? 0;
      const actual = action_pct[k] ?? 0;
      gap_analysis[k] = {
        required: req,
        actual: parseFloat(actual.toFixed(1)),
        gap: parseFloat((actual - req).toFixed(1)),
      };
    });
  }

  // Generate coaching reflection using LLM
  const anchorText = (client?.anchor_text || profile?.anchor_text) ?? null;
  const anchorTarget = client?.anchor_target_level ?? profile?.anchor_target_level ?? null;
  const anchorCounter = client?.anchor_counter_level ?? profile?.anchor_counter_level ?? null;

  const topActionLabel = levelLabels[top_action_level_1 - 1] || 'Level ' + top_action_level_1;
  const topThoughtLabel = levelLabels[actionSorted.findIndex(x => x.level === top_action_level_1)] !== undefined
    ? levelLabels[actionSorted[0].level - 1]
    : 'Level ' + top_action_level_1;

  const leadershipAlignmentLabel = aci >= 75 ? 'strong' : aci >= 45 ? 'developing a consistent rhythm' : 'showing more variation than usual';
  const leadershipAlignmentTrend = aci_delta == null ? '' : aci_delta >= 5 ? ', strengthening compared to last week' : aci_delta <= -5 ? ', showing more variation than last week' : ', consistent with last week';
  const growthDirectionLabel = alignment_momentum_direction === 'improving' ? 'trending in a positive direction across recent check-ins' : alignment_momentum_direction === 'declining' ? 'showing a pattern of variation worth exploring' : alignment_momentum_direction === 'emerging' ? 'emerging — not enough check-ins yet to identify a trend' : 'holding steady across recent check-ins';
  const thoughtVsActionLabel = leadership_gap_direction === 'thought_ahead' ? 'Thought slightly ahead of Action' : leadership_gap_direction === 'action_ahead' ? 'Action slightly ahead of Thought' : 'Balanced';

  let llmPrompt = `You are a reflective leadership development coach writing directly to a participant after their weekly check-in.

CRITICAL LANGUAGE RULES — these are absolute and non-negotiable:
- NEVER write: ACI, AMS, alignment consistency index, momentum score, leadership gap, cosine similarity, or any internal metric name.
- ALWAYS use these terms instead:
  • "leadership alignment" (not ACI or alignment consistency index)
  • "growth direction" (not AMS or momentum score)
  • "thought vs action balance" (not leadership gap)
- The participant must never see a raw number or internal score. Describe patterns in plain English only.
- NEVER use first-person system language. Do not write: I, me, my, we, our, us, I noticed, I see, I recommend, we can see, our analysis, my suggestion.
- ALWAYS use neutral coaching language directed to the participant. Approved examples:
  • "Your leadership alignment showed more variation this week…"
  • "This pattern suggests…"
  • "The check-in indicates…"
  • "Your Thought vs Action pattern shows…"

Here is what this week's check-in tells us:

Week Ending: ${interaction.week_ending_date || 'this week'}
Primary focus area: Level ${top_action_level_1} (${topActionLabel})
Leadership Alignment this week: ${leadershipAlignmentLabel}${leadershipAlignmentTrend}
Growth Direction: ${growthDirectionLabel}
Thought vs Action balance: ${thoughtVsActionLabel}
How they spent their Action Time: ${Object.entries(action_pct).map(([k, v]) => `Level ${k.slice(1)} (${levelLabels[parseInt(k.slice(1)) - 1]}): ${v.toFixed(0)}%`).join(', ')}
How they spent their Thought Time: ${Object.entries(thought_pct).map(([k, v]) => `Level ${k.slice(1)} (${levelLabels[parseInt(k.slice(1)) - 1]}): ${v.toFixed(0)}%`).join(', ')}`;

  if (drift_patterns.length > 0) {
    const driftDesc = drift_patterns.map(d =>
      `At the ${d.label} level, ${d.action_val > d.thought_val ? 'their action time is notably ahead of their thinking time' : 'their thinking time is notably ahead of their action time'}`
    ).join('; ');
    llmPrompt += `\nNotable patterns this week: ${driftDesc}`;
  }

  if (anchorText) {
    llmPrompt += `\nTheir current coaching focus: ${anchorText}`;
    if (anchorTarget) llmPrompt += ` (working toward Level ${anchorTarget} — ${levelLabels[anchorTarget - 1] || ''})`;
    if (anchorCounter) llmPrompt += ` (moving away from Level ${anchorCounter} — ${levelLabels[anchorCounter - 1] || ''})`;
  }

  if (interaction.reflection_text) {
    llmPrompt += `\nWhat they reflected on this week: ${interaction.reflection_text}`;
  }

  if (interaction.commitment_text) {
    llmPrompt += `\nWhat they committed to: ${interaction.commitment_text}`;
  }

  llmPrompt += `

Write a coaching reflection using EXACTLY this 3-line format. Each label must appear exactly as shown, followed by your text:

Observation: [One warm, specific sentence about what you notice in their leadership alignment, growth direction, or thought vs action balance this week. Do NOT mention ACI, AMS, alignment consistency index, momentum score, leadership gap, or any score/number.]
Performance implication: [One sentence on what this pattern means for how they show up as a leader — developmental, non-judgmental, human.]
This week's challenge: [One specific, actionable challenge tied to their focus area or coaching anchor.]

Tone: warm, direct, coaching. Address the participant as "you". Be specific to their actual data. Never be generic. Never use internal framework terminology.`;

  // Sanitise leaked internal terminology and first-person system language
  function sanitiseObservation(text) {
    let t = text
      // Internal metric terms
      .replace(/\bACI\b/g, 'leadership alignment')
      .replace(/\bAMS\b/g, 'growth direction')
      .replace(/alignment consistency index/gi, 'leadership alignment')
      .replace(/momentum score/gi, 'growth direction')
      .replace(/leadership gap/gi, 'thought vs action balance')
      .replace(/cosine similarity/gi, 'alignment pattern')
      .replace(/\bLNAC\b/g, 'leadership framework')
      // First-person system phrases → neutral coaching language
      .replace(/I noticed\b/gi, 'Your leadership alignment showed')
      .replace(/I notice\b/gi, 'Your leadership alignment shows')
      .replace(/I observed\b/gi, 'The check-in indicates')
      .replace(/I observe\b/gi, 'The check-in indicates')
      .replace(/I see\b/gi, 'The check-in shows')
      .replace(/I can see\b/gi, 'The check-in shows')
      .replace(/I think\b/gi, 'This pattern suggests')
      .replace(/I recommend\b/gi, 'Focus this week on')
      .replace(/I suggest\b/gi, 'Focus this week on')
      .replace(/I encourage\b/gi, 'Consider')
      .replace(/I want\b/gi, 'It would be valuable')
      .replace(/I'd like\b/gi, 'It would be valuable')
      .replace(/I would like\b/gi, 'It would be valuable')
      .replace(/we see\b/gi, 'the check-in shows')
      .replace(/we can see\b/gi, 'the check-in shows')
      .replace(/we noticed\b/gi, 'the check-in indicates')
      .replace(/we notice\b/gi, 'the check-in indicates')
      .replace(/we observe\b/gi, 'the check-in indicates')
      .replace(/we observed\b/gi, 'the check-in indicates')
      .replace(/our analysis\b/gi, 'the check-in')
      .replace(/our data\b/gi, 'the check-in data')
      .replace(/my suggestion\b/gi, 'the recommended focus')
      .replace(/my recommendation\b/gi, 'the recommended focus');

    // Final validation: if first-person language still present, use safe fallback
    const firstPersonCheck = /\b(I |I'm |I've |I'd |we |we're |our |my )\b/i;
    if (firstPersonCheck.test(t)) {
      const fallback = 'Your check-in shows a meaningful pattern in how your leadership focus is showing up this week.';
      // Replace only the problematic section lines, not the entire reflection
      t = t
        .replace(/^Observation:.*$/im, `Observation: ${fallback}`)
        .replace(/^Performance implication:.*$/im, 'Performance implication: This pattern is worth exploring with your coach — it offers a useful signal about how your thinking and actions are showing up.')
        .replace(/^This week's challenge:.*$/im, "This week's challenge: Notice one moment where your focus and actions are most aligned, and build from there.");
    }

    return t;
  }

  let coach_reflection_text = '';
  try {
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
    });
    const raw = typeof llmResult === 'string' ? llmResult.trim() : (llmResult?.text || '').trim();
    coach_reflection_text = sanitiseObservation(raw);
  } catch (e) {
    console.error('LLM error:', e);
    const alignmentState = aci >= 75 ? 'strong' : aci >= 45 ? 'moderate' : 'variable';
    const alignmentObservation = alignmentState === 'strong' ? 'Your leadership focus and actions are working together consistently.' : alignmentState === 'moderate' ? 'Your leadership is developing a consistent rhythm.' : 'Your focus and actions need better alignment.';
    coach_reflection_text = `Observation: Your primary focus this week was at Level ${top_action_level_1} (${topActionLabel}). ${alignmentObservation}\nPerformance implication: When your thinking and visible action align, your leadership creates clarity and builds trust with those around you.\nThis week's challenge: Identify one moment where you could bring your strategic thinking and your actions into closer alignment.`;
  }

  // Store the inference run
  const inferenceRun = await base44.asServiceRole.entities.InferenceRuns.create({
    client_profile_id: profile_id,
    interaction_id: interaction.id,
    aci,
    aci_delta,
    top_action_level_1,
    top_action_level_2,
    coach_reflection_text,
    action_pct,
    thought_pct,
    primary_level,
    drift_patterns,
    gap_analysis,
    gap_companion: {
      total_thought_score,
      total_action_score,
      leadership_gap,
      leadership_gap_direction,
      leadership_gap_interpretation,
    },
    alignment_momentum_score,
    alignment_momentum_direction,
    alignment_momentum_summary,
    alignment_trend_4wk,
    gap_trend_4wk,
  });

  // Also write the coaching reflection and gap fields back to the interaction
  await base44.asServiceRole.entities.Interactions.update(interaction.id, {
    coach_reflection_text,
    total_thought_score,
    total_action_score,
    leadership_gap,
    leadership_gap_direction,
    leadership_gap_interpretation,
    alignment_momentum_score,
    alignment_momentum_direction,
    alignment_momentum_summary,
  });

  return Response.json({
    id: inferenceRun.id,
    aci,
    aci_delta,
    top_action_level_1,
    top_action_level_2,
    coach_reflection_text,
    action_pct,
    thought_pct,
    primary_level,
    drift_patterns,
    gap_analysis,
  });
  } catch (err) {
    console.error('invokeLnacEngine error:', err?.message || err);
    return Response.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
});