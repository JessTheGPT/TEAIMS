import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { STARTUP_AGENTS } from '@/lib/startupAgents';
import { SQUAD_AGENTS } from '@/lib/squadAgents';
import type { IdeaDocument } from './DocumentPanel';
import type { ActivityEvent } from '@/pages/Startup';

interface DelegationViewProps {
  agentCode: string;
  documents: IdeaDocument[];
  activityFeed: ActivityEvent[];
  onBack: () => void;
  onOpenDoc: (docId: string) => void;
}

/**
 * Shows a single agent's delegation brief: what was assigned to them by Chief of
 * Staff, their related activity, and links to the documents they own.
 */
const DelegationView = ({ agentCode, documents, activityFeed, onBack, onOpenDoc }: DelegationViewProps) => {
  const info = STARTUP_AGENTS.find(a => a.id === agentCode) || SQUAD_AGENTS.find(a => a.id === agentCode);
  const agentDocs = documents.filter(d => d.agent === agentCode);
  const events = activityFeed.filter(e => e.fromAgent === agentCode || e.toAgent === agentCode);
  const delegationsTo = activityFeed.filter(e => e.type === 'delegation' && e.toAgent === agentCode);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-border/40 bg-card/30 flex items-center gap-2">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="text-base">{info?.icon || '🤖'}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{info?.name || agentCode}</p>
          <p className="text-[10px] text-muted-foreground truncate">{info?.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-3xl mx-auto w-full">
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-1.5">Mandate</h3>
          <p className="text-xs text-foreground/80 leading-relaxed bg-card/40 border border-border/40 rounded-lg p-3">
            {info?.description || 'No description available.'}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground mb-1.5">Delegated From Chief of Staff</h3>
          {delegationsTo.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No delegation yet — phase has not advanced to this agent.</p>
          ) : (
            <div className="space-y-1.5">
              {delegationsTo.map(e => (
                <div key={e.id} className="text-[11px] bg-card/30 border border-border/30 rounded p-2 text-foreground/85">
                  → {e.content}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground mb-1.5">Documents Owned</h3>
          {agentDocs.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No documents produced yet.</p>
          ) : (
            <div className="space-y-1.5">
              {agentDocs.map(d => (
                <button
                  key={d.id}
                  onClick={() => onOpenDoc(d.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded border border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card/60 text-left transition-colors"
                >
                  {d.status === 'generating' ? (
                    <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
                  ) : (
                    <FileText className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                  <span className="text-[11px] font-medium text-foreground truncate flex-1">{d.title}</span>
                  <span className="text-[9px] text-muted-foreground">{d.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground mb-1.5">Activity Log</h3>
          {events.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No activity yet.</p>
          ) : (
            <div className="space-y-1">
              {events.map(e => (
                <div key={e.id} className="text-[10px] text-muted-foreground border-l-2 border-border/40 pl-2 py-0.5">
                  {e.content}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DelegationView;
