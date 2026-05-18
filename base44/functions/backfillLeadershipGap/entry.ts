import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Fetch all weekly_checkin interactions
  const interactions = await base44.asServiceRole.entities.Interactions.list('-created_date', 1000);
  const checkins = interactions.filter(i => i.type === 'weekly_checkin');

  let updated = 0;
  let skipped = 0;

  for (const i of checkins) {
    // Skip if already backfilled
    if (i.leadership_gap != null && i.total_thought_score != null) {
      skipped++;
      continue;
    }

    // Require all 10 slider values
    const fields = ['thought_l1','thought_l2','thought_l3','thought_l4','thought_l5',
                    'action_l1','action_l2','action_l3','action_l4','action_l5'];
    if (fields.some(f => i[f] == null)) {
      skipped++;
      continue;
    }

    const total_thought_score = i.thought_l1 + i.thought_l2 + i.thought_l3 + i.thought_l4 + i.thought_l5;
    const total_action_score  = i.action_l1  + i.action_l2  + i.action_l3  + i.action_l4  + i.action_l5;
    const leadership_gap = total_thought_score - total_action_score;

    let leadership_gap_direction;
    let leadership_gap_interpretation;
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

    updated++;
  }

  return Response.json({ updated, skipped, total: checkins.length });
});