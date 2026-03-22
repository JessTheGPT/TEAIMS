import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const token = pathParts[pathParts.length - 1]

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token required. Usage: /agent-context/{token}' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('token', token)
      .eq('resource_type', 'context')
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired context token' }),
        { status: 401, headers: corsHeaders }
      )
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Update access count
    await supabase
      .from('share_tokens')
      .update({
        access_count: (tokenData.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', tokenData.id)

    // Fetch all shared context files
    const { data: files } = await supabase
      .from('context_files')
      .select('slug, title, content, category, description, version, updated_at')
      .eq('is_shared', true)
      .order('category')
      .order('title')

    // Format as agent-consumable context
    const context: Record<string, unknown> = {
      generated_at: new Date().toISOString(),
      format: 'agent-context-v1',
      files: (files || []).reduce((acc: Record<string, unknown>, file: any) => {
        acc[file.slug] = {
          title: file.title,
          category: file.category,
          content: file.content,
          version: file.version,
          updated_at: file.updated_at,
        }
        return acc
      }, {}),
      index: (files || []).map((f: any) => ({
        slug: f.slug,
        title: f.title,
        category: f.category,
        description: f.description,
      })),
    }

    // Also fetch active judgement rules for the owner
    const { data: rules } = await supabase
      .from('judgement_rules')
      .select('category, rule, confidence, active')
      .eq('active', true)

    if (rules && rules.length > 0) {
      context.judgement_rules = rules
    }

    return new Response(
      JSON.stringify(context, null, 2),
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
