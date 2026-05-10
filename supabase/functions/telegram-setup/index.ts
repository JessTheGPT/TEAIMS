import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function deriveSecret(token: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${token}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const TG = Deno.env.get('TELEGRAM_API_KEY');
    const LK = Deno.env.get('LOVABLE_API_KEY');
    if (!TG || !LK) throw new Error('Telegram/Lovable keys not configured');

    const body = await req.json();
    const action = body.action as 'register' | 'info' | 'unregister';
    const projectId = Deno.env.get('SUPABASE_URL')!.match(/\/\/([^.]+)\./)?.[1];
    const webhookUrl = `https://${projectId}.supabase.co/functions/v1/telegram-webhook`;
    const headers = {
      Authorization: `Bearer ${LK}`, 'X-Connection-Api-Key': TG, 'Content-Type': 'application/json',
    };

    if (action === 'register') {
      const secret = await deriveSecret(TG);
      const res = await fetch('https://connector-gateway.lovable.dev/telegram/setWebhook', {
        method: 'POST', headers,
        body: JSON.stringify({
          url: webhookUrl, secret_token: secret,
          allowed_updates: ['message', 'edited_message', 'channel_post'],
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ ok: res.ok, webhookUrl, data }), {
        status: res.ok ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (action === 'unregister') {
      const res = await fetch('https://connector-gateway.lovable.dev/telegram/deleteWebhook', {
        method: 'POST', headers, body: JSON.stringify({}),
      });
      return new Response(JSON.stringify({ ok: res.ok, data: await res.json() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // info
    const res = await fetch('https://connector-gateway.lovable.dev/telegram/getWebhookInfo', {
      method: 'POST', headers, body: JSON.stringify({}),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, expectedUrl: webhookUrl, info: data.result ?? data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
