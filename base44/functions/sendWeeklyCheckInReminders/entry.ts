import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_TIMEZONE = 'America/New_York';

// Returns true if it's currently Friday 8am in the given timezone
function isFriday8amInTimezone(tz) {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find(p => p.type === 'weekday')?.value; // e.g. "Fri"
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value, 10); // 0-23

    return weekday === 'Fri' && hour === 8;
  } catch {
    // Unknown timezone — fall back to default
    return isFriday8amInTimezone(DEFAULT_TIMEZONE);
  }
}

// Returns the Friday (week-ending date) for the participant's current week as "YYYY-MM-DD"
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
    const weekday = parts.find(p => p.type === 'weekday')?.value; // "Fri", "Mon", etc.
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
    const dayOfWeek = localDate.getDay(); // 0=Sun .. 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const friday = new Date(localDate);
    friday.setDate(localDate.getDate() + daysUntilFriday);
    return friday.toISOString().slice(0, 10);
  } catch {
    return getWeekEndingFridayInTimezone(DEFAULT_TIMEZONE);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled/admin invocations only
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch all active clients — skip those missing email
    const activeStatuses = ['active', 'onboarding'];
    const allClients = await base44.asServiceRole.entities.Client.list();
    const skippedMissingEmail = [];
    const activeClients = allClients.filter(c => {
      if (!activeStatuses.includes(c.coaching_status) || !activeStatuses.includes(c.status)) return false;
      if (!c.email) { skippedMissingEmail.push(c.full_name || c.id); return false; }
      return true;
    });

    if (!activeClients.length) {
      return Response.json({ message: 'No active participants found.', sent: 0, skipped_missing_email: skippedMissingEmail.length });
    }

    // 2. Fetch profiles — index by base44_user_id and by id
    const allProfiles = await base44.asServiceRole.entities.Profiles.list();
    const profileByUserId = {};
    const profileById = {};
    allProfiles.forEach(p => {
      if (p.base44_user_id) profileByUserId[p.base44_user_id] = p;
      profileById[p.id] = p;
    });

    // 3. Fetch all weekly check-ins for this run (used across all clients)
    const allWeeklyCheckins = await base44.asServiceRole.entities.Interactions.filter({ type: 'weekly_checkin' });

    // 4. Process each client
    let sent = 0;
    const skipped = [];
    const notYet = [];
    const errors = [];

    for (const client of activeClients) {
      const profile = client.base44_user_id ? profileByUserId[client.base44_user_id] : null;
      const profileId = profile?.id;

      const tz = profile?.timezone || client.timezone || DEFAULT_TIMEZONE;

      // Only send if it's Friday 8am in this participant's timezone
      if (!isFriday8amInTimezone(tz)) {
        notYet.push({ email: client.email, tz });
        continue;
      }

      // Determine the correct week-ending Friday in their timezone
      const weekEnding = getWeekEndingFridayInTimezone(tz);

      // Check if they already submitted a check-in for this week.
      // Primary match: client_profile_id when the participant has a Profile.
      // Fallback: client_id for participants without a Profile.
      // Also accept interactions this week that used created_date instead of week_ending_date.
      const weekStart = new Date(`${weekEnding}T00:00:00`);
      weekStart.setDate(weekStart.getDate() - 6); // Mon of that week
      const weekStartStr = weekStart.toISOString().slice(0, 10);

      const alreadyCheckedIn = allWeeklyCheckins.some(i => {
        // Match to this participant
        const matchesProfile = profileId && i.client_profile_id === profileId;
        const matchesClient = !profileId && i.client_id === client.id;
        if (!matchesProfile && !matchesClient) return false;

        // Check week: prefer week_ending_date, fall back to created_date within the week
        if (i.week_ending_date) return i.week_ending_date === weekEnding;
        const created = i.created_date?.slice(0, 10);
        return created >= weekStartStr && created <= weekEnding;
      });

      if (alreadyCheckedIn) {
        skipped.push(client.email);
        continue;
      }

      // Resolve coach name: Profiles.display_name → Profiles.full_name → "your coach"
      let coachName = 'your coach';
      if (client.coach_id) {
        const coachProfile = profileById[client.coach_id];
        coachName = coachProfile?.display_name || coachProfile?.full_name || 'your coach';
      }

      // Send reminder email
      try {
        const appUrl = Deno.env.get('APP_BASE_URL');
        const checkInLink = appUrl ? `${appUrl}/ClientCheckIn` : 'https://app.leadershipnexus.com/ClientCheckIn';

        const participantName = profile?.display_name || profile?.full_name || client.full_name || 'there';

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
${coachName !== 'your coach' ? coachName : 'The Leadership Nexus Coaching Companion'}`,
        });

        // Update reminder tracking fields on the Client record
        await base44.asServiceRole.entities.Client.update(client.id, {
          last_reminder_sent_at: new Date().toISOString(),
          reminder_count: (client.reminder_count || 0) + 1,
        });

        sent++;
      } catch (emailErr) {
        errors.push({ email: client.email, error: emailErr.message });
      }
    }

    return Response.json({
      message: 'Weekly check-in reminder run complete.',
      sent,
      skipped: skipped.length,
      skipped_missing_email: skippedMissingEmail.length,
      not_yet_their_8am: notYet.length,
      errors,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});