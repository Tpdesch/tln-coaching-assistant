import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_TIMEZONE = 'America/New_York';

function isFriday8amInTimezone(tz) {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value, 10);
    return weekday === 'Fri' && hour === 8;
  } catch {
    return isFriday8amInTimezone(DEFAULT_TIMEZONE);
  }
}

function getWeekEndingFridayInTimezone(tz) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
    const daysUntilFriday = (5 - localDate.getDay() + 7) % 7;
    const friday = new Date(localDate);
    friday.setDate(localDate.getDate() + daysUntilFriday);
    return friday.toISOString().slice(0, 10);
  } catch {
    return getWeekEndingFridayInTimezone(DEFAULT_TIMEZONE);
  }
}

function hasCheckedInThisWeek(allWeeklyCheckins, profileId, clientId, weekEnding) {
  const weekStart = new Date(`${weekEnding}T00:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  return allWeeklyCheckins.some(i => {
    const matchesProfile = profileId && i.client_profile_id === profileId;
    const matchesClient = !profileId && i.client_id === clientId;
    if (!matchesProfile && !matchesClient) return false;
    if (i.week_ending_date) return i.week_ending_date === weekEnding;
    const created = i.created_date?.slice(0, 10);
    return created >= weekStartStr && created <= weekEnding;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: allow admins and scheduled (unauthenticated) invocations
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse input
    let body = {};
    try { body = await req.json(); } catch { /* no body is fine */ }
    const dryRun = body.dryRun === true; // default false — scheduled runs send live
    const targetEmail = body.targetEmail || null;   // filter to single participant
    const targetCoachId = body.targetCoachId || null; // filter to single coach's participants

    // 1. Fetch data in parallel
    const [allClients, allProfiles, allWeeklyCheckins] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Profiles.list(),
      base44.asServiceRole.entities.Interactions.filter({ type: 'weekly_checkin' }),
    ]);

    // 2. Index profiles
    const profileByUserId = {};
    const profileById = {};
    allProfiles.forEach(p => {
      if (p.base44_user_id) profileByUserId[p.base44_user_id] = p;
      profileById[p.id] = p;
    });

    // 3. Filter active clients
    const activeStatuses = ['active', 'onboarding'];
    let skipped_missing_email = 0;
    let activeClients = allClients.filter(c => {
      if (!activeStatuses.includes(c.coaching_status) || !activeStatuses.includes(c.status)) return false;
      if (!c.email) { skipped_missing_email++; return false; }
      return true;
    });

    // 4. Apply targeting filters
    if (targetEmail) {
      activeClients = activeClients.filter(c => c.email?.toLowerCase() === targetEmail.toLowerCase());
    } else if (targetCoachId) {
      activeClients = activeClients.filter(c => c.coach_id === targetCoachId);
    }

    // 5. Process each client
    let reminders_sent = 0;
    let skipped_completed = 0;
    const wouldSend = [];
    const errors = [];

    const appUrl = Deno.env.get('APP_BASE_URL') || 'https://app.leadershipnexus.com';
    const checkInLink = `${appUrl}/ClientCheckIn`;

    // For manual targeted sends, skip the Friday 8am timezone gate
    const isTargeted = !!(targetEmail || targetCoachId);

    for (const client of activeClients) {
      const profile = client.base44_user_id ? profileByUserId[client.base44_user_id] : null;
      const profileId = profile?.id;
      const tz = profile?.timezone || client.timezone || DEFAULT_TIMEZONE;

      // For scheduled runs: skip if not Friday 8am. Skip this gate for targeted/manual sends.
      if (!dryRun && !isTargeted && !isFriday8amInTimezone(tz)) continue;

      const weekEnding = getWeekEndingFridayInTimezone(tz);

      if (hasCheckedInThisWeek(allWeeklyCheckins, profileId, client.id, weekEnding)) {
        skipped_completed++;
        continue;
      }

      const participantName = profile?.display_name || profile?.full_name || client.full_name || 'there';
      let coachName = 'your coach';
      if (client.coach_id) {
        const coachProfile = profileById[client.coach_id];
        coachName = coachProfile?.display_name || coachProfile?.full_name || 'your coach';
      }

      if (dryRun) {
        wouldSend.push({
          participant_name: participantName,
          email: client.email,
          coach_name: coachName,
          week_ending: weekEnding,
        });
        continue;
      }

      // Live send
      try {
        const senderName = coachName !== 'your coach' ? coachName : 'The Leadership Nexus Coaching Companion';
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          from_name: 'The Leadership Nexus Coaching Companion',
          subject: 'Leadership Nexus Weekly Check-In Reminder',
          body: `Hi ${participantName},

This is a reminder to complete your weekly Leadership Nexus Coaching Companion check-in.

Your weekly reflection takes approximately 2–3 minutes and helps you track your leadership alignment over time.

Complete your check-in here:
${checkInLink}

Thank you,
${senderName}`,
        });

        await base44.asServiceRole.entities.Client.update(client.id, {
          last_reminder_sent_at: new Date().toISOString(),
          reminder_count: (client.reminder_count || 0) + 1,
        });

        reminders_sent++;
      } catch (emailErr) {
        errors.push({ email: client.email, error: emailErr.message });
      }
    }

    return Response.json({
      dry_run: dryRun,
      targeted: isTargeted,
      total_clients_checked: activeClients.length,
      reminders_sent: dryRun ? 0 : reminders_sent,
      would_send_count: dryRun ? wouldSend.length : 0,
      skipped_completed,
      skipped_missing_email,
      errors,
      wouldSend: dryRun ? wouldSend : [],
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});