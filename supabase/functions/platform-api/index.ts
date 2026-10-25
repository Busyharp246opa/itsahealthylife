import { withSupabase } from 'npm:@supabase/server@1';

const cors = (request: Request) => {
  const origin = request.headers.get('origin') ?? '';
  const allowed = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
};
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const short = (value: unknown, max = 4000) => typeof value === 'string' ? value.trim().slice(0,max) : '';
const result = (data: unknown, status = 200) => Response.json(data, { status });

const secureHandler = withSupabase({ auth: 'user' }, async (request, ctx) => {
  if (request.method !== 'POST') return result({ error: 'Method not allowed' }, 405);
  const actor = ctx.userClaims?.id;
  if (!actor || !uuid(actor)) return result({ error: 'Unauthorized' }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return result({ error: 'Invalid JSON' }, 400); }
  const action = short(body.action, 80);
  const admin = ctx.supabaseAdmin;
  const { data: grants, error: grantError } = await admin.from('role_grants').select('role').eq('user_id', actor);
  if (grantError) return result({ error: 'Role lookup failed' }, 500);
  const roles = new Set((grants ?? []).map(row => row.role));
  const isAdmin = roles.has('admin');
  const needAdmin = () => isAdmin ? null : result({ error: 'Admin role required' }, 403);

  if (action === 'booking.create') {
    if (!uuid(body.slotId) || !['Virtual','In person'].includes(String(body.format))) return result({ error: 'Invalid slot or format' }, 400);
    const { data, error } = await admin.rpc('create_simulated_booking', { p_member: actor, p_slot: body.slotId, p_format: body.format });
    return error ? result({ error: error.message }, 409) : result({ bookingId: data }, 201);
  }
  if (action === 'booking.cancel' || action === 'booking.complete' || action === 'booking.resolve') {
    if (!uuid(body.bookingId)) return result({ error: 'Invalid booking' }, 400);
    const rpc = action === 'booking.cancel' ? 'cancel_simulated_booking' : action === 'booking.complete' ? 'complete_simulated_booking' : 'resolve_simulated_booking';
    const args = action === 'booking.resolve'
      ? { p_member: actor, p_booking: body.bookingId, p_dispute: body.dispute === true }
      : { p_actor: actor, p_booking: body.bookingId };
    const { data, error } = await admin.rpc(rpc, args);
    return error ? result({ error: error.message }, 409) : result({ ok: true, value: data });
  }
  if (action === 'order.create') {
    if (!uuid(body.productId) || !Number.isInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > 20) return result({ error: 'Invalid order' }, 400);
    const { data, error } = await admin.rpc('create_simulated_order', { p_member: actor, p_product: body.productId, p_quantity: body.quantity });
    return error ? result({ error: error.message }, 409) : result({ orderId: data }, 201);
  }
  if (action === 'expert.apply') {
    const specialty = short(body.specialty, 120), bio = short(body.bio, 2000), credentials = short(body.credentials, 1000);
    const price = Number(body.price);
    if (!specialty || !bio || !credentials || !Number.isFinite(price) || price < 0 || price > 10000) return result({ error: 'Complete all expert details' }, 400);
    const formats = Array.isArray(body.formats) ? body.formats.filter(x => x === 'Virtual' || x === 'In person') : ['Virtual'];
    const { error: profileError } = await admin.from('expert_profiles').upsert({ user_id: actor, specialty, bio, credentials, formats, session_price: price, currency: 'USD' });
    if (profileError) return result({ error: profileError.message }, 400);
    const { error: reviewError } = await admin.from('expert_reviews').insert({ expert_id: actor, status: 'submitted', note: 'Submitted by expert' });
    return reviewError ? result({ error: reviewError.message }, 400) : result({ ok: true }, 201);
  }
  if (action === 'expert.review') {
    const denied = needAdmin(); if (denied) return denied;
    if (!uuid(body.expertId) || !['approved','needs_changes','rejected','suspended'].includes(String(body.status))) return result({ error: 'Invalid review' }, 400);
    const note = short(body.note, 2000);
    if (body.status !== 'approved' && !note) return result({ error: 'A reason is required' }, 400);
    const { error } = await admin.from('expert_reviews').insert({ expert_id: body.expertId, reviewer_id: actor, status: body.status, note });
    if (error) return result({ error: error.message }, 400);
    if (body.status === 'approved') await admin.from('role_grants').upsert({ user_id: body.expertId, role: 'expert', granted_by: actor }, { onConflict: 'user_id,role' });
    await admin.from('audit_events').insert({ actor_id: actor, action: `expert_${body.status}`, subject_type: 'expert', subject_id: body.expertId, detail: { note } });
    return result({ ok: true });
  }
  if (action === 'content.publish') {
    const denied = needAdmin(); if (denied) return denied;
    if (!uuid(body.contentId) || typeof body.publish !== 'boolean') return result({ error: 'Invalid content action' }, 400);
    const { error } = await admin.from('content_items').update({ status: body.publish ? 'published' : 'draft', published_at: body.publish ? new Date().toISOString() : null }).eq('id', body.contentId);
    return error ? result({ error: error.message }, 400) : result({ ok: true });
  }
  if (action === 'content.create') {
    const denied = needAdmin(); if (denied) return denied;
    const title = short(body.title, 160), text = short(body.body, 10000), kind = String(body.kind);
    if (!title || !text || !['recipe','workout','meal plan','article'].includes(kind)) return result({ error: 'Invalid content' }, 400);
    const { error } = await admin.from('content_items').insert({ author_id: actor, kind, title, body: text, category: short(body.category,100)||'General', status: 'draft' });
    return error ? result({ error: error.message }, 400) : result({ ok: true }, 201);
  }
  if (action === 'challenge.create') {
    const denied = needAdmin(); if (denied) return denied;
    const steps = Array.isArray(body.steps) ? body.steps.map(x => short(x, 200)).filter(Boolean).slice(0,31) : [];
    const title = short(body.title,160), goal = short(body.goal,200);
    if (!title || !goal || !steps.length) return result({ error: 'Challenge needs a title, goal and steps' }, 400);
    const { data: challenge, error } = await admin.from('challenges').insert({ title, goal, description: short(body.description,2000), active: false }).select('id').single();
    if (error || !challenge) return result({ error: error?.message ?? 'Challenge insert failed' }, 400);
    const { error: stepsError } = await admin.from('challenge_steps').insert(steps.map((title, i) => ({ challenge_id: challenge.id, ordinal: i+1, title })));
    if (stepsError) { await admin.from('challenges').delete().eq('id', challenge.id); return result({ error: stepsError.message }, 400); }
    await admin.from('challenges').update({ active: true }).eq('id', challenge.id);
    return result({ challengeId: challenge.id }, 201);
  }
  if (action === 'product.create') {
    const denied = needAdmin(); if (denied) return denied;
    const name = short(body.name,160), price = Number(body.price), stock = Number(body.stock);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return result({ error: 'Invalid product' }, 400);
    const { error } = await admin.from('products').insert({ name, description: short(body.description,2000), price, stock, currency: 'USD', active: true });
    return error ? result({ error: error.message }, 400) : result({ ok: true }, 201);
  }
  if (action === 'ticket.update') {
    const denied = needAdmin(); if (denied) return denied;
    if (!uuid(body.ticketId) || !['open','in_progress','resolved'].includes(String(body.status))) return result({ error: 'Invalid ticket update' }, 400);
    const { error } = await admin.from('support_tickets').update({ status: body.status }).eq('id', body.ticketId);
    return error ? result({ error: error.message }, 400) : result({ ok: true });
  }
  if (action === 'report.update') {
    const denied = needAdmin(); if (denied) return denied;
    if (!uuid(body.reportId) || !['dismissed','actioned'].includes(String(body.status))) return result({ error: 'Invalid report update' }, 400);
    const { error } = await admin.from('community_reports').update({ status: body.status }).eq('id', body.reportId);
    return error ? result({ error: error.message }, 400) : result({ ok: true });
  }
  if (action === 'policy.create') {
    const denied = needAdmin(); if (denied) return denied;
    const free = Number(body.freeHours), late = Number(body.lateFeePercent), commission = Number(body.commissionPercent);
    if (![free,late,commission].every(Number.isFinite) || free < 0 || late < 0 || late > 100 || commission < 0 || commission > 100) return result({ error: 'Invalid policy' }, 400);
    const { error } = await admin.from('policy_versions').insert({ free_cancellation_hours: free, late_fee_percent: late, commission_percent: commission, published_by: actor });
    return error ? result({ error: error.message }, 400) : result({ ok: true }, 201);
  }
  return result({ error: 'Unknown action' }, 404);
});

export default {
  fetch: async (request: Request) => {
    const headers = cors(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const response = await secureHandler(request);
    const merged = new Headers(response.headers);
    for (const [key,value] of Object.entries(headers)) merged.set(key,value);
    return new Response(response.body, { status: response.status, headers: merged });
  },
};
