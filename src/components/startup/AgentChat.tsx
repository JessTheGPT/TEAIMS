import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { streamChat } from '@/lib/streamChat';
import { STARTUP_AGENTS } from '@/lib/startupAgents';
import { SQUAD_AGENTS } from '@/lib/squadAgents';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentChatProps {
  ideaId: string;
  agent: string;
  context?: string;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  onReadyToAdvance?: () => void;
  onDelegation?: (fromAgent: string, toAgent: string, msg: string) => void;
  disabled?: boolean;
}

const AgentChat = ({ 
  ideaId, agent, context, messages, onMessagesChange, onReadyToAdvance, onDelegation, disabled 
}: AgentChatProps) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const agentInfo = STARTUP_AGENTS.find(a => a.id === agent) || SQUAD_AGENTS.find(a => a.id === agent);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || disabled) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    onMessagesChange(updated);
    setInput('');
    setIsStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    onMessagesChange([...updated, assistantMsg]);

    try {
      await streamChat({
        messages: updated,
        agent,
        context,
        onDelta: (delta) => {
          assistantMsg.content += delta;
          onMessagesChange([...updated, { ...assistantMsg }]);
        },
        onDone: () => {
          setIsStreaming(false);
          if (assistantMsg.content.includes('READY_TO_ADVANCE')) {
            onReadyToAdvance?.();
          }
        },
      });
    } catch (err) {
      setIsStreaming(false);
      assistantMsg.content = `Error: ${err instanceof Error ? err.message : 'Failed to connect'}`;
      onMessagesChange([...updated, { ...assistantMsg }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border/40 bg-card/50 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
          {agentInfo?.icon || '🤖'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{agentInfo?.name || agent}</p>
          <p className="text-[9px] text-muted-foreground truncate">{agentInfo?.role}</p>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1 text-primary flex-shrink-0">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[9px] font-medium">Thinking</span>
          </div>
        )}
      </div>

      {/* Messages - scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">{agentInfo?.icon || '🤖'}</div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Chat with {agentInfo?.name || 'Agent'}
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              {agentInfo?.description || 'Describe your idea to get started'}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div
              className={`
                max-w-[88%] rounded-lg px-3 py-2 text-xs leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-foreground border border-border/20'
                }
              `}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content.replace('READY_TO_ADVANCE', '')}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-border/40 flex-shrink-0">
        <div className="flex gap-1.5">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Phase complete' : `Message ${agentInfo?.name || 'agent'}...`}
            disabled={isStreaming || disabled}
            className="resize-none min-h-[36px] max-h-[100px] text-xs bg-secondary/40 border-border/30"
            rows={1}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming || disabled}
            className="h-9 w-9 flex-shrink-0"
          >
            {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
