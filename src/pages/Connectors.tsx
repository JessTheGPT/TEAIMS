import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Send, Globe, Link2, Trash2, RefreshCw, Plus, ExternalLink, Copy, Check, FileText, Map as MapIcon, Layers, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TgLink { id: string; chat_id: number; username: string | null; first_name: string | null; linked_at: string }
interface TgMessage { update_id: number; chat_id: number; text: string | null; created_at: string; raw_update: { message?: { from?: { first_name?: string; username?: string } } } }
interface FcExtraction { id: string; url: string; mode: string; title: string | null; markdown: string | null; summary: string | null; links: unknown; metadata: unknown; status: string; error: string | null; created_at: string }

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const callFn = async (name: string, body: Record<string, unknown>) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      apikey: ANON,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
};

const Connectors = () => {
  const { user, loading } = useAuth();
  const [tgLinks, setTgLinks] = useState<TgLink[]>([]);
  const [tgMessages, setTgMessages] = useState<TgMessage[]>([]);
  const [tgWebhookInfo, setTgWebhookInfo] = useState<{ url?: string; pending_update_count?: number; last_error_message?: string } | null>(null);
  const [tgChatId, setTgChatId] = useState('');
  const [tgRegistering, setTgRegistering] = useState(false);
  const [tgLoading, setTgLoading] = useState(true);

  const [fcExtractions, setFcExtractions] = useState<FcExtraction[]>([]);
  const [fcUrl, setFcUrl] = useState('');
  const [fcQuery, setFcQuery] = useState('');
  const [fcMode, setFcMode] = useState<'scrape' | 'map' | 'crawl' | 'search'>('scrape');
  const [fcRunning, setFcRunning] = useState(false);
  const [fcSelected, setFcSelected] = useState<FcExtraction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    refreshTelegram();
    refreshFirecrawl();

    const ch = supabase
      .channel('tg-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telegram_messages', filter: `user_id=eq.${user.id}` },
        (payload) => setTgMessages(prev => [payload.new as TgMessage, ...prev].slice(0, 100)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const refreshTelegram = async () => {
    setTgLoading(true);
    const [{ data: links }, { data: msgs }] = await Promise.all([
      supabase.from('telegram_links').select('*').order('linked_at', { ascending: false }),
      supabase.from('telegram_messages').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setTgLinks((links ?? []) as TgLink[]);
    setTgMessages((msgs ?? []) as TgMessage[]);
    const info = await callFn('telegram-setup', { action: 'info' });
    if (info.ok) setTgWebhookInfo(info.data.info);
    setTgLoading(false);
  };

  const refreshFirecrawl = async () => {
    const { data } = await supabase.from('firecrawl_extractions').select('*').order('created_at', { ascending: false }).limit(50);
    setFcExtractions((data ?? []) as FcExtraction[]);
  };

  const linkChat = async () => {
    const id = parseInt(tgChatId.trim());
    if (!id) { toast.error('Enter a numeric chat ID'); return; }
    const { error } = await supabase.from('telegram_links').insert({ user_id: user!.id, chat_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success('Chat linked');
    setTgChatId('');
    refreshTelegram();
  };

  const unlinkChat = async (id: string) => {
    await supabase.from('telegram_links').delete().eq('id', id);
    toast.success('Unlinked');
    refreshTelegram();
  };

  const registerWebhook = async () => {
    setTgRegistering(true);
    const r = await callFn('telegram-setup', { action: 'register' });
    setTgRegistering(false);
    if (r.ok) toast.success('Webhook registered'); else toast.error(r.data.error || 'Failed');
    refreshTelegram();
  };

  const runFirecrawl = async () => {
    if (fcMode === 'search' && !fcQuery.trim()) { toast.error('Enter a query'); return; }
    if (fcMode !== 'search' && !fcUrl.trim()) { toast.error('Enter a URL'); return; }
    setFcRunning(true);
    const r = await callFn('firecrawl-extract', { mode: fcMode, url: fcUrl.trim(), query: fcQuery.trim() });
    setFcRunning(false);
    if (!r.ok) { toast.error(r.data.error || 'Firecrawl failed'); return; }
    toast.success(`${fcMode} complete`);
    setFcUrl(''); setFcQuery('');
    refreshFirecrawl();
    setFcSelected(r.data.extraction);
  };

  const deleteExtraction = async (id: string) => {
    await supabase.from('firecrawl_extractions').delete().eq('id', id);
    if (fcSelected?.id === id) setFcSelected(null);
    refreshFirecrawl();
  };

  const promoteToContext = async (ex: FcExtraction) => {
    const slug = `firecrawl-${ex.id.slice(0, 8)}`;
    const content = `# ${ex.title ?? ex.url}\n\nSource: ${ex.url}\nMode: ${ex.mode}\n\n${ex.summary ? `## Summary\n${ex.summary}\n\n` : ''}${ex.markdown ?? ''}`;
    const { error } = await supabase.from('context_files').insert({
      user_id: user!.id, slug, title: ex.title ?? ex.url, content, category: 'extracted',
      description: `Extracted via Firecrawl (${ex.mode})`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Saved as context file');
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const modeIcons = { scrape: FileText, map: MapIcon, crawl: Layers, search: Search };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Data Connectors</h1>
          <p className="text-sm text-muted-foreground mt-1">Pull real-world signal into your agent context — Telegram intake and Firecrawl extraction.</p>
        </div>

        <Tabs defaultValue="telegram" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="telegram" className="gap-1.5"><Send className="w-3.5 h-3.5" /> Telegram</TabsTrigger>
            <TabsTrigger value="firecrawl" className="gap-1.5"><Globe className="w-3.5 h-3.5" /> Firecrawl</TabsTrigger>
          </TabsList>

          {/* TELEGRAM */}
          <TabsContent value="telegram" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold">Webhook</h2>
                  <p className="text-[11px] text-muted-foreground">Register the bot webhook so messages stream into your feed automatically.</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={refreshTelegram} className="gap-1"><RefreshCw className="w-3 h-3" /> Refresh</Button>
                  <Button size="sm" onClick={registerWebhook} disabled={tgRegistering} className="gap-1">
                    {tgRegistering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                    Register webhook
                  </Button>
                </div>
              </div>
              {tgWebhookInfo && (
                <div className="text-[11px] space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={tgWebhookInfo.url ? 'default' : 'outline'} className="text-[10px]">
                      {tgWebhookInfo.url ? 'active' : 'not set'}
                    </Badge>
                    <code className="text-muted-foreground truncate">{tgWebhookInfo.url || '(none)'}</code>
                  </div>
                  <div className="text-muted-foreground">Pending updates: {tgWebhookInfo.pending_update_count ?? 0}</div>
                  {tgWebhookInfo.last_error_message && (
                    <div className="text-destructive">Last error: {tgWebhookInfo.last_error_message}</div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-2">Linked Chats</h2>
              <p className="text-[11px] text-muted-foreground mb-3">
                Send <code>/start</code> to your bot to receive your chat ID, then paste it below to link this account. Only messages from linked chats are routed to you.
              </p>
              <div className="flex gap-2 mb-3">
                <Input value={tgChatId} onChange={e => setTgChatId(e.target.value)} placeholder="Chat ID (e.g. 123456789)" className="text-xs h-8" />
                <Button size="sm" onClick={linkChat} className="gap-1"><Plus className="w-3 h-3" /> Link</Button>
              </div>
              <div className="space-y-1">
                {tgLinks.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No linked chats yet.</p>
                ) : tgLinks.map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/40">
                    <span className="font-mono">{l.chat_id}</span>
                    <span className="text-muted-foreground">{l.username ? `@${l.username}` : (l.first_name ?? '')}</span>
                    <Button size="sm" variant="ghost" onClick={() => unlinkChat(l.id)} className="h-6 px-2 text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Inbound Feed</h2>
                <span className="text-[10px] text-muted-foreground">{tgMessages.length} messages</span>
              </div>
              {tgLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : tgMessages.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">No messages yet. Send something to your bot from a linked chat.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {tgMessages.map(m => {
                    const from = m.raw_update.message?.from;
                    return (
                      <div key={m.update_id} className="text-xs border-l-2 border-primary/40 pl-3 py-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>{from?.username ? `@${from.username}` : from?.first_name ?? `chat ${m.chat_id}`}</span>
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-foreground whitespace-pre-wrap">{m.text || <em className="text-muted-foreground">(non-text update)</em>}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* FIRECRAWL */}
          <TabsContent value="firecrawl" className="space-y-4">
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3">Extract</h2>
              <div className="flex gap-1 mb-3">
                {(['scrape', 'map', 'crawl', 'search'] as const).map(m => {
                  const Icon = modeIcons[m];
                  return (
                    <Button key={m} size="sm" variant={fcMode === m ? 'default' : 'outline'} onClick={() => setFcMode(m)} className="gap-1 capitalize">
                      <Icon className="w-3 h-3" /> {m}
                    </Button>
                  );
                })}
              </div>
              {fcMode === 'search' ? (
                <Input value={fcQuery} onChange={e => setFcQuery(e.target.value)} placeholder="Search query..." className="text-xs h-9 mb-2" />
              ) : (
                <Input value={fcUrl} onChange={e => setFcUrl(e.target.value)} placeholder="https://example.com" className="text-xs h-9 mb-2" />
              )}
              <Button onClick={runFirecrawl} disabled={fcRunning} className="gap-1.5 w-full">
                {fcRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                Run {fcMode}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">
                Scrape returns markdown + summary. Map lists URLs. Crawl walks the site (up to 25 pages). Search runs a web query.
              </p>
            </Card>

            <div className="grid grid-cols-12 gap-4">
              <Card className="col-span-5 p-3 max-h-[600px] overflow-y-auto">
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">History</h3>
                {fcExtractions.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No extractions yet.</p>
                ) : (
                  <div className="space-y-1">
                    {fcExtractions.map(ex => {
                      const Icon = modeIcons[ex.mode as keyof typeof modeIcons] ?? FileText;
                      return (
                        <button
                          key={ex.id}
                          onClick={() => setFcSelected(ex)}
                          className={`w-full text-left p-2 rounded text-xs transition-colors ${fcSelected?.id === ex.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Icon className="w-3 h-3 text-primary shrink-0" />
                            <span className="font-medium truncate">{ex.title ?? ex.url}</span>
                            {ex.status === 'failed' && <Badge variant="destructive" className="text-[9px] px-1">fail</Badge>}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{ex.url}</div>
                          <div className="text-[9px] text-muted-foreground">{new Date(ex.created_at).toLocaleString()}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="col-span-7 p-4 max-h-[600px] overflow-y-auto">
                {fcSelected ? (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">{fcSelected.title ?? fcSelected.url}</h3>
                        <a href={fcSelected.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" /> {fcSelected.url}
                        </a>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button size="sm" variant="ghost" onClick={() => copy(fcSelected.markdown ?? '', fcSelected.id)} title="Copy markdown">
                          {copiedId === fcSelected.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => promoteToContext(fcSelected)} title="Save as context file">
                          <FileText className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteExtraction(fcSelected.id)} className="text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {fcSelected.error && <p className="text-xs text-destructive mb-2">{fcSelected.error}</p>}
                    {fcSelected.summary && (
                      <div className="mb-3 p-2 rounded bg-primary/5 border border-primary/20 text-xs">
                        <div className="text-[10px] uppercase text-muted-foreground mb-1">Summary</div>
                        {fcSelected.summary}
                      </div>
                    )}
                    {Array.isArray(fcSelected.links) && fcSelected.links.length > 0 && (
                      <details className="mb-3">
                        <summary className="text-[11px] text-muted-foreground cursor-pointer">Links ({fcSelected.links.length})</summary>
                        <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                          {(fcSelected.links as string[]).map((l, i) => (
                            <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-[10px] text-primary hover:underline truncate">{l}</a>
                          ))}
                        </div>
                      </details>
                    )}
                    {fcSelected.markdown && (
                      <pre className="text-[11px] whitespace-pre-wrap font-mono text-foreground/90 leading-relaxed">{fcSelected.markdown}</pre>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    Select an extraction to view
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Connectors;
