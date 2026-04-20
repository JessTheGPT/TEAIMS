import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { StartupIdea } from './IdeaSelector';

interface IdeaHeaderProps {
  idea: StartupIdea;
}

/**
 * Prominent idea name with collapsible details panel showing the original
 * description. Source files are reachable via the Source tab in the sidebar.
 */
const IdeaHeader = ({ idea }: IdeaHeaderProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = !!idea.description;

  return (
    <div className="flex-shrink-0 border-b border-border/40 bg-gradient-to-r from-card/40 via-card/20 to-transparent">
      <div className="px-5 py-3 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <h2 className="text-base font-semibold text-foreground tracking-tight truncate flex-1">
          {idea.title}
        </h2>
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-card/50"
          >
            {expanded ? 'Hide' : 'Show'} brief
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>
      {expanded && hasDetails && (
        <div className="px-5 pb-3 -mt-1">
          <div className="text-[11px] text-foreground/80 whitespace-pre-wrap leading-relaxed bg-background/40 border border-border/40 rounded-lg p-3 max-h-40 overflow-y-auto">
            {idea.description}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaHeader;
