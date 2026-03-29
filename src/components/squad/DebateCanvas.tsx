import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Shield, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Play, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SQUAD_AGENTS, getSquadAgentById } from '@/lib/squadAgents';
import { DEBATE_PAIRS, AGENT_STANCES, type DebatePair } from '@/lib/debateConfig';
import { streamChat } from '@/lib/streamChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export interface DebateMessage {
  id: string;
  agent: string;
  content: string;
  round: number;
  stance: string;
  redLineTriggered: boolean;
  timestamp: number;
}

interface DebateCanvasProps {
  ideaId: string;
  userId: string;
  completedAgents: Set<string>;
  documents: { agent: string; title: string; content: string }[];
  onDebateComplete?: (debateId: string) => void;
}

const DebateCanvas = ({ ideaId, userId, completedAgents, documents, onDebateComplete }: DebateCanvasProps) => {
  const [activeDebate, setActiveDebate] = useState<DebatePair | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>({} as any);
  const [allMessages, setAllMessages] = useState<Record<string, DebateMessage[]>>({});
  const [generating, setGenerating] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [expandedDebate, setExpandedDebate] = useState<string | null>(null);
  const [completedDebates, setCompletedDebates] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDebateMessages(); }, [ideaId]);

  const loadDebateMessages = async () => {
    const { data } = await supabase
      .from('debate_messages')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at');
    
    if (data) {
      const grouped: Record<string, DebateMessage[]> = {};
      const completed = new Set<string>();
      data.forEach((m: any) => {
        if (!grouped[m.debate_id]) grouped[m.debate_id] = [];
        grouped[m.debate_id].push({
          id: m.id, agent: m.agent, content: m.content, round: m.round,
          stance: m.stance || 'assert', redLineTriggered: m.red_line_triggered || false,
          timestamp: new Date(m.created_at).getTime(),
        });
      });
      Object.keys(grouped).forEach(debateId => {
        const debate = DEBATE_PAIRS.find(d => d.id === debateId);
        if (debate && grouped[debateId].length >= debate.agents.length * 2) completed.add(debateId);
      });
      setAllMessages(grouped);
      setCompletedDebates(completed);
    }
  };

  const availableDebates = DEBATE_PAIRS.filter(d => {
    const afterIdx = SQUAD_AGENTS.findIndex(a => a.id === d.afterAgent);
    return completedAgents.has(d.afterAgent) || afterIdx < [...completedAgents].reduce((max, id) => {
      const idx = SQUAD_AGENTS.findIndex(a => a.id === id);
      return Math.max(max, idx);
    }, -1);
  });

  const runDebate = async (debate: DebatePair) => {
    setActiveDebate(debate);
    setExpandedDebate(debate.id);
    setGenerating(true);
    setCurrentRound(1);

    const debateMessages: DebateMessage[] = allMessages[debate.id] || [];
    const contextDocs = documents.filter(d => completedAgents.has(d.agent));
    const context = contextDocs.map(d => `## ${d.title}\n\n${d.content}`).join('\n\n---\n\n');

    try {
      const totalExchanges = debate.isOpenForum 
        ? debate.agents.length * 2
        : debate.rounds * debate.agents.length;

      for (let i = 0; i < totalExchanges; i++) {
        const agentIdx = i % debate.agents.length;
        const agentId = debate.agents[agentIdx];
        const round = Math.floor(i / debate.agents.length) + 1;
        const agent = getSquadAgentById(agentId);
        const stance = AGENT_STANCES[agentId];
        if (!agent || !stance) continue;

        setCurrentRound(round);

        const prevMessages = debateMessages.map(m => {
          const a = getSquadAgentById(m.agent);
          return `**${a?.name || m.agent}** (Round ${m.round}, ${m.stance}): ${m.content}`;
        }).join('\n\n');

        const redLinesList = stance.redLines.map(r => `- 🔴 ${r.rule}: ${r.description}`).join('\n');
        const flexList = stance.flexAreas.map(f => `- 🟢 ${f.area}: ${f.description}`).join('\n');

        const debateSystemPrompt = debate.isOpenForum
          ? `You are ${agent.name} (${agent.role}) in a FINAL ALIGNMENT FORUM.\n\nYour RED LINES:\n${redLinesList}\n\nYour FLEXIBLE AREAS:\n${flexList}\n\nRULES:\n1. State your position clearly and concisely\n2. Flag ANY red line violations\n3. Acknowledge compromise areas\n4. Signal ALIGNMENT_REACHED if majority aligns and no red lines crossed\n5. State RED_LINE_VIOLATED if one is crossed\n6. IMPORTANT: Keep responses to 3-5 sentences MAX. Be direct and conversational, not academic.\n\nTopic: ${debate.topic}\n${prevMessages ? `\nPrevious:\n${prevMessages}` : ''}`
          : `You are ${agent.name} (${agent.role}) in a structured debate on: "${debate.topic}"\n\nYour RED LINES:\n${redLinesList}\n\nYour FLEXIBLE AREAS:\n${flexList}\n\nRULES:\n1. Round ${round} of ${debate.rounds}\n2. ${i === 0 ? 'Open with your position' : 'Respond to previous arguments'}\n3. Say RED_LINE_VIOLATED if a red line is crossed\n4. Propose specific compromises where possible\n5. Stay in character\n6. IMPORTANT: Keep to 3-5 sentences MAX. Be conversational and direct, not long-winded.\n7. Final round: state ALIGN, CONCEDE, or BLOCK in one word then explain briefly.\n\nTopic: ${debate.topic}\nTrigger: ${debate.trigger}\n${prevMessages ? `\nPrevious:\n${prevMessages}` : ''}`;

        let content = '';
        const msgId = crypto.randomUUID();

        await streamChat({
          messages: [{ role: 'user', content: `Engage in this debate as ${agent.name}. Round ${round}.` }],
          agent: agentId,
          context: `${debateSystemPrompt}\n\n---\nProject Context:\n${context}`,
          onDelta: (delta) => {
            content += delta;
            const msg: DebateMessage = {
              id: msgId, agent: agentId, content, round,
              stance: content.includes('RED_LINE_VIOLATED') ? 'red_line' : content.includes('ALIGNMENT_REACHED') ? 'align' : i === 0 ? 'assert' : 'challenge',
              redLineTriggered: content.includes('RED_LINE_VIOLATED'), timestamp: Date.now(),
            };
            setAllMessages(prev => ({ ...prev, [debate.id]: [...debateMessages, msg] }));
          },
          onDone: async () => {
            const finalMsg: DebateMessage = {
              id: msgId, agent: agentId, content, round,
              stance: content.includes('RED_LINE_VIOLATED') ? 'red_line' : content.includes('ALIGNMENT_REACHED') ? 'align' : i === 0 ? 'assert' : 'challenge',
              redLineTriggered: content.includes('RED_LINE_VIOLATED'), timestamp: Date.now(),
            };
            debateMessages.push(finalMsg);
            await supabase.from('debate_messages').insert({
              idea_id: ideaId, debate_id: debate.id, agent: agentId, content, round,
              stance: finalMsg.stance, red_line_triggered: finalMsg.redLineTriggered, user_id: userId,
            });
          },
        });
      }

      setCompletedDebates(prev => new Set([...prev, debate.id]));
      onDebateComplete?.(debate.id);
      toast.success(`${debate.topic} debate complete`);
    } catch (err) {
      toast.error('Debate interrupted');
    } finally {
      setGenerating(false);
      setActiveDebate(null);
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'red_line': return 'border-destructive bg-destructive/8';
      case 'align': return 'border-green-500/40 bg-green-500/8';
      case 'challenge': return 'border-warning/40 bg-warning/8';
      default: return 'border-primary/30 bg-primary/8';
    }
  };

  const getStanceIcon = (stance: string) => {
    switch (stance) {
      case 'red_line': return <AlertTriangle className="w-2.5 h-2.5 text-destructive" />;
      case 'align': return <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />;
      case 'challenge': return <MessageSquare className="w-2.5 h-2.5 text-warning" />;
      default: return <MessageSquare className="w-2.5 h-2.5 text-primary" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-border/40 bg-card/30">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Agent Debates</h3>
          <Badge variant="outline" className="text-[9px] h-4">
            {completedDebates.size}/{DEBATE_PAIRS.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {DEBATE_PAIRS.map((debate, idx) => {
            const isAvailable = availableDebates.includes(debate);
            const isComplete = completedDebates.has(debate.id);
            const isActive = activeDebate?.id === debate.id;
            const isExpanded = expandedDebate === debate.id;
            const msgs = allMessages[debate.id] || [];
            const hasRedLine = msgs.some(m => m.redLineTriggered);

            return (
              <motion.div
                key={debate.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`rounded-lg border transition-all duration-200 ${
                  isActive ? 'border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.08)]' :
                  isComplete ? (hasRedLine ? 'border-destructive/30' : 'border-green-500/30') :
                  isAvailable ? 'border-border/40 hover:border-primary/30' :
                  'border-border/20 opacity-40'
                }`}
              >
                <button
                  onClick={() => setExpandedDebate(isExpanded ? null : debate.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
                  disabled={!isAvailable && !isComplete}
                >
                  <div className="flex -space-x-1">
                    {debate.agents.slice(0, 3).map(agentId => {
                      const agent = getSquadAgentById(agentId);
                      return (
                        <div key={agentId} className="w-5 h-5 rounded-full bg-card border border-border/60 flex items-center justify-center text-[9px]" title={agent?.name}>
                          {agent?.icon}
                        </div>
                      );
                    })}
                    {debate.agents.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-card border border-border/60 flex items-center justify-center text-[8px] text-muted-foreground font-medium">
                        +{debate.agents.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium text-foreground truncate">{debate.topic}</span>
                      {isComplete && !hasRedLine && <CheckCircle2 className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />}
                      {hasRedLine && <AlertTriangle className="w-2.5 h-2.5 text-destructive flex-shrink-0" />}
                      {debate.isOpenForum && <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5">Forum</Badge>}
                    </div>
                    <p className="text-[9px] text-muted-foreground truncate">{debate.trigger}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {/* Red lines */}
                        <div className="flex flex-wrap gap-1">
                          {debate.agents.map(agentId => {
                            const stance = AGENT_STANCES[agentId];
                            const agent = getSquadAgentById(agentId);
                            if (!stance || !agent) return null;
                            return (
                              <Badge key={agentId} variant="outline" className="text-[7px] gap-0.5 h-4">
                                <Shield className="w-2 h-2" />
                                {agent.icon} {stance.redLines.length}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Messages as chat bubbles */}
                        {msgs.length > 0 && (
                          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" ref={scrollRef}>
                            {msgs.map((msg, i) => {
                              const agent = getSquadAgentById(msg.agent);
                              const isEven = i % 2 === 0;
                              return (
                                <motion.div
                                  key={msg.id + '-' + i}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.02 }}
                                  className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 border ${getStanceColor(msg.stance)} ${
                                    isEven ? 'rounded-tl-sm' : 'rounded-tr-sm'
                                  }`}>
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-[10px]">{agent?.icon}</span>
                                      <span className="text-[9px] font-semibold text-foreground">{agent?.name}</span>
                                      <span className="text-[8px] text-muted-foreground">R{msg.round}</span>
                                      {getStanceIcon(msg.stance)}
                                      {msg.redLineTriggered && (
                                        <Badge variant="destructive" className="text-[7px] px-1 py-0 h-3">RED LINE</Badge>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-foreground/80 prose prose-xs max-w-none leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0">
                                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {isAvailable && !isComplete && !isActive && (
                          <Button onClick={() => runDebate(debate)} disabled={generating} size="sm" className="w-full gap-1.5 text-[10px] h-7">
                            <Play className="w-2.5 h-2.5" />
                            Start {debate.isOpenForum ? 'Forum' : 'Debate'} ({debate.rounds} rounds)
                          </Button>
                        )}
                        {isActive && (
                          <div className="flex items-center gap-2 justify-center py-1.5 text-[10px] text-muted-foreground">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                            Round {currentRound} of {debate.rounds}...
                          </div>
                        )}
                        {isComplete && (
                          <div className={`flex items-center gap-1.5 justify-center py-1 text-[9px] rounded-md ${
                            hasRedLine ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {hasRedLine ? (
                              <><AlertTriangle className="w-2.5 h-2.5" /> Red lines triggered</>
                            ) : (
                              <><CheckCircle2 className="w-2.5 h-2.5" /> Aligned</>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DebateCanvas;
