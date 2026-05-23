import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const levelLabels = ['Transactional', 'Managerial', 'Tactical', 'Strategic', 'Transformational'];

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

  // Final validation: if first-person language still present, use safe fallback per section
  const firstPersonCheck = /\b(I |I'm |I've |I'd |we |we're |our |my )\b/i;
  if (firstPersonCheck.test(t)) {
    const fallback = 'Your check-in shows a meaningful pattern in how your leadership focus is showing up this week.';
    t = t
      .replace(/^Observation:.*$/im, `Observation: ${fallback}`)
      .replace(/^Performance implication:.*$/im, 'Performance implication: This pattern is worth exploring with your coach — it offers a useful signal about how your thinking and actions are showing up.')
      .replace(/^This week's challenge:.*$/im, "This week's challenge: Notice one moment where your focus and actions are most aligned, and build from there.");
  }

  return t;
}

async function regenerateObservation(base44, interaction) {
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

  const action_pct = {};
  const thought_pct = {};
  actionVals.forEach((v, i) => { action_pct[`l${i + 1}`] = (v / actionTotal) * 100; });
  thoughtVals.forEach((v, i) => { thought_pct[`l${i + 1}`] = (v / thoughtTotal) * 100; });

  const actionSorted = actionVals.map((v, i) => ({ level: i + 1, val: v })).sort((a, b) => b.val - a.val);
  const top_action_level_1 = actionSorted[0]?.level ?? 1;
  const topActionLabel = levelLabels[top_action_level_1 - 1] || `Level ${top_action_level_1}`;

  const leadership_gap = (interaction.total_thought_score || thoughtVals.reduce((s,v)=>s+v,0)) -
                         (interaction.total_action_score  || actionVals.reduce((s,v)=>s+v,0));
  const leadership_gap_direction = leadership_gap > 0 ? 'thought_ahead' : leadership_gap < 0 ? 'action_ahead' : 'aligned';
  const thoughtVsActionLabel = leadership_gap_direction === 'thought_ahead' ? 'Thought slightly ahead of Action'
    : leadership_gap_direction === 'action_ahead' ? 'Action slightly ahead of Thought' : 'Balanced';

  // Fetch the stored inference run for aci / ams
  const runs = await base44.asServiceRole.entities.InferenceRuns.filter(
    { interaction_id: interaction.id }, '-created_date', 1
  );
  const run = Array.isArray(runs) && runs.length > 0 ? runs[0] : null;
  const aci = run?.aci ?? null;
  const aci_delta = run?.aci_delta ?? null;
  const ams_direction = interaction.alignment_momentum_direction || run?.alignment_momentum_direction || 'stable';

  const leadershipAlignmentLabel = aci == null ? 'developing'
    : aci >= 75 ? 'strong' : aci >= 45 ? 'developing a consistent rhythm' : 'showing more variation than usual';
  const leadershipAlignmentTrend = aci_delta == null ? ''
    : aci_delta >= 5 ? ', strengthening compared to last week'
    : aci_delta <= -5 ? ', showing more variation than last week' : ', consistent with last week';
  const growthDirectionLabel = ams_direction === 'improving' ? 'moving in a positive direction'
    : ams_direction === 'declining' ? 'showing some variation worth exploring' : 'holding steady';

  // Fetch client/profile for anchor context
  let client = null;
  if (interaction.client_id) {
    try { client = await base44.asServiceRole.entities.Client.get(interaction.client_id); } catch (_) {}
  }
  let profile = null;
  if (interaction.client_profile_id) {
    try { profile = await base44.asServiceRole.entities.Profiles.get(interaction.client_profile_id); } catch (_) {}
  }
  const anchorText = client?.anchor_text || profile?.anchor_text || null;
  const anchorTarget = client?.anchor_target_level ?? profile?.anchor_target_level ?? null;
  const anchorCounter = client?.anchor_counter_level ?? profile?.anchor_counter_level ?? null;

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

  if (anchorText) {
    llmPrompt += `\nTheir current coaching focus: ${anchorText}`;
    if (anchorTarget) llmPrompt += ` (working toward Level ${anchorTarget} — ${levelLabels[anchorTarget - 1] || ''})`;
    if (anchorCounter) llmPrompt += ` (moving away from Level ${anchorCounter} — ${levelLabels[anchorCounter - 1] || ''})`;
  }
  if (interaction.reflection_text) llmPrompt += `\nWhat they reflected on this week: ${interaction.reflection_text}`;
  if (interaction.commitment_text) llmPrompt += `\nWhat they committed to: ${interaction.commitment_text}`;

  llmPrompt += `

Write a coaching reflection using EXACTLY this 3-line format:

Observation: [One warm, specific sentence about what you notice in their leadership alignment, growth direction, or thought vs action balance this week. Do NOT mention ACI, AMS, alignment consistency index, momentum score, leadership gap, or any score/number.]
Performance implication: [One sentence on what this pattern means for how they show up as a leader — developmental, non-judgmental, human.]
This week's challenge: [One specific, actionable challenge tied to their focus area or coaching anchor.]

Tone: warm, direct, coaching. Address the participant as "you". Be specific to their actual data. Never be generic. Never use internal framework terminology.`;

  const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: llmPrompt });
  const raw = typeof llmResult === 'string' ? llmResult.trim() : (llmResult?.text || '').trim();
  const coach_reflection_text = sanitiseObservation(raw);

  // Update the interaction
  await base44.asServiceRole.entities.Interactions.update(interaction.id, { coach_reflection_text });

  // Update the inference run if it exists
  if (run?.id) {
    await base44.asServiceRole.entities.InferenceRuns.update(run.id, { coach_reflection_text });
  }

  return coach_reflection_text;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const interactions = await base44.asServiceRole.entities.Interactions.filter(
      { type: 'weekly_checkin' },
      '-created_date',
      500
    );

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const interaction of interactions) {
      const hasData = interaction.action_l1 || interaction.action_l2 || interaction.action_l3 ||
                      interaction.action_l4 || interaction.action_l5;
      if (!hasData) { skipped++; continue; }

      try {
        await regenerateObservation(base44, interaction);
        processed++;
      } catch (e) {
        console.error(`Failed for interaction ${interaction.id}:`, e?.message);
        failed++;
      }

      // Pace the LLM calls
      await new Promise(r => setTimeout(r, 600));
    }

    return Response.json({ processed, skipped, failed, total: interactions.length });
  } catch (err) {
    console.error('backfillObservations error:', err?.message || err);
    return Response.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
});