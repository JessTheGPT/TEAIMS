import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { streamChat } from '@/lib/streamChat';
import { STARTUP_AGENTS } from '@/lib/startupAgents';
import { SQUAD_AGENTS } from '@/lib/squadAgents';

interface ChiefOfStaffPanelProps {
  ideaId: string;
  agentCode: string; // currently selected agent for thread
  context?: string;
  collapsed: boolean;
  onToggle: () => void;
}

interface ChatRow { id: string; role: 'user' | 'assistant'; content: string; }

/**
 * Persistent per-agent chat panel. Each (idea_id, agent_code) has its own thread
 * stored in the agent_chats table — switching agents preserves history.
 */
const ChiefOfStaffPanel = ({ ideaId, agentCode, context, collapsed, onToggle }: ChiefOfStaffPanelProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const agentInfo = STARTUP_AGENTS.find(a => a.id === agentCode) || SQUAD_AGENTS.find(a => a.id === agentCode);

  // Load thread on agent change
  useEffect(() => {
    if (collapsed || !ideaId || !agentCode) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('agent_chats')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('agent_code', agentCode)
        .order('created_at');
      if (!cancelled) {
        setMessages((data as ChatRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ideaId, agentCode, collapsed]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const send = async () => {
    if (!input.trim() || streaming || !user) return;
    const userText = input.trim();
    setInput('');

    // Persist user msg
    const { data: userRow } = await supabase.from('agent_chats').insert({
      idea_id: ideaId, user_id: user.id, agent_code: agentCode, role: 'user', content: userText,
    }).select().single();

    const next: ChatRow[] = [...messages, userRow as ChatRow];
    setMessages(next);
    setStreaming(true);

    let assistantContent = '';
    const tempId = 'streaming';
    setMessages([...next, { id: tempId, role: 'assistant', content: '' }]);

    try {
      await streamChat({
        messages: next.map(m => ({ role: m.role, content: m.content })),
        agent: agentCode,
        context,
        onDelta: (delta) => {
          assistantContent += delta;
          setMessages([...next, { id: tempId, role: 'assistant', content: assistantContent }]);
        },
        onDone: async () => {
          const { data: aRow } = await supabase.from('agent_chats').insert({
            idea_id: ideaId, user_id: user.id, agent_code: agentCode,
            role: 'assistant', content: assistantContent,
          }).select().single();
          setMessages([...next, aRow as ChatRow]);
          setStreaming(false);
        },
      });
    } catch (e) {
      setStreaming(false);
      setMessages([...next, { id: tempId, role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'failed'}` }]);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-7 border-l border-border/40 bg-card/30 hover:bg-card/60 flex flex-col items-center justify-start pt-3 transition-colors group"
        title="Open agent chat"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
        <div className="mt-3 text-[10px] font-medium text-muted-foreground writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
          Direct chat
        </div>
      </button>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 border-l border-border/40 bg-card/20 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 bg-card/40 flex-shrink-0">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-xs">
          {agentInfo?.icon || '🤖'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{agentInfo?.name || agentCode}</p>
          <p className="text-[9px] text-muted-foreground truncate">Direct thread • persistent</p>
        </div>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" title="Collapse">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading thread...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">{agentInfo?.icon || '🤖'}</div>
            <p className="text-xs text-muted-foreground">
              Direct thread with {agentInfo?.name}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Conversation persists across agent switches.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={`
                max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed
                ${m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-foreground border border-border/20'}
              `}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
              {m.role === 'user' && (
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-primary" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/40 flex-shrink-0">
        <div className="flex gap-1.5">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Message ${agentInfo?.name || 'agent'}...`}
            className="resize-none min-h-[34px] max-h-[100px] text-[11px] bg-secondary/40 border-border/30"
            rows={1}
            disabled={streaming}
          />
          <Button size="icon" onClick={send} disabled={!input.trim() || streaming} className="h-8 w-8 flex-shrink-0">
            {streaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChiefOfStaffPanel;
