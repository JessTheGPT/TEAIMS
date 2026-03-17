import { FileText, Loader2, CheckCircle, Clock } from 'lucide-react';
import { STARTUP_AGENTS } from '@/lib/startupAgents';
import { SQUAD_AGENTS } from '@/lib/squadAgents';

export interface IdeaDocument {
  id: string;
  agent: string;
  phase: string;
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'complete' | 'reviewed';
}

interface DocumentPanelProps {
  documents: IdeaDocument[];
  activePhase: string;
  onDocumentUpdate?: (docId: string, content: string) => void;
  onDocumentClick?: (docId: string) => void;
}

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string; animate?: boolean }> = {
  pending: { icon: Clock, label: 'Queued', color: 'text-muted-foreground' },
  generating: { icon: Loader2, label: 'Writing...', color: 'text-primary', animate: true },
  complete: { icon: CheckCircle, label: 'Done', color: 'text-success' },
  reviewed: { icon: CheckCircle, label: 'Reviewed', color: 'text-primary' },
};

const DocumentPanel = ({ documents, activePhase, onDocumentClick }: DocumentPanelProps) => {
  // Show all documents — no phase filtering needed for squad mode
  const visibleDocs = documents;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 bg-card/50 flex-shrink-0">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Documents</h3>
        <span className="ml-auto text-[9px] text-muted-foreground tabular-nums">
          {visibleDocs.filter(d => d.status === 'complete' || d.status === 'reviewed').length}/{documents.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {visibleDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-6 h-6 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-[10px] text-muted-foreground/60">Documents appear as agents work</p>
          </div>
        ) : (
          visibleDocs.map((doc) => {
            const agent = STARTUP_AGENTS.find(a => a.id === doc.agent);
            const status = statusConfig[doc.status];
            const StatusIcon = status.icon;

            return (
              <button
                key={doc.id}
                onClick={() => onDocumentClick?.(doc.id)}
                className={`
                  w-full flex items-center gap-2 p-2.5 rounded-lg text-left
                  transition-all duration-200 border group
                  ${doc.status === 'generating'
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-transparent hover:border-border/40 hover:bg-secondary/30'
                  }
                `}
              >
                <span className="text-sm flex-shrink-0">{agent?.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{agent?.name}</p>
                </div>
                <div className={`flex items-center gap-0.5 ${status.color} flex-shrink-0`}>
                  <StatusIcon className={`w-3 h-3 ${status.animate ? 'animate-spin' : ''}`} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DocumentPanel;
