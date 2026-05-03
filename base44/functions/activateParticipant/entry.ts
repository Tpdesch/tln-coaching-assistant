import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { invitationToken, fullName, role, department } = body;

  if (!invitationToken || !fullName || !role) {
    return Response.json({ success: false, error: 'invitationToken, fullName, and role are required' }, { status: 400 });
  }

  // Look up the invitation
  const invitations = await base44.entities.ParticipantInvitation.filter({
    invitation_token: invitationToken,
  });
  const invitation = Array.isArray(invitations) ? invitations[0] : null;

  if (!invitation) {
    return Response.json({ success: false, error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.status !== 'pending') {
    return Response.json({ success: false, error: 'Invitation already used or expired' }, { status: 400 });
  }

  if (new Date() > new Date(invitation.expires_at)) {
    await base44.entities.ParticipantInvitation.update(invitation.id, { status: 'expired' });
    return Response.json({ success: false, error: 'Invitation has expired' }, { status: 400 });
  }

  // Get or recreate the Client record
  let client = null;
  if (invitation.client_id) {
    try {
      client = await base44.entities.Client.get(invitation.client_id);
    } catch (_) {}
  }
  if (!client) {
    // Client missing or deleted — check by email first
    const existingClients = await base44.asServiceRole.entities.Client.filter({ email: invitation.participant_email });
    client = Array.isArray(existingClients) ? existingClients[0] : null;
  }
  if (!client) {
    // Create a fresh Client record
    client = await base44.asServiceRole.entities.Client.create({
      full_name: invitation.participant_email.split('@')[0],
      email: invitation.participant_email,
      coach_id: invitation.coach_profile_id,
      coaching_status: 'invited',
      status: 'invited',
    });
  }
  // Always keep invitation pointing to the correct client
  if (invitation.client_id !== client.id) {
    await base44.asServiceRole.entities.ParticipantInvitation.update(invitation.id, { client_id: client.id });
  }

  // Build notes string for coach_name / department
  const notesLines = [];
  if (department?.trim()) notesLines.push(`Department: ${department.trim()}`);

  // Update the Client record with user info
  await base44.entities.Client.update(client.id, {
    full_name: fullName.trim(),
    role: role.trim(),
    email: user.email,
    base44_user_id: user.id,
    coaching_status: 'active',
    status: 'active',
    notes: notesLines.length > 0 ? notesLines.join('\n') : (client.notes || undefined),
  });

  // Create or update the Profile record for this user
  const existingProfiles = await base44.entities.Profiles.filter({ base44_user_id: user.id });
  const existingProfile = Array.isArray(existingProfiles) ? existingProfiles[0] : null;

  if (existingProfile) {
    await base44.entities.Profiles.update(existingProfile.id, {
      role: 'CLIENT',
      display_name: fullName.trim(),
    });
  } else {
    await base44.entities.Profiles.create({
      base44_user_id: user.id,
      role: 'CLIENT',
      display_name: fullName.trim(),
    });
  }

  // Mark the invitation as accepted
  await base44.entities.ParticipantInvitation.update(invitation.id, {
    status: 'accepted',
  });

  return Response.json({ success: true });
});