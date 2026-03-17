import { SQUAD_AGENTS } from '@/lib/squadAgents';
import { Users } from 'lucide-react';

interface SquadPipelineFlowProps {
  currentStep: number;
  activeAgent?: string;
  onAgentClick?: (agentId: string) => void;
  completedAgents: Set<string>;
  generatingAgent?: string;
}

const SquadPipelineFlow = ({ currentStep, activeAgent, onAgentClick, completedAgents, generatingAgent }: SquadPipelineFlowProps) => {
  return (
    <div className="w-full py-2">
      {/* Progress bar */}
      <div className="relative h-1 rounded-full bg-border mb-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
          style={{ width: `${(currentStep / (SQUAD_AGENTS.length - 1)) * 100}%` }}
        />
      </div>

      {/* Agent track */}
      <div className="flex items-start gap-1">
        {SQUAD_AGENTS.map((agent, i) => {
          const isActive = activeAgent === agent.id;
          const isComplete = completedAgents.has(agent.id);
          const isGenerating = generatingAgent === agent.id;
          const isPast = i < currentStep;
          const isFuture = i > currentStep && !isComplete;

          return (
            <div key={agent.id} className="flex-1 min-w-0">
              <button
                onClick={() => onAgentClick?.(agent.id)}
                className={`
                  w-full group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg
                  text-[10px] font-medium transition-all duration-200 border
                  ${isActive
                    ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]'
                    : isComplete || isPast
                      ? 'bg-primary/5 border-primary/20 text-primary/70'
                      : isFuture
                        ? 'bg-card/30 border-border/20 text-muted-foreground/40'
                        : 'bg-card/50 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }
                `}
              >
                <span className="text-xs leading-none">{agent.icon}</span>
                <span className="hidden xl:inline truncate">{agent.name}</span>
                <span className="xl:hidden text-[9px] font-bold">A{i + 1}</span>

                {isGenerating && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                {isActive && !isGenerating && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                {agent.hitl && (
                  <Users className="w-2.5 h-2.5 ml-auto text-warning flex-shrink-0" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SquadPipelineFlow;
