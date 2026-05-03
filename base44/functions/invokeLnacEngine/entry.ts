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

  // ACI delta: compare to most recent previous run for this profile
  let aci_delta = null;
  const prevRuns = await base44.asServiceRole.entities.InferenceRuns.filter(
    { client_profile_id: profile_id },
    '-created_date',
    5
  );
  const prevRun = Array.isArray(prevRuns) && prevRuns.length > 0 ? prevRuns[0] : null;
  if (prevRun?.aci != null) {
    aci_delta = aci - prevRun.aci;
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

  let llmPrompt = `You are a leadership development coach using the LNAC (Leadership Needs Assessment Cycle) framework.

A coaching participant just submitted their weekly check-in. Here is their data:

Week Ending: ${interaction.week_ending_date || 'this week'}
Primary Action Level: Level ${top_action_level_1} (${topActionLabel})
ACI (Alignment Consistency Index): ${aci}${aci_delta != null ? ` (${aci_delta >= 0 ? '+' : ''}${aci_delta} from last week)` : ''}
Action Distribution: ${Object.entries(action_pct).map(([k, v]) => `L${k.slice(1)}: ${v.toFixed(0)}%`).join(', ')}
Thought Distribution: ${Object.entries(thought_pct).map(([k, v]) => `L${k.slice(1)}: ${v.toFixed(0)}%`).join(', ')}`;

  if (drift_patterns.length > 0) {
    llmPrompt += `\nDrift Patterns: ${drift_patterns.map(d => `L${d.level} ${d.direction} by ${d.magnitude}`).join('; ')}`;
  }

  if (anchorText) {
    llmPrompt += `\nCurrent Focus (Anchor): ${anchorText}`;
    if (anchorTarget) llmPrompt += ` (Target: Level ${anchorTarget})`;
    if (anchorCounter) llmPrompt += ` (Counter: Level ${anchorCounter})`;
  }

  if (interaction.reflection_text) {
    llmPrompt += `\nParticipant Reflection: ${interaction.reflection_text}`;
  }

  if (interaction.commitment_text) {
    llmPrompt += `\nParticipant Commitment: ${interaction.commitment_text}`;
  }

  llmPrompt += `

Write a brief, focused coaching reflection (3–4 sentences max) using EXACTLY this format — each on its own line:
Observation: [one sentence describing the pattern you observe in their data]
Performance implication: [one sentence on what this means for their effectiveness]
This week's challenge: [one actionable, specific challenge tied to their anchor or primary level]

Be direct, human, and specific. Do not use generic language. Do not use bullet points or markdown.`;

  let coach_reflection_text = '';
  try {
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
    });
    coach_reflection_text = typeof llmResult === 'string' ? llmResult.trim() : (llmResult?.text || '').trim();
  } catch (e) {
    console.error('LLM error:', e);
    coach_reflection_text = `Observation: Your primary focus this week was at Level ${top_action_level_1} (${topActionLabel}).\nPerformance implication: Consistent alignment between thought and action builds leadership capacity over time.\nThis week's challenge: Reflect on one moment where you could elevate your thinking to match your most strategic action.`;
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
    gap_companion: {},
  });

  // Also write the coaching reflection back to the interaction
  await base44.asServiceRole.entities.Interactions.update(interaction.id, {
    coach_reflection_text,
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