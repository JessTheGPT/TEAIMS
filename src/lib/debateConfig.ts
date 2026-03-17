import { SQUAD_AGENTS } from './squadAgents';

export interface RedLine {
  rule: string;
  description: string;
}

export interface FlexArea {
  area: string;
  description: string;
}

export interface AgentStance {
  agentId: string;
  redLines: RedLine[];
  flexAreas: FlexArea[];
}

export interface DebatePair {
  id: string;
  topic: string;
  trigger: string;
  afterAgent: string; // debate triggers after this agent completes
  agents: string[]; // participating agent IDs
  rounds: number;
  isOpenForum?: boolean;
}

export const AGENT_STANCES: Record<string, AgentStance> = {
  A1_market: {
    agentId: 'A1_market',
    redLines: [
      { rule: 'TAM must exceed $1B', description: 'Will not proceed if total addressable market is under $1 billion.' },
      { rule: 'Evidence-backed claims only', description: 'Every market claim must have at least 2 sources.' },
      { rule: 'Founder-market fit required', description: 'Founder must have credible connection to the problem space.' },
    ],
    flexAreas: [
      { area: 'Timeline estimates', description: 'Willing to adjust market entry timeline based on tech constraints.' },
      { area: 'Geographic focus', description: 'Can narrow or expand geographic scope.' },
    ],
  },
  A2_vision: {
    agentId: 'A2_vision',
    redLines: [
      { rule: 'Max 6 MVP features', description: 'Will never approve more than 6 features for MVP.' },
      { rule: '2-week sprint achievable', description: 'MVP must be buildable in a 2-week sprint.' },
      { rule: 'Binary acceptance criteria', description: 'Every feature must have Given/When/Then acceptance criteria.' },
    ],
    flexAreas: [
      { area: 'Feature prioritization', description: 'Willing to swap features based on technical or market feedback.' },
      { area: 'UX complexity', description: 'Can simplify flows if tech constraints require it.' },
    ],
  },
  A3_architect: {
    agentId: 'A3_architect',
    redLines: [
      { rule: 'Must support 10x scale', description: 'Architecture must handle 10x initial load estimate.' },
      { rule: 'All APIs documented', description: 'Every endpoint must have OpenAPI-style documentation.' },
      { rule: 'No vendor lock-in without escape hatch', description: 'Must have migration path from any vendor.' },
    ],
    flexAreas: [
      { area: 'Tech stack choices', description: 'Flexible on specific technologies if constraints are met.' },
      { area: 'Infrastructure provider', description: 'Can adapt hosting based on requirements.' },
    ],
  },
  A4_ui: {
    agentId: 'A4_ui',
    redLines: [
      { rule: 'WCAG 2.1 AA compliance', description: 'Will not ship anything below AA accessibility standards.' },
      { rule: 'Mobile-first responsive', description: 'Every view must work on mobile first.' },
      { rule: 'No placeholder content', description: 'Production-ready, no TODOs, no lorem ipsum.' },
    ],
    flexAreas: [
      { area: 'Visual style', description: 'Flexible on color schemes and branding direction.' },
      { area: 'Animation complexity', description: 'Can reduce animations for performance.' },
    ],
  },
  A5_frontend: {
    agentId: 'A5_frontend',
    redLines: [
      { rule: 'Lighthouse ≥ 98 mobile', description: 'Performance score must be 98+ on mobile.' },
      { rule: 'Bundle < 180kb gzipped', description: 'Total bundle must stay under 180kb gzipped.' },
      { rule: 'TypeScript strict mode', description: 'No any types, no ts-ignore without justification.' },
    ],
    flexAreas: [
      { area: 'Component library', description: 'Flexible on UI component choices.' },
      { area: 'State management', description: 'Can adapt state patterns to requirements.' },
    ],
  },
  A6_backend: {
    agentId: 'A6_backend',
    redLines: [
      { rule: 'Zero N+1 queries', description: 'Will block any code with N+1 query patterns.' },
      { rule: 'Zero raw SQL', description: 'All queries must go through ORM/query builder.' },
      { rule: 'Zero unhandled errors', description: 'Every error path must be explicitly handled.' },
    ],
    flexAreas: [
      { area: 'ORM choice', description: 'Flexible on Prisma vs Drizzle vs other ORMs.' },
      { area: 'Background job framework', description: 'Can adapt job processing approach.' },
    ],
  },
  A7_security: {
    agentId: 'A7_security',
    redLines: [
      { rule: 'No CRITICAL/HIGH vulnerabilities', description: 'Will BLOCK deployment if any critical or high severity vulnerability exists.' },
      { rule: 'OWASP Top 10 compliant', description: 'Must pass all OWASP Top 10 checks.' },
      { rule: 'Secrets never in code', description: 'Zero secrets, keys, or tokens in source code.' },
    ],
    flexAreas: [
      { area: 'Auth provider', description: 'Flexible on authentication provider choice.' },
      { area: 'Monitoring granularity', description: 'Can adjust security monitoring depth.' },
    ],
  },
  A8_growth: {
    agentId: 'A8_growth',
    redLines: [
      { rule: 'Measurable metrics required', description: 'Every growth initiative must have trackable KPIs.' },
      { rule: 'No dark patterns', description: 'Will not implement deceptive UX for growth.' },
      { rule: 'GDPR-compliant data collection', description: 'All data collection must be consent-based.' },
    ],
    flexAreas: [
      { area: 'Channel prioritization', description: 'Flexible on which channels to prioritize first.' },
      { area: 'Pricing model', description: 'Can adapt pricing strategy based on market feedback.' },
    ],
  },
  A9_ops: {
    agentId: 'A9_ops',
    redLines: [
      { rule: 'Zero-downtime deployment', description: 'Must have rollback capability and zero-downtime deploys.' },
      { rule: 'Legal compliance', description: 'TOS and Privacy Policy must exist before launch.' },
      { rule: 'GDPR compliance', description: 'Must have consent flows, data deletion, and DPA.' },
    ],
    flexAreas: [
      { area: 'CI/CD platform', description: 'Flexible on GitHub Actions vs other CI/CD.' },
      { area: 'Monitoring tools', description: 'Can adapt monitoring stack.' },
    ],
  },
};

export const DEBATE_PAIRS: DebatePair[] = [
  {
    id: 'market_scope',
    topic: 'Market–Scope Alignment',
    trigger: 'Is the scope aligned with the validated market opportunity?',
    afterAgent: 'A2_vision',
    agents: ['A1_market', 'A2_vision'],
    rounds: 3,
  },
  {
    id: 'scope_feasibility',
    topic: 'Scope vs Technical Feasibility',
    trigger: 'Can the scoped features be built within the proposed architecture?',
    afterAgent: 'A3_architect',
    agents: ['A2_vision', 'A3_architect'],
    rounds: 3,
  },
  {
    id: 'design_tech',
    topic: 'Design vs Technical Constraints',
    trigger: 'Do the design requirements conflict with frontend performance budgets?',
    afterAgent: 'A5_frontend',
    agents: ['A4_ui', 'A5_frontend'],
    rounds: 3,
  },
  {
    id: 'frontend_backend',
    topic: 'Frontend–Backend Contract',
    trigger: 'Are the API contracts and data flow aligned between frontend and backend?',
    afterAgent: 'A6_backend',
    agents: ['A5_frontend', 'A6_backend'],
    rounds: 3,
  },
  {
    id: 'security_implementation',
    topic: 'Security vs Implementation Speed',
    trigger: 'Do the security requirements conflict with the implementation plan?',
    afterAgent: 'A7_security',
    agents: ['A7_security', 'A5_frontend', 'A6_backend'],
    rounds: 4,
  },
  {
    id: 'growth_compliance',
    topic: 'Growth vs Compliance',
    trigger: 'Do the growth tactics respect security and legal constraints?',
    afterAgent: 'A8_growth',
    agents: ['A8_growth', 'A7_security', 'A9_ops'],
    rounds: 3,
  },
  {
    id: 'final_forum',
    topic: 'Final Alignment Forum',
    trigger: 'Final alignment check — all agents converge. Majority rules, no red lines crossed.',
    afterAgent: 'A9_ops',
    agents: SQUAD_AGENTS.map(a => a.id),
    rounds: 5,
    isOpenForum: true,
  },
];

export function getDebatesForAgent(agentId: string): DebatePair[] {
  return DEBATE_PAIRS.filter(d => d.afterAgent === agentId);
}

export function getAgentStance(agentId: string): AgentStance | undefined {
  return AGENT_STANCES[agentId];
}
