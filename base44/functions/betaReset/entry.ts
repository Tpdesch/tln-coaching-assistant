import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEST_PATTERNS = /test|demo|sample|dummy|fake|example|placeholder/i;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the profile and verify admin role
  const profiles = await base44.asServiceRole.entities.Profiles.filter({ base44_user_id: user.id });
  const profile = Array.isArray(profiles) ? profiles[0] : null;

  if (!profile || (profile.role !== 'admin' && profile.role !== 'coach_admin')) {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || 'preview'; // 'preview' or 'execute'

  // Fetch counts
  const [interactions, inferenceRuns, clients] = await Promise.all([
    base44.asServiceRole.entities.Interactions.list(),
    base44.asServiceRole.entities.InferenceRuns.list(),
    base44.asServiceRole.entities.Client.list(),
  ]);

  // Identify test/demo client records
  const testClients = clients.filter(c => {
    const name = c.full_name || '';
    const email = c.email || '';
    return TEST_PATTERNS.test(name) || TEST_PATTERNS.test(email);
  });

  if (mode === 'preview') {
    return Response.json({
      mode: 'preview',
      interactions_count: interactions.length,
      inference_runs_count: inferenceRuns.length,
      test_clients: testClients.map(c => ({
        id: c.id,
        full_name: c.full_name,
        email: c.email || '—',
        coaching_status: c.coaching_status,
      })),
    });
  }

  if (mode === 'execute') {
    // Delete all Interactions
    let deletedInteractions = 0;
    for (const record of interactions) {
      await base44.asServiceRole.entities.Interactions.delete(record.id);
      deletedInteractions++;
    }

    // Delete all InferenceRuns
    let deletedRuns = 0;
    for (const record of inferenceRuns) {
      await base44.asServiceRole.entities.InferenceRuns.delete(record.id);
      deletedRuns++;
    }

    return Response.json({
      mode: 'execute',
      deleted_interactions: deletedInteractions,
      deleted_inference_runs: deletedRuns,
      message: 'Beta reset complete. Profiles, Clients, and configuration data were not touched.',
    });
  }

  return Response.json({ error: 'Invalid mode. Use "preview" or "execute".' }, { status: 400 });
});