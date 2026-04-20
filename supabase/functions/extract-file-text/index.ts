// Extracts text from uploaded files (PDF, images, plain text) using Lovable AI Gateway.
// Input: { storage_path: string, mime_type: string, file_name: string }
// Output: { text: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { storage_path, mime_type, file_name } = await req.json();
    if (!storage_path) {
      return new Response(JSON.stringify({ error: 'storage_path required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download file from storage
    const fileRes = await fetch(`${SUPABASE_URL}/storage/v1/object/idea-files/${storage_path}`, {
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
    });
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: 'file not found', text: '' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Plain text or markdown — read directly
    if (mime_type?.startsWith('text/') || /\.(md|txt|csv|json|log)$/i.test(file_name || '')) {
      const text = await fileRes.text();
      return new Response(JSON.stringify({ text: text.slice(0, 50000) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Images and PDFs — use multimodal model
    if (mime_type?.startsWith('image/') || mime_type === 'application/pdf') {
      const buf = await fileRes.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const dataUrl = `data:${mime_type};base64,${b64}`;

      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extract ALL readable text content from this file verbatim. Preserve structure (headings, lists, tables) using markdown. Output only the extracted text — no commentary.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          }],
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return new Response(JSON.stringify({ text: `[Could not extract text: ${err.slice(0, 200)}]` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const aiData = await aiRes.json();
      const text = aiData.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({ text: text.slice(0, 50000) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text: `[Unsupported file type: ${mime_type}]` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), text: '' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
