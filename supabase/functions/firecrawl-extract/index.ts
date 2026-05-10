import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_V2 = 'https://api.firecrawl.dev/v2';

type Mode = 'scrape' | 'map' | 'crawl' | 'search';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const mode: Mode = body.mode ?? 'scrape';
    const url: string = body.url ?? '';
    const query: string = body.query ?? '';
    if (mode !== 'search' && !url) throw new Error('url required');
    if (mode === 'search' && !query) throw new Error('query required');

    let endpoint = '';
    let payload: Record<string, unknown> = {};

    if (mode === 'scrape') {
      endpoint = '/scrape';
      payload = { url, formats: ['markdown', 'summary', 'links'], onlyMainContent: true };
    } else if (mode === 'map') {
      endpoint = '/map';
      payload = { url, limit: body.limit ?? 200, includeSubdomains: body.includeSubdomains ?? false };
    } else if (mode === 'crawl') {
      endpoint = '/crawl';
      payload = { url, limit: body.limit ?? 25, scrapeOptions: { formats: ['markdown'] } };
    } else if (mode === 'search') {
      endpoint = '/search';
      payload = { query, limit: body.limit ?? 5, scrapeOptions: { formats: ['markdown'] } };
    }

    const fcRes = await fetch(`${FIRECRAWL_V2}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const fcData = await fcRes.json();
    if (!fcRes.ok) {
      await supabase.from('firecrawl_extractions').insert({
        user_id: user.id, url: url || query, mode, status: 'failed',
        error: typeof fcData.error === 'string' ? fcData.error : JSON.stringify(fcData),
      });
      return new Response(JSON.stringify({ error: fcData.error || 'firecrawl failed', details: fcData }), {
        status: fcRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize per mode
    const data = fcData.data ?? fcData;
    let row: Record<string, unknown> = { user_id: user.id, url: url || query, mode, status: 'completed' };

    if (mode === 'scrape') {
      row.title = data.metadata?.title ?? null;
      row.markdown = data.markdown ?? null;
      row.summary = data.summary ?? null;
      row.links = data.links ?? null;
      row.metadata = data.metadata ?? null;
    } else if (mode === 'map') {
      row.title = `Map of ${url}`;
      row.links = fcData.links ?? data.links ?? [];
      row.metadata = { count: (fcData.links ?? data.links ?? []).length };
    } else if (mode === 'crawl') {
      const pages = Array.isArray(data) ? data : (data.data ?? []);
      row.title = `Crawl of ${url}`;
      row.markdown = pages.map((p: { markdown?: string; metadata?: { sourceURL?: string } }) =>
        `## ${p.metadata?.sourceURL ?? ''}\n\n${p.markdown ?? ''}`
      ).join('\n\n---\n\n');
      row.metadata = { pages: pages.length, raw: fcData };
    } else if (mode === 'search') {
      const results = Array.isArray(data) ? data : (data.web ?? data.results ?? []);
      row.title = `Search: ${query}`;
      row.markdown = results.map((r: { url?: string; title?: string; markdown?: string; description?: string }) =>
        `### [${r.title ?? r.url}](${r.url})\n${r.description ?? ''}\n\n${r.markdown ?? ''}`
      ).join('\n\n---\n\n');
      row.links = results.map((r: { url?: string }) => r.url).filter(Boolean);
      row.metadata = { count: results.length };
    }

    const { data: saved, error: saveErr } = await supabase.from('firecrawl_extractions').insert(row).select().single();
    if (saveErr) throw saveErr;

    return new Response(JSON.stringify({ ok: true, extraction: saved }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
