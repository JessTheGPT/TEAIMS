import { useState, useEffect, useCallback } from 'react';
import { Zap, ArrowRight, Loader2, ChevronDown, ChevronUp, Plus, Sparkles, MessageSquare, FileText, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import SquadPipelineFlow from '@/components/squad/SquadPipelineFlow';
import DebateCanvas from '@/components/squad/DebateCanvas';
import DebateFlowVisualization from '@/components/squad/DebateFlowVisualization';
import AgentChat from '@/components/startup/AgentChat';
import DocumentPanel, { IdeaDocument } from '@/components/startup/DocumentPanel';
import DocumentViewer from '@/components/startup/DocumentViewer';
import AgentActivityFeed from '@/components/startup/AgentActivityFeed';
import IdeaSelector, { StartupIdea } from '@/components/startup/IdeaSelector';
import { SQUAD_AGENTS } from '@/lib/squadAgents';
import { DEBATE_PAIRS } from '@/lib/debateConfig';
import { streamChat } from '@/lib/streamChat';
import type { ActivityEvent } from '@/pages/Startup';

type Message = { role: 'user' | 'assistant'; content: string };
type CenterTab = 'activity' | 'docs' | 'debates';

const Squad = () => {
  const { user, signOut } = useAuth();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [activeIdea, setActiveIdea] = useState<StartupIdea | null>(null);
  const [agentMessages, setAgentMessages] = useState<Record<string, Message[]>>({});
  const [documents, setDocuments] = useState<IdeaDocument[]>([]);
  const [activeAgent, setActiveAgent] = useState(SQUAD_AGENTS[0].id);
  const [currentStep, setCurrentStep] = useState(0);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingAgent, setGeneratingAgent] = useState<string | undefined>();
  const [flowExpanded, setFlowExpanded] = useState(true);
  const [centerTab, setCenterTab] = useState<CenterTab>('activity');
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [completedDebates, setCompletedDebates] = useState<Set<string>>(new Set());
  const [debateRedLines, setDebateRedLines] = useState<Record<string, boolean>>({});

  useEffect(() => { loadIdeas(); }, []);

  const loadIdeas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('current_phase', 'squad')
      .order('created_at', { ascending: false });
    const { data: data2 } = await supabase
      .from('startup_ideas')
      .select('*')
      .like('current_phase', 'A%')
      .order('created_at', { ascending: false });
    setIdeas([...((data as StartupIdea[]) || []), ...((data2 as StartupIdea[]) || [])]);
    setLoading(false);
  };

  useEffect(() => {
    if (!activeIdea) return;
    loadIdeaData(activeIdea.id);
  }, [activeIdea?.id]);

  const loadIdeaData = async (ideaId: string) => {
    const [msgResult, docResult] = await Promise.all([
      supabase.from('idea_messages').select('*').eq('idea_id', ideaId).order('created_at'),
      supabase.from('idea_documents').select('*').eq('idea_id', ideaId).order('created_at'),
    ]);

    const grouped: Record<string, Message[]> = {};
    (msgResult.data || []).forEach((m: any) => {
      if (!grouped[m.agent]) grouped[m.agent] = [];
      grouped[m.agent].push({ role: m.role, content: m.content });
    });
    setAgentMessages(grouped);

    const docs = (docResult.data as IdeaDocument[]) || [];
    setDocuments(docs);

    const completed = new Set<string>();
    docs.forEach(d => {
      if (d.status === 'complete' || d.status === 'reviewed') completed.add(d.agent);
    });
    setCompletedAgents(completed);

    const lastCompletedIdx = SQUAD_AGENTS.reduce((max, agent, idx) => {
      return completed.has(agent.id) ? Math.max(max, idx) : max;
    }, -1);
    setCurrentStep(Math.max(0, lastCompletedIdx + 1));
  };

  const createIdea = async () => {
    if (!newTitle.trim() || !user) return;
    const { data, error } = await supabase
      .from('startup_ideas')
      .insert({ title: newTitle.trim(), status: 'active', current_phase: 'squad', user_id: user.id })
      .select()
      .single();

    if (error) { toast.error('Failed to create idea'); return; }
    const idea = data as StartupIdea;
    setIdeas(prev => [idea, ...prev]);
    setActiveIdea(idea);
    setAgentMessages({});
    setDocuments([]);
    setActiveAgent(SQUAD_AGENTS[0].id);
    setCurrentStep(0);
    setCompletedAgents(new Set());
    setCompletedDebates(new Set());
    setDebateRedLines({});
    setActivityFeed([]);
    setCenterTab('activity');
    setViewingDocId(null);
    setShowNewDialog(false);
    setNewTitle('');
    toast.success('Idea created — chat with the Market Strategist to validate your idea');
  };

  const handleMessagesChange = useCallback((agent: string, newMessages: Message[]) => {
    setAgentMessages(prev => ({ ...prev, [agent]: newMessages }));
  }, []);

  const addActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    setActivityFeed(prev => [...prev, { ...event, id: crypto.randomUUID(), timestamp: Date.now() }]);
  }, []);

  const advanceToNextAgent = async () => {
    if (!activeIdea || !user || generating) return;
    const currentAgentIdx = SQUAD_AGENTS.findIndex(a => a.id === activeAgent);
    if (currentAgentIdx < 0) return;

    const msgs = agentMessages[activeAgent] || [];
    if (msgs.length > 0) {
      await supabase.from('idea_messages').delete()
        .eq('idea_id', activeIdea.id)
        .eq('agent', activeAgent);
      const msgInserts = msgs.map(m => ({
        idea_id: activeIdea.id,
        agent: activeAgent,
        role: m.role,
        content: m.content,
        phase: activeAgent,
        user_id: user.id,
      }));
      await supabase.from('idea_messages').insert(msgInserts);
    }

    const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
    const currentAgentDef = SQUAD_AGENTS[currentAgentIdx];
    if (lastAssistant) {
      const docTitle = currentAgentDef.documents[0] || `${currentAgentDef.name} Output`;
      const existing = documents.find(d => d.agent === activeAgent);
      if (!existing) {
        const newDoc = {
          id: crypto.randomUUID(),
          agent: activeAgent,
          phase: activeAgent,
          title: docTitle,
          content: lastAssistant.content.replace('READY_TO_ADVANCE', '').trim(),
          status: 'complete' as const,
        };
        setDocuments(prev => [...prev, newDoc]);
        await supabase.from('idea_documents').insert({
          idea_id: activeIdea.id,
          agent: activeAgent,
          phase: activeAgent,
          title: docTitle,
          content: newDoc.content,
          status: 'complete',
          user_id: user.id,
        });
      }
    }

    setCompletedAgents(prev => new Set([...prev, activeAgent]));

    const debatesAfterAgent = DEBATE_PAIRS.filter(d => d.afterAgent === activeAgent && !completedDebates.has(d.id));
    if (debatesAfterAgent.length > 0) {
      addActivity({
        type: 'phase_advance',
        fromAgent: activeAgent,
        content: `💬 Debate available: ${debatesAfterAgent.map(d => d.topic).join(', ')}`,
      });
      setCenterTab('debates');
      toast.info(`Debate unlocked: ${debatesAfterAgent[0].topic}`, {
        description: 'Switch to the Debates tab to watch agents challenge each other.',
      });
    }

    if (currentAgentIdx < SQUAD_AGENTS.length - 1) {
      const nextAgent = SQUAD_AGENTS[currentAgentIdx + 1];
      setActiveAgent(nextAgent.id);
      setCurrentStep(currentAgentIdx + 1);

      addActivity({
        type: 'phase_advance',
        fromAgent: activeAgent,
        toAgent: nextAgent.id,
        content: `Advancing from ${currentAgentDef.name} → ${nextAgent.name}`,
      });

      if (currentAgentIdx >= 0) {
        autoGenerateDocument(activeIdea, nextAgent.id, currentAgentIdx + 1);
      }

      toast.success(`Advanced to ${nextAgent.name}`);
    } else {
      toast.success('🎉 All 9 agents complete! Your startup package is ready.');
    }
  };

  const autoGenerateDocument = async (idea: StartupIdea, agentId: string, stepIdx: number) => {
    if (!user) return;
    const agent = SQUAD_AGENTS.find(a => a.id === agentId);
    if (!agent) return;

    setGenerating(true);
    setGeneratingAgent(agentId);

    const contextDocs = documents.filter(d => d.status === 'complete' || d.status === 'reviewed');
    const context = contextDocs.map(d => `## ${d.title}\n\n${d.content}`).join('\n\n---\n\n');
    const chatMsgs = agentMessages[SQUAD_AGENTS[0].id] || [];
    const chatContext = chatMsgs.map(m => `${m.role === 'user' ? 'Founder' : 'Market Strategist'}: ${m.content}`).join('\n\n');
    const fullContext = chatContext + (context ? '\n\n---\n\n' + context : '');

    const docTitle = agent.documents[0] || `${agent.name} Document`;
    const newDoc: IdeaDocument = {
      id: crypto.randomUUID(),
      agent: agentId,
      phase: agentId,
      title: docTitle,
      content: '',
      status: 'generating',
    };
    setDocuments(prev => [...prev, newDoc]);

    addActivity({
      type: 'doc_start',
      fromAgent: agentId,
      content: `${agent.name} started working on ${docTitle}`,
    });

    try {
      let content = '';
      await streamChat({
        messages: [{ role: 'user', content: `Create the ${docTitle} based on the following startup context.` }],
        agent: agentId,
        context: fullContext,
        onDelta: (delta) => {
          content += delta;
          setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content, status: 'generating' } : d));
        },
        onDone: async () => {
          setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content, status: 'complete' } : d));
          setCompletedAgents(prev => new Set([...prev, agentId]));
          await supabase.from('idea_documents').insert({
            idea_id: idea.id,
            agent: agentId,
            phase: agentId,
            title: docTitle,
            content,
            status: 'complete',
            user_id: user.id,
          });
          addActivity({
            type: 'doc_complete',
            fromAgent: agentId,
            content: `${agent.name} completed ${docTitle}`,
          });
          setGenerating(false);
          setGeneratingAgent(undefined);

          setAgentMessages(prev => ({
            ...prev,
            [agentId]: [
              { role: 'user', content: `Create the ${docTitle} based on the startup context.` },
              { role: 'assistant', content },
            ],
          }));
        },
      });
    } catch (err) {
      setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content: 'Failed to generate', status: 'complete' } : d));
      toast.error(`${agent.name} failed to generate document`);
      setGenerating(false);
      setGeneratingAgent(undefined);
    }
  };

  const handleDocumentUpdate = async (docId: string, content: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, content, status: 'reviewed' as const } : d));
    await supabase.from('idea_documents').update({ content, status: 'reviewed' }).eq('id', docId);
    toast.success('Document updated');
  };

  const handleDebateComplete = (debateId: string) => {
    setCompletedDebates(prev => new Set([...prev, debateId]));
    addActivity({
      type: 'doc_complete',
      fromAgent: 'debate',
      content: `Debate "${DEBATE_PAIRS.find(d => d.id === debateId)?.topic}" concluded`,
    });
  };

  const canAdvance = activeIdea && !generating && (agentMessages[activeAgent]?.length ?? 0) > 0;

  const handleRenameIdea = async (ideaId: string, newTitle: string) => {
    await supabase.from('startup_ideas').update({ title: newTitle }).eq('id', ideaId);
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, title: newTitle } : i));
    if (activeIdea?.id === ideaId) setActiveIdea(prev => prev ? { ...prev, title: newTitle } : prev);
    toast.success('Idea renamed');
  };

  // Viewing a specific document
  const viewingDoc = viewingDocId ? documents.find(d => d.id === viewingDocId) : null;

  return (
    <div className="h-screen flex flex-col bg-background pt-12 overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm px-4 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <h1 className="text-xs font-semibold text-foreground tracking-tight">Elite 9</h1>
            <span className="text-[9px] text-muted-foreground">{activeIdea ? `${currentStep + 1}/9` : ''}</span>
            <IdeaSelector
              ideas={ideas}
              activeIdea={activeIdea}
              onSelect={(idea) => { setActiveIdea(idea); setActiveAgent(SQUAD_AGENTS[0].id); setCenterTab('activity'); setViewingDocId(null); }}
              onNew={() => setShowNewDialog(true)}
              onRename={handleRenameIdea}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {canAdvance && (
              <Button onClick={advanceToNextAgent} disabled={generating} size="sm" className="gap-1 text-[10px] h-7">
                {generating ? (
                  <><Loader2 className="w-2.5 h-2.5 animate-spin" />Working...</>
                ) : (
                  <>Next Agent <ArrowRight className="w-2.5 h-2.5" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {!activeIdea ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Elite 9-Agent Launch Squad</h2>
            <p className="text-sm text-muted-foreground mb-6">
              9 specialized agents + adversarial debates. Each agent has red lines they won't cross.
            </p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Idea
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Collapsible pipeline */}
          <div className="flex-shrink-0 border-b border-border/40">
            <button
              onClick={() => setFlowExpanded(!flowExpanded)}
              className="w-full flex items-center justify-between px-5 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors bg-card/30"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Pipeline
                {completedDebates.size > 0 && (
                  <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {completedDebates.size} debates
                  </span>
                )}
              </div>
              {flowExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {flowExpanded && (
              <div className="px-5 pb-2 bg-card/20 space-y-1.5">
                <SquadPipelineFlow
                  currentStep={currentStep}
                  activeAgent={activeAgent}
                  onAgentClick={(agentId) => { setActiveAgent(agentId); }}
                  completedAgents={completedAgents}
                  generatingAgent={generatingAgent}
                />
                <DebateFlowVisualization
                  completedAgents={completedAgents}
                  completedDebates={completedDebates}
                  debateRedLines={debateRedLines}
                  onDebateClick={() => setCenterTab('debates')}
                />
              </div>
            )}
          </div>

          {/* Main content: chat sidebar + center */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat sidebar — agent list + active chat */}
            <div className="w-80 flex-shrink-0 border-r border-border/40 flex flex-col bg-card/20">
              {/* Agent list */}
              <div className="flex-shrink-0 border-b border-border/40 overflow-x-auto">
                <div className="flex p-1.5 gap-1">
                  {SQUAD_AGENTS.map((agent) => {
                    const isActive = activeAgent === agent.id;
                    const isCompleted = completedAgents.has(agent.id);
                    const msgCount = (agentMessages[agent.id] || []).length;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => setActiveAgent(agent.id)}
                        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : isCompleted
                            ? 'bg-muted/50 text-foreground border border-transparent hover:border-border/40'
                            : 'text-muted-foreground border border-transparent hover:bg-muted/30'
                        }`}
                        title={agent.name}
                      >
                        <span className="text-xs">{agent.icon}</span>
                        {msgCount > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Active chat */}
              <div className="flex-1 overflow-hidden">
                <AgentChat
                  ideaId={activeIdea.id}
                  agent={activeAgent}
                  context={documents.filter(d => d.status === 'complete').map(d => `## ${d.title}\n\n${d.content}`).join('\n\n')}
                  messages={agentMessages[activeAgent] || []}
                  onMessagesChange={(msgs) => handleMessagesChange(activeAgent, msgs)}
                  onReadyToAdvance={() => toast.info('Agent is ready to advance. Click "Next Agent" to proceed.')}
                />
              </div>
            </div>

            {/* Center: tabs for Activity / Docs / Debates */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Center tabs */}
              <div className="flex-shrink-0 flex border-b border-border/40 bg-card/30">
                {([
                  { id: 'activity' as CenterTab, label: 'Activity', icon: Sparkles },
                  { id: 'docs' as CenterTab, label: 'Documents', icon: FileText, count: documents.filter(d => d.status === 'complete' || d.status === 'reviewed').length },
                  { id: 'debates' as CenterTab, label: 'Debates', icon: Users, count: completedDebates.size },
                ]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setCenterTab(tab.id); setViewingDocId(null); }}
                    className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors ${
                      centerTab === tab.id
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Center content */}
              <div className="flex-1 overflow-hidden">
                {centerTab === 'activity' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                      <AgentActivityFeed events={activityFeed} />
                    </div>
                    {generating && (
                      <div className="flex-shrink-0 px-4 py-2 border-t border-border/40 bg-card/30 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-primary font-medium">Agents working...</span>
                      </div>
                    )}
                  </div>
                )}

                {centerTab === 'docs' && !viewingDoc && (
                  <div className="h-full overflow-y-auto">
                    <DocumentPanel
                      documents={documents}
                      activePhase={activeAgent}
                      onDocumentUpdate={handleDocumentUpdate}
                      onDocumentClick={(docId) => setViewingDocId(docId)}
                    />
                  </div>
                )}

                {centerTab === 'docs' && viewingDoc && (
                  <div className="h-full flex flex-col">
                    <div className="flex-shrink-0 px-4 py-2 border-b border-border/40 bg-card/30">
                      <button
                        onClick={() => setViewingDocId(null)}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Documents
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <DocumentViewer document={viewingDoc} onUpdate={handleDocumentUpdate} />
                    </div>
                  </div>
                )}

                {centerTab === 'debates' && (
                  <div className="h-full overflow-hidden">
                    <DebateCanvas
                      ideaId={activeIdea.id}
                      userId={user!.id}
                      completedAgents={completedAgents}
                      documents={documents.filter(d => d.status === 'complete' || d.status === 'reviewed').map(d => ({
                        agent: d.agent,
                        title: d.title,
                        content: d.content,
                      }))}
                      onDebateComplete={handleDebateComplete}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">New Idea — Elite 9 Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. AI meeting notetaker that auto-sends follow-ups"
              onKeyDown={e => e.key === 'Enter' && createIdea()}
              className="text-sm"
            />
            <Button onClick={createIdea} disabled={!newTitle.trim()} className="w-full gap-2">
              <Zap className="w-4 h-4" /> Launch Squad
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Squad;
