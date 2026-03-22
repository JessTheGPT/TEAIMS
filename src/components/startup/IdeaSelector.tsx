import { useState } from 'react';
import { Plus, ChevronDown, Sparkles, Clock, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface StartupIdea {
  id: string;
  title: string;
  description: string | null;
  status: string;
  current_phase: string;
  created_at: string;
}

interface IdeaSelectorProps {
  ideas: StartupIdea[];
  activeIdea: StartupIdea | null;
  onSelect: (idea: StartupIdea) => void;
  onNew: () => void;
  onRename?: (ideaId: string, newTitle: string) => void;
}

const phaseLabels: Record<string, string> = {
  intake: 'Intake',
  strategy: 'Strategy',
  execution: 'Execution',
  synthesis: 'Synthesis',
  launch: 'Launch Ready',
  squad: 'Elite Squad',
};

const IdeaSelector = ({ ideas, activeIdea, onSelect, onNew, onRename }: IdeaSelectorProps) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = () => {
    if (!activeIdea) return;
    setEditTitle(activeIdea.title);
    setEditing(true);
  };

  const saveEdit = () => {
    if (activeIdea && editTitle.trim() && onRename) {
      onRename(activeIdea.id, editTitle.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
            className="h-7 text-xs w-40"
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEdit}>
            <Check className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 gap-1.5 text-xs px-2 max-w-[200px]">
                <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate">
                  {activeIdea?.title || 'Select idea'}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {ideas.map(idea => (
                <DropdownMenuItem
                  key={idea.id}
                  onClick={() => onSelect(idea)}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{idea.title}</p>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2 h-2" />
                      {phaseLabels[idea.current_phase] || idea.current_phase}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
              {ideas.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={onNew} className="text-primary">
                <Plus className="w-3 h-3 mr-1.5" />
                New Idea
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {activeIdea && onRename && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEditing}>
              <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
            </Button>
          )}
        </>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew} title="New Idea">
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default IdeaSelector;
