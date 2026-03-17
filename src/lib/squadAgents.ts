export interface SquadAgent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  description: string;
  documents: string[];
  hitl?: boolean;
  flag?: string;
}

export const SQUAD_AGENTS: SquadAgent[] = [
  {
    id: 'A1_market',
    name: 'Market Strategist',
    role: 'Market Research & Validation',
    icon: '🎯',
    color: 'hsl(0 72% 56%)',
    description: 'Validates or kills the idea before any code is written. TAM/SAM/SOM, competitor analysis, pricing benchmarks.',
    documents: ['Market Validation Report'],
    flag: 'market_validated',
  },
  {
    id: 'A2_vision',
    name: 'Visionary PM',
    role: 'Product Vision & Scope',
    icon: '🔭',
    color: 'hsl(280 72% 60%)',
    description: 'Locks scope to 6 features max. Vision doc, scope doc, acceptance criteria, and backlog.',
    documents: ['Product Vision & Scope'],
    hitl: true,
    flag: 'scope_locked',
  },
  {
    id: 'A3_architect',
    name: 'Systems Architect',
    role: 'Technical Architecture',
    icon: '🏗️',
    color: 'hsl(192 82% 52%)',
    description: 'Defines the entire tech stack. Architecture doc, ERD, API contracts.',
    documents: ['Technical Architecture'],
    flag: 'architecture_approved',
  },
  {
    id: 'A4_ui',
    name: 'UI Specialist',
    role: 'Interface Design',
    icon: '🎨',
    color: 'hsl(330 72% 56%)',
    description: 'Ships a high-fidelity page.tsx with waitlist. WCAG 2.1 AA, mobile-first, shadcn/ui.',
    documents: ['UI Design & Components'],
  },
  {
    id: 'A5_frontend',
    name: 'Frontend Engineer',
    role: 'Frontend Implementation',
    icon: '⚛️',
    color: 'hsl(210 82% 56%)',
    description: 'Implements every line of code in SCOPE.md with zero technical debt. Tests, performance, bundle analysis.',
    documents: ['Frontend Implementation Plan'],
  },
  {
    id: 'A6_backend',
    name: 'Backend Engineer',
    role: 'Backend & Infrastructure',
    icon: '🔧',
    color: 'hsl(142 72% 46%)',
    description: 'Zero N+1 queries, zero raw SQL, zero unhandled errors. API routes, jobs, data layer.',
    documents: ['Backend Implementation Plan'],
  },
  {
    id: 'A7_security',
    name: 'Security Auditor',
    role: 'Security Review',
    icon: '🛡️',
    color: 'hsl(38 92% 56%)',
    description: 'Blocks deployment if any vulnerability exists. OWASP Top 10, dependency audit, RLS policies.',
    documents: ['Security Audit Report'],
    flag: 'security_verified',
  },
  {
    id: 'A8_growth',
    name: 'Growth Lead',
    role: 'Growth & Monetization',
    icon: '📈',
    color: 'hsl(160 72% 46%)',
    description: '500+ waitlist emails before launch. Analytics, payment flow, email sequences.',
    documents: ['Growth & Monetization Strategy'],
  },
  {
    id: 'A9_ops',
    name: 'SRE/Ops/Legal',
    role: 'Deployment & Compliance',
    icon: '🚀',
    color: 'hsl(20 82% 56%)',
    description: 'Zero downtime, zero legal risk. CI/CD, monitoring, TOS, privacy policy, production URL.',
    documents: ['Deployment & Compliance Package'],
    hitl: true,
    flag: 'deployment_ready',
  },
];

export function getSquadAgentById(id: string): SquadAgent | undefined {
  return SQUAD_AGENTS.find(a => a.id === id);
}
