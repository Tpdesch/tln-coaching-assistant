import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { participantEmail, participantName, coachProfileId } = body;

  if (!participantEmail || !coachProfileId) {
    return Response.json({ ok: false, error_message: 'participantEmail and coachProfileId are required' }, { status: 400 });
  }

  // Verify the caller is the coach owning this profile
  const profiles = await base44.entities.Profiles.filter({ base44_user_id: user.id });
  const callerProfile = Array.isArray(profiles) ? profiles[0] : null;
  if (!callerProfile || callerProfile.id !== coachProfileId) {
    return Response.json({ ok: false, error_message: 'Forbidden: not your coach profile' }, { status: 403 });
  }

  // Check for existing invitation
  const existingInvitations = await base44.entities.ParticipantInvitation.filter({
    participant_email: participantEmail,
    status: 'pending',
  });
  const existingPending = Array.isArray(existingInvitations) ? existingInvitations[0] : null;
  if (existingPending) {
    // Return the existing invitation URL
    return Response.json({
      ok: true,
      invitation_url: existingPending.invitation_url,
      message: 'Existing pending invitation returned',
    });
  }

  // Check if there's already a Client record for this email
  const existingClients = await base44.entities.Client.filter({ email: participantEmail });
  let client = Array.isArray(existingClients) ? existingClients[0] : null;

  // Create or update the Client record
  if (!client) {
    client = await base44.entities.Client.create({
      full_name: participantName || participantEmail.split('@')[0],
      email: participantEmail,
      coach_id: coachProfileId,
      coaching_status: 'invited',
      status: 'invited',
    });
  } else {
    // Update coach assignment and status
    await base44.entities.Client.update(client.id, {
      coach_id: coachProfileId,
      coaching_status: 'invited',
      status: 'invited',
    });
  }

  // Generate a secure invitation token
  const tokenBytes = new Uint8Array(24);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Set expiry to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Build the invitation URL — prefer APP_BASE_URL secret, fall back to request origin, then published app URL
  const secretAppUrl = Deno.env.get('APP_BASE_URL') || '';
  let appBaseUrl = '';
  if (/^https?:\/\//.test(secretAppUrl)) {
    appBaseUrl = secretAppUrl.replace(/\/+$/, '');
  } else {
    const reqOrigin = req.headers.get('origin') || req.headers.get('referer') || '';
    appBaseUrl = 'https://nexus-coach-assistant.base44.app';
    if (reqOrigin) {
      try { appBaseUrl = new URL(reqOrigin).origin; } catch (_) {}
    }
  }
  const invitation_url = `${appBaseUrl}/participant-welcome?token=${token}`;

  // Create the ParticipantInvitation record
  await base44.entities.ParticipantInvitation.create({
    client_id: client.id,
    coach_profile_id: coachProfileId,
    invitation_token: token,
    participant_email: participantEmail,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
    invitation_url,
  });

  // Send invitation email
  try {
    const coachName = callerProfile?.full_name || callerProfile?.display_name || user.full_name || 'Your Coach';
    const coachFirstName = coachName.trim().split(/\s+/)[0];
    const firstName = participantName ? participantName.trim().split(/\s+/)[0] : '';
    const greeting = firstName || 'there';
    await base44.integrations.Core.SendEmail({
      to: participantEmail,
      subject: `You've been invited to TLN Coaching Assistant`,
      body: `Hi ${greeting},

${coachFirstName} has invited you to join TLN Coaching Assistant — a space for weekly leadership alignment check-ins.

Click the link below to get started:
${invitation_url}

This link expires in 7 days.

The Leadership Nexus Team`,
    });
  } catch (e) {
    console.error('Email send failed (non-fatal):', e);
  }

  return Response.json({
    ok: true,
    invitation_url,
    client_id: client.id,
  });
});