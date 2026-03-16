import { useState, useEffect, useCallback } from 'react';
import { Rocket, ArrowRight, Loader2, ChevronDown, ChevronUp, Plus, Sparkles, MessageSquare, FileText, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PipelineFlow from '@/components/startup/PipelineFlow';
import AgentChat from '@/components/startup/AgentChat';
import DocumentPanel, { IdeaDocument } from '@/components/startup/DocumentPanel';
import CenterCanvas from '@/components/startup/CenterCanvas';
import IdeaSelector, { StartupIdea } from '@/components/startup/IdeaSelector';
import { STARTUP_AGENTS, PHASES, getAgentsByPhase } from '@/lib/startupAgents';
import { streamChat } from '@/lib/streamChat';

type Message = { role: 'user' | 'assistant'; content: string };

export type ActivityEvent = {
  id: string;
  type: 'message' | 'doc_start' | 'doc_complete' | 'delegation' | 'phase_advance';
  fromAgent: string;
  toAgent?: string;
  content: string;
  timestamp: number;
};

const Startup = () => {
  const { user, signOut } = useAuth();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [activeIdea, setActiveIdea] = useState<StartupIdea | null>(null);
  const [agentMessages, setAgentMessages] = useState<Record<string, Message[]>>({});
  const [documents, setDocuments] = useState<IdeaDocument[]>([]);
  const [activeAgent, setActiveAgent] = useState('chief_of_staff');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flowExpanded, setFlowExpanded] = useState(true);
  const [centerView, setCenterView] = useState<{ type: 'activity' | 'document'; id?: string }>({ type: 'activity' });
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'docs'>('chat');

  useEffect(() => { loadIdeas(); }, []);

  const loadIdeas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('startup_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    setIdeas((data as StartupIdea[]) || []);
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
    setDocuments((docResult.data as IdeaDocument[]) || []);
  };

  const createIdea = async () => {
    if (!newTitle.trim() || !user) return;
    const { data, error } = await supabase
      .from('startup_ideas')
      .insert({ title: newTitle.trim(), status: 'active', current_phase: 'intake', user_id: user.id })
      .select()
      .single();

    if (error) { toast.error('Failed to create idea'); return; }
    const idea = data as StartupIdea;
    setIdeas(prev => [idea, ...prev]);
    setActiveIdea(idea);
    setAgentMessages({});
    setDocuments([]);
    setActiveAgent('chief_of_staff');
    setActivityFeed([]);
    setCenterView({ type: 'activity' });
    setSidebarTab('chat');
    setShowNewDialog(false);
    setNewTitle('');
    toast.success('Idea created — chat with Chief of Staff to get started');
  };

  const handleMessagesChange = useCallback((agent: string, newMessages: Message[]) => {
    setAgentMessages(prev => ({ ...prev, [agent]: newMessages }));
  }, []);

  const addActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setActivityFeed(prev => [...prev, newEvent]);
  }, []);

  const advancePhase = async () => {
    if (!activeIdea || !user) return;
    const currentIdx = PHASES.findIndex(p => p.id === activeIdea.current_phase);
    if (currentIdx >= PHASES.length - 1) return;

    const nextPhase = PHASES[currentIdx + 1].id;

    for (const [agentId, msgs] of Object.entries(agentMessages)) {
      if (msgs.length > 0) {
        await supabase.from('idea_messages').delete()
          .eq('idea_id', activeIdea.id)
          .eq('agent', agentId);
        const msgInserts = msgs.map(m => ({
          idea_id: activeIdea.id,
          agent: agentId,
          role: m.role,
          content: m.content,
          phase: activeIdea.current_phase,
          user_id: user.id,
        }));
        await supabase.from('idea_messages').insert(msgInserts);
      }
    }

    if (activeIdea.current_phase === 'intake' && (agentMessages['chief_of_staff']?.length ?? 0) > 0) {
      const msgs = agentMessages['chief_of_staff'] || [];
      const briefContent = msgs.map(m => `**${m.role === 'user' ? 'Founder' : 'Chief of Staff'}:** ${m.content}`).join('\n\n');
      await supabase.from('idea_documents').insert({
        idea_id: activeIdea.id,
        agent: 'chief_of_staff',
        phase: 'intake',
        title: 'Startup Brief',
        content: briefContent,
        status: 'complete',
        user_id: user.id,
      });
    }

    await supabase.from('startup_ideas').update({ current_phase: nextPhase }).eq('id', activeIdea.id);
    
    const updatedIdea = { ...activeIdea, current_phase: nextPhase };
    setActiveIdea(updatedIdea);
    setIdeas(prev => prev.map(i => i.id === activeIdea.id ? updatedIdea : i));

    addActivity({
      type: 'phase_advance',
      fromAgent: 'chief_of_staff',
      content: `Advanced to ${PHASES[currentIdx + 1].label}`,
    });

    if (nextPhase !== 'launch') {
      generatePhaseDocuments(updatedIdea, nextPhase);
    }

    toast.success(`Advanced to ${PHASES[currentIdx + 1].label}`);
  };

  const generatePhaseDocuments = async (idea: StartupIdea, phase: string) => {
    if (!user) return;
    const phaseAgents = getAgentsByPhase(phase);
    setGenerating(true);
    setCenterView({ type: 'activity' });

    const contextDocs = documents.filter(d => d.status === 'complete' || d.status === 'reviewed');
    const context = contextDocs.map(d => `## ${d.title}\n\n${d.content}`).join('\n\n---\n\n');
    const chatMsgs = agentMessages['chief_of_staff'] || [];
    const chatContext = chatMsgs.map(m => `${m.role === 'user' ? 'Founder' : 'Chief of Staff'}: ${m.content}`).join('\n\n');
    const fullContext = chatContext + (context ? '\n\n---\n\n' + context : '');

    for (const agent of phaseAgents) {
      addActivity({
        type: 'delegation',
        fromAgent: 'chief_of_staff',
        toAgent: agent.id,
        content: `Delegating ${agent.documents[0]} to ${agent.name}`,
      });

      await new Promise(r => setTimeout(r, 600));

      const docTitle = agent.documents[0] || `${agent.name} Document`;
      const newDoc: IdeaDocument = {
        id: crypto.randomUUID(),
        agent: agent.id,
        phase,
        title: docTitle,
        content: '',
        status: 'generating',
      };
      setDocuments(prev => [...prev, newDoc]);

      addActivity({
        type: 'doc_start',
        fromAgent: agent.id,
        content: `Started working on ${docTitle}`,
      });

      try {
        let content = '';
        await streamChat({
          messages: [{ role: 'user', content: `Create the ${docTitle} based on the following startup context.` }],
          agent: agent.id,
          context: fullContext,
          onDelta: (delta) => {
            content += delta;
            setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content, status: 'generating' } : d));
          },
          onDone: async () => {
            setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content, status: 'complete' } : d));
            await supabase.from('idea_documents').insert({
              idea_id: idea.id,
              agent: agent.id,
              phase,
              title: docTitle,
              content,
              status: 'complete',
              user_id: user.id,
            });
            addActivity({
              type: 'doc_complete',
              fromAgent: agent.id,
              content: `Completed ${docTitle}`,
            });
          },
        });
      } catch (err) {
        setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content: 'Failed to generate', status: 'complete' } : d));
        toast.error(`${agent.name} failed to generate document`);
      }
    }
    setGenerating(false);
  };

  const handleDocumentUpdate = async (docId: string, content: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, content, status: 'reviewed' as const } : d));
    await supabase.from('idea_documents').update({ content, status: 'reviewed' }).eq('id', docId);
    toast.success('Document updated');
  };

  const currentPhaseIndex = activeIdea ? PHASES.findIndex(p => p.id === activeIdea.current_phase) : 0;
  const canAdvance = activeIdea && currentPhaseIndex < PHASES.length - 1 && !generating;

  return (
    <div className="h-screen flex flex-col bg-background pt-16 overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">Startup Crew</h1>
              <p className="text-[10px] text-muted-foreground">
                {activeIdea ? activeIdea.title : 'Select or create an idea'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IdeaSelector
              ideas={ideas}
              activeIdea={activeIdea}
              onSelect={(idea) => { setActiveIdea(idea); setActiveAgent('chief_of_staff'); setCenterView({ type: 'activity' }); setSidebarTab('chat'); }}
              onNew={() => setShowNewDialog(true)}
            />
            {canAdvance && (
              <Button onClick={advancePhase} disabled={generating} size="sm" className="gap-1.5 text-xs h-8">
                {generating ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Working...</>
                ) : (
                  <>Advance <ArrowRight className="w-3 h-3" /></>
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {!activeIdea ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Launch Your Startup</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Chat with your AI Chief of Staff, then watch expert agents create technical specs, 
              business plans, and competitive analysis.
            </p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Idea
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Full-width Pipeline Flow — collapsible */}
          <div className="flex-shrink-0 border-b border-border/40">
            <button
              onClick={() => setFlowExpanded(!flowExpanded)}
              className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card/30"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                Pipeline Flow
              </div>
              {flowExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {flowExpanded && (
              <div className="px-5 pb-3 bg-card/20">
                <PipelineFlow
                  currentPhase={activeIdea.current_phase}
                  activeAgent={activeAgent}
                  onAgentClick={(agentId) => {
                    setActiveAgent(agentId);
                    setSidebarTab('chat');
                  }}
                  documents={documents}
                  generating={generating}
                />
              </div>
            )}
          </div>

          {/* Main content: sidebar + center canvas */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDEBAR: Chat + Docs tabs */}
            <div className="w-96 flex-shrink-0 border-r border-border/40 flex flex-col bg-card/20">
              {/* Tab switcher */}
              <div className="flex border-b border-border/40 flex-shrink-0">
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                    sidebarTab === 'chat'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat
                </button>
                <button
                  onClick={() => setSidebarTab('docs')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                    sidebarTab === 'docs'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Docs
                  {documents.length > 0 && (
                    <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      {documents.filter(d => d.status === 'complete' || d.status === 'reviewed').length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {sidebarTab === 'chat' ? (
                  <AgentChat
                    ideaId={activeIdea.id}
                    agent={activeAgent}
                    context={documents.filter(d => d.status === 'complete').map(d => `## ${d.title}\n\n${d.content}`).join('\n\n')}
                    messages={agentMessages[activeAgent] || []}
                    onMessagesChange={(msgs) => handleMessagesChange(activeAgent, msgs)}
                    onReadyToAdvance={() => toast.info('Chief of Staff is ready to advance. Click "Advance" when you\'re ready.')}
                    onDelegation={(fromAgent, toAgent, msg) => {
                      addActivity({ type: 'delegation', fromAgent, toAgent, content: msg });
                    }}
                  />
                ) : (
                  <DocumentPanel
                    documents={documents}
                    activePhase={activeIdea.current_phase}
                    onDocumentUpdate={handleDocumentUpdate}
                    onDocumentClick={(docId) => {
                      setCenterView({ type: 'document', id: docId });
                    }}
                  />
                )}
              </div>
            </div>

            {/* CENTER: Dynamic Canvas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Back button when viewing a document */}
              {centerView.type === 'document' && (
                <div className="flex-shrink-0 px-4 py-2 border-b border-border/40 bg-card/30">
                  <button
                    onClick={() => setCenterView({ type: 'activity' })}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Activity
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <CenterCanvas
                  view={centerView}
                  documents={documents}
                  activityFeed={activityFeed}
                  onDocumentUpdate={handleDocumentUpdate}
                  generating={generating}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Idea Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              New Startup Idea
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="What's your idea called?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createIdea()}
              autoFocus
            />
            <Button onClick={createIdea} disabled={!newTitle.trim()} className="w-full gap-2">
              <Rocket className="w-4 h-4" /> Start Building
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Startup;
