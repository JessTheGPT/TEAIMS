import { useState, useEffect, useCallback } from 'react';
import { Rocket, ArrowRight, Loader2, ChevronDown, ChevronUp, Plus, Sparkles, MessageSquare, FileText, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { validateOutput } from '@/lib/validateOutput';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PipelineFlow from '@/components/startup/PipelineFlow';
import AgentChat from '@/components/startup/AgentChat';
import DocumentPanel, { IdeaDocument } from '@/components/startup/DocumentPanel';
import CenterCanvas from '@/components/startup/CenterCanvas';
import IdeaSelector, { StartupIdea } from '@/components/startup/IdeaSelector';
import NewIdeaModal from '@/components/startup/NewIdeaModal';
import IdeaHeader from '@/components/startup/IdeaHeader';
import SourcePanel from '@/components/startup/SourcePanel';
import ChiefOfStaffPanel from '@/components/startup/ChiefOfStaffPanel';
import DelegationView from '@/components/startup/DelegationView';
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

type CenterView =
  | { type: 'activity' }
  | { type: 'document'; id: string }
  | { type: 'source' }
  | { type: 'delegation'; agentCode: string };

const Startup = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [activeIdea, setActiveIdea] = useState<StartupIdea | null>(null);
  const [agentMessages, setAgentMessages] = useState<Record<string, Message[]>>({});
  const [documents, setDocuments] = useState<IdeaDocument[]>([]);
  const [activeAgent, setActiveAgent] = useState('chief_of_staff');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flowExpanded, setFlowExpanded] = useState(true);
  const [centerView, setCenterView] = useState<CenterView>({ type: 'activity' });
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'docs' | 'source'>('chat');
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [directChatAgent, setDirectChatAgent] = useState('chief_of_staff');

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

  const handleIdeaCreated = async (ideaId: string) => {
    const { data } = await supabase.from('startup_ideas').select('*').eq('id', ideaId).single();
    if (data) {
      const idea = data as StartupIdea;
      setIdeas(prev => [idea, ...prev.filter(i => i.id !== idea.id)]);
      setActiveIdea(idea);
      setAgentMessages({});
      setDocuments([]);
      setActiveAgent('chief_of_staff');
      setDirectChatAgent('chief_of_staff');
      setActivityFeed([]);
      setCenterView({ type: 'activity' });
      setSidebarTab('chat');
    }
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

    // Pull source-file extracted text into agent context too
    const { data: sourceFiles } = await supabase
      .from('idea_source_files')
      .select('file_name, extracted_text')
      .eq('idea_id', idea.id);
    const sourceContext = (sourceFiles || [])
      .filter(f => f.extracted_text)
      .map(f => `## Source: ${f.file_name}\n\n${f.extracted_text}`)
      .join('\n\n---\n\n');

    const contextDocs = documents.filter(d => d.status === 'complete' || d.status === 'reviewed');
    const context = contextDocs.map(d => `## ${d.title}\n\n${d.content}`).join('\n\n---\n\n');
    const chatMsgs = agentMessages['chief_of_staff'] || [];
    const chatContext = chatMsgs.map(m => `${m.role === 'user' ? 'Founder' : 'Chief of Staff'}: ${m.content}`).join('\n\n');
    const descContext = idea.description ? `## Founder's Brief\n\n${idea.description}` : '';
    const fullContext = [descContext, sourceContext, chatContext, context].filter(Boolean).join('\n\n---\n\n');

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
          mode: 'document',
          context: fullContext,
          onDelta: (delta) => {
            content += delta;
            setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content, status: 'generating' } : d));
          },
          onDone: async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            const validation = await validateOutput({
              agentCode: agent.id,
              content,
              ideaId: idea.id,
              token,
            });

            if (validation.status === 'fail') {
              const violationMsgs = validation.violations
                .filter(v => v.severity === 'block')
                .map(v => `🔴 ${v.description}: ${v.message}`)
                .join('\n');

              addActivity({
                type: 'doc_complete',
                fromAgent: agent.id,
                content: `⛔ ${agent.name} output blocked by ${validation.violations.length} constraint(s)`,
              });

              const retryContent = `Your previous output was blocked by the following constraints:\n\n${violationMsgs}\n\nPlease revise your ${docTitle} to satisfy ALL constraints. Here is your previous output for reference:\n\n${content.slice(0, 2000)}`;

              let revisedContent = '';
              try {
                await streamChat({
                  messages: [
                    { role: 'user', content: `Create the ${docTitle} based on the following startup context.` },
                    { role: 'assistant', content: content.slice(0, 3000) },
                    { role: 'user', content: retryContent },
                  ],
                  agent: agent.id,
                  mode: 'document',
                  context: fullContext,
                  onDelta: (delta) => {
                    revisedContent += delta;
                    setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content: revisedContent, status: 'generating' } : d));
                  },
                  onDone: async () => {
                    setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content: revisedContent, status: 'complete' } : d));
                    await supabase.from('idea_documents').insert({
                      idea_id: idea.id,
                      agent: agent.id,
                      phase,
                      title: docTitle,
                      content: revisedContent,
                      status: 'complete',
                      user_id: user.id,
                    });
                    addActivity({
                      type: 'doc_complete',
                      fromAgent: agent.id,
                      content: `✅ ${agent.name} revised and completed ${docTitle} (passed constraints)`,
                    });
                  },
                });
              } catch {
                setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content: revisedContent || content, status: 'complete' } : d));
              }
              return;
            }

            if (validation.violations.length > 0) {
              addActivity({
                type: 'doc_complete',
                fromAgent: agent.id,
                content: `⚠️ ${validation.violations.length} warning(s) on ${docTitle} — saved with flags`,
              });
            }

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
              content: `Completed ${docTitle}${validation.constraints_checked > 0 ? ` (${validation.constraints_checked} constraints checked ✓)` : ''}`,
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

  const handleRenameIdea = async (ideaId: string, newTitle: string) => {
    await supabase.from('startup_ideas').update({ title: newTitle }).eq('id', ideaId);
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, title: newTitle } : i));
    if (activeIdea?.id === ideaId) setActiveIdea(prev => prev ? { ...prev, title: newTitle } : prev);
    toast.success('Idea renamed');
  };

  const handlePipelineAgentClick = (agentId: string) => {
    setActiveAgent(agentId);
    setDirectChatAgent(agentId);
    setCenterView({ type: 'delegation', agentCode: agentId });
  };

  return (
    <div className="h-screen flex flex-col bg-background pt-12 overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm px-4 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Rocket className="w-3 h-3 text-primary" />
            </div>
            <h1 className="text-xs font-semibold text-foreground tracking-tight">Startup Crew</h1>
            <IdeaSelector
              ideas={ideas}
              activeIdea={activeIdea}
              onSelect={(idea) => { setActiveIdea(idea); setActiveAgent('chief_of_staff'); setDirectChatAgent('chief_of_staff'); setCenterView({ type: 'activity' }); setSidebarTab('chat'); }}
              onNew={() => setShowNewDialog(true)}
              onRename={handleRenameIdea}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {canAdvance && (
              <Button onClick={advancePhase} disabled={generating} size="sm" className="gap-1 text-[10px] h-7">
                {generating ? (
                  <><Loader2 className="w-2.5 h-2.5 animate-spin" />Working...</>
                ) : (
                  <>Advance <ArrowRight className="w-2.5 h-2.5" /></>
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
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Launch Your Startup</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Describe your idea, upload source material, and watch a full team of expert agents
              create technical specs, business plans, and competitive analysis.
            </p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Idea
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Idea header — bigger name + collapsible brief */}
          <IdeaHeader idea={activeIdea} />

          {/* Pipeline Flow — collapsible */}
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
                  onAgentClick={handlePipelineAgentClick}
                  documents={documents}
                  generating={generating}
                />
              </div>
            )}
          </div>

          {/* Main content: sidebar + center canvas + right direct-chat panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDEBAR: Chat + Docs + Source tabs */}
            <div className="w-96 flex-shrink-0 border-r border-border/40 flex flex-col bg-card/20">
              <div className="flex border-b border-border/40 flex-shrink-0">
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors ${
                    sidebarTab === 'chat' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
                <button
                  onClick={() => setSidebarTab('docs')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors ${
                    sidebarTab === 'docs' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3 h-3" /> Docs
                  {documents.length > 0 && (
                    <span className="ml-0.5 text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded-full">
                      {documents.filter(d => d.status === 'complete' || d.status === 'reviewed').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setSidebarTab('source'); setCenterView({ type: 'source' }); }}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors ${
                    sidebarTab === 'source' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> Source
                </button>
              </div>

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
                ) : sidebarTab === 'docs' ? (
                  <DocumentPanel
                    documents={documents}
                    activePhase={activeIdea.current_phase}
                    onDocumentUpdate={handleDocumentUpdate}
                    onDocumentClick={(docId) => {
                      setCenterView({ type: 'document', id: docId });
                    }}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-3">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Original description and uploaded source files. Click any item to view full content in the canvas.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-xs"
                      onClick={() => setCenterView({ type: 'source' })}
                    >
                      <BookOpen className="w-3 h-3 mr-1.5" /> Open source viewer
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER: Dynamic Canvas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {(centerView.type === 'document' || centerView.type === 'source') && (
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
                {centerView.type === 'delegation' ? (
                  <DelegationView
                    agentCode={centerView.agentCode}
                    documents={documents}
                    activityFeed={activityFeed}
                    onBack={() => setCenterView({ type: 'activity' })}
                    onOpenDoc={(docId) => setCenterView({ type: 'document', id: docId })}
                  />
                ) : centerView.type === 'source' ? (
                  <SourcePanel ideaId={activeIdea.id} description={activeIdea.description} />
                ) : (
                  <CenterCanvas
                    view={centerView}
                    documents={documents}
                    activityFeed={activityFeed}
                    onDocumentUpdate={handleDocumentUpdate}
                    generating={generating}
                  />
                )}
              </div>
            </div>

            {/* RIGHT: Persistent direct chat panel (Chief of Staff or selected agent) */}
            <ChiefOfStaffPanel
              ideaId={activeIdea.id}
              agentCode={directChatAgent}
              context={activeIdea.description || undefined}
              collapsed={rightPanelCollapsed}
              onToggle={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            />
          </div>
        </div>
      )}

      <NewIdeaModal
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={handleIdeaCreated}
      />
    </div>
  );
};

export default Startup;
