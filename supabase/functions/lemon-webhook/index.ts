import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('X-Signature') ?? ''
  const secret = Deno.env.get('LEMON_WEBHOOK_SECRET') ?? ''

  if (!secret) {
    console.error('LEMON_WEBHOOK_SECRET not configured')
    return new Response('Server misconfigured', { status: 500 })
  }

  // Verify HMAC-SHA256 signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (signature !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = JSON.parse(rawBody)

  // Only handle successful orders
  if (payload.meta?.event_name !== 'order_created') {
    return new Response('OK', { status: 200 })
  }

  const eventId = payload.meta?.custom_data?.event_id
  if (!eventId) {
    return new Response('Missing event_id in custom_data', { status: 400 })
  }

  // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { error } = await supabase
    .from('events')
    .update({ is_paid: true })
    .eq('id', eventId)

  if (error) {
    console.error('Supabase update failed:', error.message)
    return new Response('DB error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
})
