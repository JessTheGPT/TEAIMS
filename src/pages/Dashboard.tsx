import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowRight,
  Boxes,
  Wrench,
  Terminal,
  Hammer,
  Link2,
  Zap,
  Layers,
  Shield,
  Bot,
  FileText,
  MessageSquare,
  Scale
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ crews: 0, tools: 0, prompts: 0, docs: 0, ideas: 0, documents: 0, contextFiles: 0, rules: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [teams, tools, prompts, docs] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('tools').select('id', { count: 'exact', head: true }),
        supabase.from('prompt_templates').select('id', { count: 'exact', head: true }),
        supabase.from('context_docs').select('id', { count: 'exact', head: true }),
      ]);

      let ideas = 0, documents = 0, contextFiles = 0, rules = 0;
      if (user) {
        const [ideasR, docsR, ctxR, rulesR] = await Promise.all([
          supabase.from('startup_ideas').select('id', { count: 'exact', head: true }),
          supabase.from('idea_documents').select('id', { count: 'exact', head: true }),
          supabase.from('context_files').select('id', { count: 'exact', head: true }).neq('category', 'api_keys'),
          supabase.from('judgement_rules').select('id', { count: 'exact', head: true }),
        ]);
        ideas = ideasR.count || 0;
        documents = docsR.count || 0;
        contextFiles = ctxR.count || 0;
        rules = rulesR.count || 0;
      }

      setStats({
        crews: (teams.count || 0) + 2, // Include built-in Startup + Squad crews
        tools: tools.count || 0,
        prompts: prompts.count || 0,
        docs: docs.count || 0,
        ideas,
        documents,
        contextFiles,
        rules,
      });
    };
    fetchStats();
  }, [user]);

  const sections = [
    {
      title: 'Crews',
      description: 'Multi-agent team configurations. Browse swarm setups, fork and customize.',
      icon: Boxes,
      href: '/crews',
      stat: stats.crews,
      statLabel: 'crews',
    },
    {
      title: 'Toolbox',
      description: 'Skills, tools, MCP servers, APIs. Everything your agents need to execute.',
      icon: Wrench,
      href: '/toolbox',
      stat: stats.tools,
      statLabel: 'tools',
    },
    {
      title: 'Prompts',
      description: 'System prompts, soul.md, skills.md templates. Copy-paste ready.',
      icon: Terminal,
      href: '/prompts',
      stat: stats.prompts,
      statLabel: 'templates',
    },
    {
      title: 'Builder',
      description: 'Visual agent builder. Export as CrewAI YAML, LangGraph Python, or OpenAI JSON.',
      icon: Hammer,
      href: '/builder',
      stat: null,
      statLabel: '',
    },
  ];

  const quickActions = [
    { label: 'Build Crew', href: '/builder', icon: Hammer },
    { label: 'Add Tool', href: '/toolbox?action=add', icon: Wrench },
    { label: 'New Prompt', href: '/prompts?action=add', icon: Terminal },
    { label: 'Share Links', href: '/share', icon: Link2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-hero)' }} />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ 
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/8 border border-primary/15 text-primary text-xs font-medium tracking-wider uppercase mb-6">
              <Shield className="w-3 h-3" />
              Agent Armory
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-5 tracking-tight leading-[1.1]">
              Equip your agents.{' '}
              <span className="text-gradient">Deploy with precision.</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
              Build multi-agent crews, curate tools and skills, craft system prompts — 
              export production-ready configs for any framework.
            </p>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-secondary/80 border border-border/60 text-foreground text-sm font-medium hover:bg-secondary hover:border-primary/25 transition-all duration-150 active:scale-[0.98]"
                >
                  <action.icon className="w-3.5 h-3.5 text-primary" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20 -mt-4">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-px bg-border/40 rounded overflow-hidden mb-8">
          {[
            { label: 'Crews', value: stats.crews, icon: Boxes },
            { label: 'Tools', value: stats.tools, icon: Wrench },
            { label: 'Prompts', value: stats.prompts, icon: Terminal },
            { label: 'Docs', value: stats.docs, icon: Layers },
          ].map((s) => (
            <div key={s.label} className="bg-card/80 px-4 py-3 flex items-center gap-3">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {sections.map((section) => (
            <Link key={section.title} to={section.href}>
              <Card variant="premium" className="p-6 h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded bg-primary/8 text-primary">
                    <section.icon className="w-5 h-5" />
                  </div>
                  {section.stat !== null && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {section.stat} {section.statLabel}
                    </span>
                  )}
                </div>
                
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {section.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {section.description}
                </p>
                
                <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {/* Featured: Launch Squad */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Featured Spec</h2>
          </div>
          
          <Link to="/spec">
            <Card variant="trace" className="p-8 group">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center">
                    <Bot className="w-7 h-7 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors duration-150">
                    Elite 9-Agent Launch Squad
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Production-ready multi-agent pipeline with shared state, HITL checkpoints, 
                    error handling loops, and LangGraph integration.
                  </p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-150" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
