import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns the Friday (week-ending date) for the current week as "YYYY-MM-DD"
function getCurrentWeekEndingFriday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  return friday.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled/admin calls only
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const weekEnding = getCurrentWeekEndingFriday();

    // 1. Fetch all active clients (exclude inactive / removed)
    const activeStatuses = ['active', 'onboarding'];
    const allClients = await base44.asServiceRole.entities.Client.list();
    const activeClients = allClients.filter(c =>
      activeStatuses.includes(c.coaching_status) &&
      activeStatuses.includes(c.status) &&
      c.email
    );

    if (!activeClients.length) {
      return Response.json({ message: 'No active participants found.', sent: 0 });
    }

    // 2. Fetch all weekly_checkin interactions for the current week-ending date
    const weeklyCheckins = await base44.asServiceRole.entities.Interactions.filter({
      type: 'weekly_checkin',
      week_ending_date: weekEnding,
    });

    const checkedInProfileIds = new Set(weeklyCheckins.map(i => i.client_profile_id));

    // 3. Also check by client_id for interactions that use that field
    const checkedInClientIds = new Set(weeklyCheckins.map(i => i.client_id).filter(Boolean));

    // 4. Fetch profiles to map base44_user_id -> profile id
    const allProfiles = await base44.asServiceRole.entities.Profiles.list();
    const profileByUserId = {};
    allProfiles.forEach(p => { profileByUserId[p.base44_user_id] = p; });

    // 5. Send reminders to participants who haven't checked in
    let sent = 0;
    const skipped = [];
    const errors = [];

    for (const client of activeClients) {
      // Determine if this client already checked in this week
      // Match by client_profile_id or client_id
      const profile = client.base44_user_id ? profileByUserId[client.base44_user_id] : null;
      const profileId = profile?.id;

      const alreadyCheckedIn =
        (profileId && checkedInProfileIds.has(profileId)) ||
        checkedInClientIds.has(client.id);

      if (alreadyCheckedIn) {
        skipped.push(client.email);
        continue;
      }

      // Send reminder email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: "Your weekly leadership check-in is ready",
          body: `Hi ${client.full_name || 'there'},

This is a friendly reminder to complete your weekly leadership check-in.

Your check-in helps track your alignment progress and gives your coach the insights they need to support you effectively.

It only takes a few minutes — please log in and submit your check-in for this week.

${Deno.env.get('APP_BASE_URL') ? Deno.env.get('APP_BASE_URL') + '/ClientCheckIn' : 'Please log in to the TLN Coaching platform to complete your check-in.'}

Thank you,
TLN Coaching Assistant`,
        });
        sent++;
      } catch (emailErr) {
        errors.push({ email: client.email, error: emailErr.message });
      }
    }

    return Response.json({
      message: `Weekly check-in reminders sent.`,
      week_ending: weekEnding,
      sent,
      skipped: skipped.length,
      errors,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});