import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Terminal, FileText, Clock, Tag, ChevronRight } from 'lucide-react';

interface SharedFile {
  slug: string;
  title: string;
  category: string;
  content: string;
  description?: string;
  version: number;
  updated_at: string;
}

interface SharedData {
  generated_at: string;
  format: string;
  mode: 'single_file' | 'aggregate';
  file?: SharedFile;
  files?: Record<string, SharedFile>;
  index?: { slug: string; title: string; category: string; description?: string }[];
  judgement_rules?: { category: string; rule: string; confidence: string }[];
}

const SharedContext = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchContext = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/agent-context/${token}`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || `Error ${res.status}`);
          return;
        }
        setData(await res.json());
      } catch (e: any) {
        setError(e.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Terminal className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-mono text-red-400 mb-2">Access Denied</h1>
          <p className="text-zinc-500 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isSingle = data.mode === 'single_file' && data.file;
  const files = isSingle
    ? [data.file!]
    : data.index?.map(i => ({ ...i, ...(data.files?.[i.slug] || {}) })) as SharedFile[] || [];

  return (
    <div className="min-h-screen bg-[#0a0e14] text-zinc-300 font-mono">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <Terminal className="w-4 h-4" />
            <span className="text-xs tracking-widest uppercase">Agent Context</span>
            <span className="text-zinc-600 text-xs">v1</span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-2xl">
            Structured context payload for AI agents. Each section is a discrete context file — 
            consume headings as semantic anchors. Content is authoritative unless marked otherwise.
            {isSingle
              ? ' This link contains a single file.'
              : ` This bundle contains ${files.length} file${files.length !== 1 ? 's' : ''}.`}
          </p>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-600">
            <span>generated: {new Date(data.generated_at).toISOString()}</span>
            <span>format: {data.format}</span>
          </div>
        </div>
      </header>

      {/* Index (aggregate only) */}
      {!isSingle && files.length > 1 && (
        <nav className="border-b border-zinc-800/30 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Index</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {files.map(f => (
                <a
                  key={f.slug}
                  href={`#${f.slug}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/40 transition-colors group"
                >
                  <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                  <span className="text-xs text-zinc-400 group-hover:text-cyan-400 transition-colors">{f.title}</span>
                  <span className="text-[10px] text-zinc-700 ml-auto">{f.category}</span>
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Files */}
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {files.map(f => (
            <section key={f.slug} id={f.slug} className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-1">
                <FileText className="w-4 h-4 text-cyan-500/60" />
                <h2 className="text-cyan-400 text-sm font-semibold">{f.title}</h2>
                {f.version && (
                  <span className="text-[10px] text-zinc-700 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> v{f.version}
                  </span>
                )}
              </div>
              {f.description && (
                <p className="text-zinc-600 text-xs mb-3 ml-7">{f.description}</p>
              )}
              {f.updated_at && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-700 mb-3 ml-7">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{new Date(f.updated_at).toLocaleDateString()}</span>
                </div>
              )}
              <pre className="whitespace-pre-wrap text-sm leading-6 text-zinc-300 bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-5 ml-7 overflow-x-auto">
                {f.content || '(empty)'}
              </pre>
            </section>
          ))}

          {/* Judgement Rules */}
          {data.judgement_rules && data.judgement_rules.length > 0 && (
            <section id="judgement-rules" className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-4 h-4 text-amber-500/60" />
                <h2 className="text-amber-400 text-sm font-semibold">Active Judgement Rules</h2>
              </div>
              <div className="space-y-2 ml-7">
                {data.judgement_rules.map((r, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400">{r.category}</span>
                      <span className="text-zinc-700">confidence: {r.confidence}</span>
                    </div>
                    <p className="text-zinc-400">{r.rule}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 px-6 py-4 mt-12">
        <div className="max-w-4xl mx-auto text-[10px] text-zinc-700">
          <span>Powered by TEAiMS Agent Context System</span>
        </div>
      </footer>
    </div>
  );
};

export default SharedContext;
