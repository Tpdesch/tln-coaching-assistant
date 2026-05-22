import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const interactions = await base44.asServiceRole.entities.Interactions.list('-created_date', 1000);
  const checkins = interactions.filter(i => i.type === 'weekly_checkin');

  const sliderFields = ['thought_l1','thought_l2','thought_l3','thought_l4','thought_l5',
                        'action_l1','action_l2','action_l3','action_l4','action_l5'];

  let updatedGap = 0;
  let updatedAms = 0;
  let skipped = 0;

  // --- Pass 1: Backfill leadership gap + scores ---
  for (const i of checkins) {
    if (i.leadership_gap != null && i.total_thought_score != null) {
      skipped++;
      continue;
    }
    if (sliderFields.some(f => i[f] == null)) {
      skipped++;
      continue;
    }

    const total_thought_score = i.thought_l1 + i.thought_l2 + i.thought_l3 + i.thought_l4 + i.thought_l5;
    const total_action_score  = i.action_l1  + i.action_l2  + i.action_l3  + i.action_l4  + i.action_l5;
    const leadership_gap = total_thought_score - total_action_score;

    let leadership_gap_direction, leadership_gap_interpretation;
    if (leadership_gap > 0) {
      leadership_gap_direction = 'thought_ahead';
      leadership_gap_interpretation = 'Your Thought Time is ahead of your Action Time this week.';
    } else if (leadership_gap < 0) {
      leadership_gap_direction = 'action_ahead';
      leadership_gap_interpretation = 'Your Action Time is ahead of your Thought Time this week.';
    } else {
      leadership_gap_direction = 'aligned';
      leadership_gap_interpretation = 'Your Thought Time and Action Time are aligned this week.';
    }

    await base44.asServiceRole.entities.Interactions.update(i.id, {
      total_thought_score,
      total_action_score,
      leadership_gap,
      leadership_gap_direction,
      leadership_gap_interpretation,
    });

    // Update local copy so Pass 2 can use it
    i.total_thought_score = total_thought_score;
    i.total_action_score = total_action_score;
    i.leadership_gap = leadership_gap;
    i.leadership_gap_direction = leadership_gap_direction;

    updatedGap++;
  }

  // --- Pass 2: Backfill AMS where prior check-in exists ---
  // Group check-ins by client_profile_id, sorted oldest → newest
  const byProfile = {};
  for (const i of checkins) {
    if (!byProfile[i.client_profile_id]) byProfile[i.client_profile_id] = [];
    byProfile[i.client_profile_id].push(i);
  }

  for (const profileId of Object.keys(byProfile)) {
    const sorted = byProfile[profileId].sort((a, b) =>
      (a.created_date || '').localeCompare(b.created_date || '')
    );

    for (let idx = 1; idx < sorted.length; idx++) {
      const curr = sorted[idx];
      const prev = sorted[idx - 1];

      // Skip if AMS already set
      if (curr.alignment_momentum_score != null) continue;

      // Both records need scores and gap
      if (curr.total_thought_score == null || curr.total_action_score == null || curr.leadership_gap == null) continue;
      if (prev.total_thought_score == null || prev.total_action_score == null || prev.leadership_gap == null) continue;

      // Consistency delta: change in total scores (thought + action combined effort)
      const currTotal = curr.total_thought_score + curr.total_action_score;
      const prevTotal = prev.total_thought_score + prev.total_action_score;
      const consistencyDelta = currTotal - prevTotal;

      // Gap delta: improvement = gap moving toward 0
      const gapDelta = Math.abs(prev.leadership_gap) - Math.abs(curr.leadership_gap);

      // AMS = weighted combination
      const alignment_momentum_score = Math.round((consistencyDelta * 0.5) + (gapDelta * 0.5));

      let alignment_momentum_direction;
      if (alignment_momentum_score > 0) {
        alignment_momentum_direction = 'improving';
      } else if (alignment_momentum_score < 0) {
        alignment_momentum_direction = 'declining';
      } else {
        alignment_momentum_direction = 'stable';
      }

      const alignment_momentum_summary =
        alignment_momentum_direction === 'improving'
          ? 'Your alignment is moving forward this week.'
          : alignment_momentum_direction === 'declining'
          ? 'Your alignment has drifted backward this week.'
          : 'Your alignment is holding steady.';

      await base44.asServiceRole.entities.Interactions.update(curr.id, {
        alignment_momentum_score,
        alignment_momentum_direction,
        alignment_momentum_summary,
      });

      curr.alignment_momentum_score = alignment_momentum_score;
      updatedAms++;
    }
  }

  return Response.json({
    updatedGap,
    updatedAms,
    skipped,
    total: checkins.length,
  });
});