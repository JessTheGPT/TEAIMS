import { useState } from 'react';
import { Edit3, Save, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { STARTUP_AGENTS } from '@/lib/startupAgents';
import { IdeaDocument } from './DocumentPanel';

interface DocumentViewerProps {
  document: IdeaDocument;
  onUpdate?: (docId: string, content: string) => void;
}

const DocumentViewer = ({ document, onUpdate }: DocumentViewerProps) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(document.content);
  const agent = STARTUP_AGENTS.find(a => a.id === document.agent);

  const save = () => {
    onUpdate?.(document.id, editContent);
    setEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/30">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{agent?.icon || '📄'}</span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{document.title}</h3>
            <p className="text-[10px] text-muted-foreground">{agent?.name} · {document.phase}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs gap-1">
                <X className="w-3 h-3" /> Cancel
              </Button>
              <Button size="sm" onClick={save} className="h-7 text-xs gap-1">
                <Save className="w-3 h-3" /> Save
              </Button>
            </>
          ) : (
            (document.status === 'complete' || document.status === 'reviewed') && (
              <Button size="sm" variant="ghost" onClick={() => { setEditContent(document.content); setEditing(true); }} className="h-7 text-xs gap-1">
                <Edit3 className="w-3 h-3" /> Edit
              </Button>
            )
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {editing ? (
          <Textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="min-h-full bg-secondary/20 font-mono text-sm border-border/30 resize-none"
          />
        ) : (
          <div className="prose prose-invert prose-xs max-w-none text-foreground/85 text-[13px] leading-relaxed whitespace-pre-wrap">
            {document.content || (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Document is being generated...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
