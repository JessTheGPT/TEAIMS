import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function deriveSecret(token: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${token}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const TG = Deno.env.get('TELEGRAM_API_KEY');
  if (!TG) return new Response('not configured', { status: 500 });

  const expected = await deriveSecret(TG);
  const actual = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!safeEqual(actual, expected)) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const update = await req.json();
  const message = update.message ?? update.edited_message ?? update.channel_post;
  if (!message?.chat?.id || typeof update.update_id !== 'number') {
    return new Response(JSON.stringify({ ok: true, ignored: true }));
  }

  // Map chat → user via telegram_links
  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('chat_id', message.chat.id)
    .maybeSingle();

  await supabase.from('telegram_messages').upsert({
    update_id: update.update_id,
    user_id: link?.user_id ?? null,
    chat_id: message.chat.id,
    from_user_id: message.from?.id ?? null,
    text: message.text ?? message.caption ?? null,
    raw_update: update,
  }, { onConflict: 'update_id' });

  // Helpful auto-reply for unlinked chats so user knows their chat_id
  if (!link && message.text === '/start') {
    try {
      await fetch('https://connector-gateway.lovable.dev/telegram/sendMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'X-Connection-Api-Key': TG,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: `Welcome to TEAIMS Intake.\n\nYour chat ID: <code>${message.chat.id}</code>\n\nPaste this in the Connectors page to link this chat to your account.`,
          parse_mode: 'HTML',
        }),
      });
    } catch (_) { /* ignore */ }
  }

  return new Response(JSON.stringify({ ok: true }));
});
