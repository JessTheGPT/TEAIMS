# 🛡️ Agent Armory — Multi-Agent AI Operating System

> **Ship entire startups with orchestrated AI agent teams.**  
> From raw idea → market validation → architecture → design → implementation → security audit → growth strategy → compliance → launch.  
> With adversarial debates, red-line enforcement, human-in-the-loop judgement, and persistent decision intelligence.

---

## Table of Contents

- [Vision](#vision)
- [Architecture](#architecture)
- [Agent Teams](#agent-teams)
- [Adversarial Debate System](#adversarial-debate-system)
- [Judgement Framework](#judgement-framework)
- [Context File System](#context-file-system)
- [Technical Implementation](#technical-implementation)
- [Design Philosophy](#design-philosophy)
- [Decision Log](#decision-log)
- [Future State](#future-state)
- [Getting Started](#getting-started)

---

## Vision

Modern AI tools give you one agent with one context window. That's like running a company with one employee who's simultaneously the CEO, CTO, designer, lawyer, and accountant. It doesn't work.

**Agent Armory treats AI agents like a real organization:**

- Every agent has a **specialized role** with domain expertise
- Every agent has **red lines** — non-negotiable constraints they will not cross
- Every agent has **flexible areas** — where they'll compromise for the team
- Agents **debate each other** in structured rounds before decisions are finalized
- A **human-in-the-loop framework** captures uncertain decisions and codifies your judgement into reusable rules
- A **context file system** stores your operating identity — Soul.md, Skills.md, Judgements.md — shareable via secure tokenized URLs

The result: AI that operates like a high-functioning team, not a single overloaded assistant.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Agent Armory Frontend                           │
│  React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer     │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Startup  │ │  Elite 9 │ │ Context  │ │Judgement │ │  Resources   │ │
│  │  Crew    │ │  Squad   │ │  Files   │ │Framework │ │Toolbox/Prompts│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │             │            │             │              │         │
├───────┼─────────────┼────────────┼─────────────┼──────────────┼─────────┤
│       ▼             ▼            ▼             ▼              ▼         │
│                     Lovable Cloud (Supabase)                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Edge Functions (Streaming SSE)                                    │ │
│  │  ├── startup-chat    → Agent conversation + doc generation        │ │
│  │  ├── context         → Public context doc serving                 │ │
│  │  └── agent-context   → Tokenized agent config endpoint            │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  Postgres + RLS                                                    │ │
│  │  ├── startup_ideas    (user-scoped, phase-tracked)                │ │
│  │  ├── idea_messages    (per-agent conversation history)            │ │
│  │  ├── idea_documents   (generated deliverables)                    │ │
│  │  ├── debate_messages  (adversarial debate transcripts)            │ │
│  │  ├── context_files    (Soul.md, Skills.md, etc.)                  │ │
│  │  ├── judgement_entries (HITL decision log)                         │ │
│  │  ├── judgement_rules   (codified decision patterns)               │ │
│  │  ├── share_tokens     (secure URL sharing)                        │ │
│  │  ├── agents / teams   (agent configuration)                       │ │
│  │  ├── tools            (tool registry)                             │ │
│  │  ├── prompt_templates (reusable prompt library)                   │ │
│  │  └── context_docs     (public knowledge base)                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  AI Gateway: Lovable AI (Gemini 3 Flash Preview) — streaming SSE       │
│  Auth: Email/password with RLS on all user data                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input (idea description)
    │
    ▼
┌─ Chief of Staff / Market Strategist ──┐
│  Intake → validates → creates brief    │
│  Streams response via SSE              │
└──────────────┬─────────────────────────┘
               │
               ▼
     ┌─── Sequential Pipeline ───┐
     │  Agent N receives:         │
     │  • All prior documents     │
     │  • Original user context   │
     │  • Agent-specific prompt   │
     │                            │
     │  Produces:                 │
     │  • Structured document     │
     │  • Persisted to DB         │
     │  • Activity feed update    │
     └──────────┬─────────────────┘
                │
                ▼
     ┌─── Adversarial Debates ───┐
     │  Triggered after key      │
     │  agent completions        │
     │  Red line enforcement     │
     │  Majority alignment       │
     └──────────┬─────────────────┘
                │
                ▼
        Final Alignment Forum
        (All agents converge)
```

---

## Agent Teams

### 🏢 Startup Crew — 6 Agents, 4 Phases

A classic startup team covering core functions. Designed for speed — takes an idea from napkin to actionable plan in minutes.

| Agent | Role | Phase | Output |
|-------|------|-------|--------|
| Chief of Staff | Strategic intake & synthesis | Intake | Startup Brief |
| Tech Lead | System architecture & stack | Strategy | Technical Architecture |
| Business Exec | Market strategy & GTM | Strategy | Business & Growth Strategy |
| Designer | UX strategy & design system | Execution | Design System & UX Strategy |
| Developer | Implementation & sprints | Execution | Implementation Plan |
| Competitive Research | Market intelligence | Synthesis | Competitive Analysis |

**Pipeline:** Intake → Strategy → Execution → Synthesis → Launch Ready

The Chief of Staff acts as the orchestrator — the user chats directly with them, and they delegate to specialists. Each phase generates documents that become cumulative context for subsequent agents.

### ⚡ Elite 9 Squad — 9 Agents, Sequential + Adversarial

A high-fidelity, opinionated squad modeled after top-tier startup operators. Every agent has hard constraints (red lines) and areas of flexibility.

| Agent | Code | Role | Red Lines | Output |
|-------|------|------|-----------|--------|
| Market Strategist | A1 | Validation | TAM > $1B, evidence-backed, founder-market fit | Market Validation Report |
| Visionary PM | A2 | Scope | Max 6 MVP features, 2-week sprint, binary criteria | Product Vision & Scope |
| Systems Architect | A3 | Architecture | 10x scale, documented APIs, no vendor lock-in | Technical Architecture |
| UI Specialist | A4 | Design | WCAG 2.1 AA, mobile-first, no placeholders | UI Design & Components |
| Frontend Engineer | A5 | Frontend | Lighthouse ≥98, bundle <180kb, strict TS | Frontend Implementation |
| Backend Engineer | A6 | Backend | Zero N+1, zero raw SQL, zero unhandled errors | Backend Implementation |
| Security Auditor | A7 | Security | No CRITICAL/HIGH vulns, OWASP Top 10, no secrets in code | Security Audit Report |
| Growth Lead | A8 | Growth | Measurable KPIs, no dark patterns, GDPR-compliant | Growth Strategy |
| SRE/Ops/Legal | A9 | Compliance | Zero-downtime deploys, legal compliance, GDPR | Deployment & Compliance |

Each agent auto-generates their document by consuming all prior context. The pipeline is sequential — A1 validates before A2 scopes, A2 scopes before A3 architects. This mirrors how decisions flow in a real organization: you don't architect before you've validated the market.

---

## Adversarial Debate System

This is where Agent Armory fundamentally differs from typical AI pipelines. Instead of agents blindly building on each other's output, they **challenge each other**.

### Why Adversarial Debates?

In every real company, decisions emerge from tension:
- **Growth wants aggressive tactics** → Security wants OWASP compliance
- **Product wants 12 features** → Engineering wants 6 for quality
- **Design wants rich animations** → Frontend wants Lighthouse ≥98
- **Business wants fast launch** → Legal needs TOS and GDPR

These tensions are *features*, not bugs. They prevent blind spots. Agent Armory makes these tensions explicit and productive.

### How It Works

**6 Structured Debates** trigger automatically at key pipeline transitions:

| Debate | Agents | Trigger | Rounds |
|--------|--------|---------|--------|
| Market–Scope Alignment | A1 ↔ A2 | After scope is locked | 3 |
| Scope vs Feasibility | A2 ↔ A3 | After architecture | 3 |
| Design vs Performance | A4 ↔ A5 | After frontend | 3 |
| Frontend–Backend Contract | A5 ↔ A6 | After backend | 3 |
| Security vs Speed | A7 ↔ A5 ↔ A6 | After security audit | 4 |
| Growth vs Compliance | A8 ↔ A7 ↔ A9 | After growth plan | 3 |

**1 Open Forum** — all 9 agents converge for final alignment:
- Each agent states their position on the complete plan
- Red line violations are flagged explicitly
- Majority alignment required to proceed
- If an agent's red line is crossed, that section must be revised

### Red Line Enforcement

Every agent has **non-negotiable constraints** and **flexible areas**:

```
🔴 RED LINES (will block the project):
   Security: "No CRITICAL/HIGH vulnerabilities in production"
   PM: "Max 6 MVP features — will not approve more"
   Frontend: "Lighthouse ≥ 98 on mobile"

🟢 FLEXIBLE (willing to negotiate):
   Security: "Auth provider choice is flexible"
   PM: "Feature prioritization can shift based on tech feedback"
   Frontend: "Component library is flexible"
```

When an agent detects a red line violation during debate, they explicitly flag `RED_LINE_VIOLATED`. The debate transcript shows stance indicators:
- **Assert** — stating initial position
- **Challenge** — pushing back on another agent's claim
- **Red Line** — non-negotiable constraint triggered
- **Align** — consensus reached

### Design Decision: Chat Bubbles

Debates render as alternating **chat bubbles** with left/right alignment, making it feel like watching a real conversation between team members. Each bubble shows the agent icon, name, round number, and stance badge.

---

## Judgement Framework

The Human-In-The-Loop (HITL) Judgement Framework is the learning system that makes agents smarter over time.

### The Problem

AI agents make thousands of micro-decisions. Most are fine. Some are wrong. The problem is:
1. You can't review every decision
2. You can't pre-program every preference
3. Different contexts require different judgement

### The Solution

**Judgement Entries** — Agents surface uncertain decisions to the user:
```
Agent: Security Auditor
Question: "Should we require 2FA for admin accounts at MVP?"
Category: Security
Confidence: Low
Options: [Yes - Require 2FA, No - Email/password only for MVP]
Context: "Most competitor MVPs don't require 2FA, but our security audit flagged it."
```

**User Rules** — You make a decision, then codify the pattern:
```
Decision: "Yes — always require 2FA for admin"
Rule: "Any user with elevated permissions (admin, moderator) must have 2FA enabled"
Category: Security
Confidence: High
```

**Learning Loop:**
1. Agent encounters uncertainty → logs a Judgement Entry
2. You review → make a decision
3. You optionally codify into a Rule
4. Future agents check Rules before asking
5. Weekly QA: review agent decisions made autonomously
6. Refine or descope rules based on outcomes

This creates a **decision intelligence layer** that grows with every interaction. Over time, agents gain higher conviction and ask fewer questions, while maintaining alignment with your values and preferences.

### Categories

| Category | Examples |
|----------|----------|
| Architecture | Stack choices, scaling decisions, vendor selection |
| Security | Auth requirements, data handling, compliance |
| Design | Accessibility trade-offs, performance vs aesthetics |
| Business | Pricing models, market positioning, feature priority |
| Process | Sprint scope, review cadence, deployment strategy |

---

## Context File System

Your AI operating identity, stored as structured markdown files.

### Core Files

| File | Purpose |
|------|---------|
| **Soul.md** | Core identity, values, decision-making philosophy |
| **Skills.md** | Technical capabilities, domain expertise, tools mastery |
| **Human.md** | Communication style, preferences, working patterns |
| **Judgements.md** | Decision history, codified rules, review cadence |
| **Communications.md** | Style, cadence, channel routing (banter vs efficiency vs terse) |
| **Delegation.md** | When to orchestrate, cost-based model routing, task complexity mapping |
| **Thinking.md** | Lines of thinking, reasoning patterns, strengths/weaknesses analysis |

### Storage Architecture

Context files use a **dual storage model**:
- **Database** (`context_files` table) — versioned, searchable, taggable, RLS-protected
- **Exportable as .md** — for local use, git integration, cross-tool compatibility

### Secure Sharing

Context files can be shared externally via tokenized URLs:

```
https://your-domain.com/api/agent-context/{token}
```

The `agent-context` edge function returns a structured JSON payload:
```json
{
  "context": {
    "soul": "...",
    "skills": "...",
    "rules": [...],
    "metadata": { "files_count": 7, "rules_count": 12 }
  }
}
```

**Use case:** Paste the URL into any AI tool's custom instructions. It always serves the latest version of your context, behind a rotating token for security.

---

## Technical Implementation

### Streaming Architecture

All agent responses use **Server-Sent Events (SSE)** via edge functions:

```typescript
// Edge function streams response chunks
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of aiResponse) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
    }
    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    controller.close();
  }
});
return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
```

The client-side `streamChat` utility handles reconnection, parsing, and state updates:
```typescript
await streamChat({
  messages, agent, context,
  onDelta: (delta) => { /* append to document content */ },
  onDone: async () => { /* persist to database */ },
});
```

### Row-Level Security

Every user-facing table uses RLS with `auth.uid()`:

```sql
CREATE POLICY "Users can read own ideas"
  ON startup_ideas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

Tables that are inherently public (tools, prompt_templates, context_docs) use `is_public = true` policies.

### State Management

The application uses **React state** with `useCallback` memoization for agent message handling. No external state library — the complexity doesn't warrant it. Key patterns:

- `agentMessages: Record<string, Message[]>` — per-agent conversation history
- `documents: IdeaDocument[]` — generated deliverables with status tracking
- `completedAgents: Set<string>` — pipeline progress tracking
- `activityFeed: ActivityEvent[]` — real-time event log

### Component Architecture

```
pages/
  Startup.tsx      — Startup Crew orchestrator (state + pipeline logic)
  Squad.tsx        — Elite 9 orchestrator (state + debate integration)
  Context.tsx      — Context file editor with sharing
  Judgement.tsx     — HITL decision framework UI

components/
  startup/
    AgentChat.tsx          — Real-time chat with streaming
    DocumentPanel.tsx      — Document list with status indicators
    DocumentViewer.tsx     — Full markdown document viewer
    CenterCanvas.tsx       — Dynamic content area (activity / documents)
    PipelineFlow.tsx       — Phase-based pipeline visualization
    IdeaSelector.tsx       — Idea picker with inline rename
    AgentActivityFeed.tsx  — Event log with agent attribution

  squad/
    SquadPipelineFlow.tsx        — 9-agent sequential pipeline
    DebateCanvas.tsx              — Adversarial debate with chat bubbles
    DebateFlowVisualization.tsx  — Pipeline + debate node overlay
```

### Challenges Solved

**1. Cumulative Context Without Explosion**  
Each agent receives all prior documents + the original conversation. For agent A9, that's 8 prior documents. We concatenate them with clear delimiters but keep prompts focused — the system prompt tells the agent to produce *their specific deliverable*, not comment on everything.

**2. Streaming + State Updates**  
Updating React state on every SSE chunk (potentially hundreds per second) would cause performance issues. We batch updates and use functional state setters to avoid stale closures:
```typescript
setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, content } : d));
```

**3. Debate Ordering**  
Debates must run sequentially — agent A responds to agent B's latest message. We use a for-loop with `await` rather than parallel execution, ensuring each agent sees the full conversation history.

**4. Red Line Detection**  
Red line violations are detected via keyword matching in the response (`RED_LINE_VIOLATED`). This is intentionally simple — the prompt engineering ensures agents use these exact flags. The alternative (semantic analysis of every response) would add latency and complexity without meaningful accuracy improvement.

---

## Design Philosophy

### Aesthetic: Command Center, Not Dashboard

Agent Armory draws from **military operations centers** and **trading floor terminals** — dense information, low chrome, maximum signal. Key principles:

- **Information density over whitespace** — every pixel earns its place
- **Semantic color tokens** — all colors flow through CSS custom properties, never hardcoded
- **Micro-typography** — 9-11px for metadata, 12-13px for content, careful font-weight hierarchy
- **Collapsed by default** — pipeline flow, debates, all expandable sections start compact
- **Dark-first** — designed for extended use sessions

### Layout Architecture

The crew pages use a **three-panel layout**:
1. **Top:** Full-width collapsible pipeline flow (the "mission status" bar)
2. **Left sidebar:** Tabbed panel — Chat / Documents / Debates
3. **Center canvas:** Dynamic — activity feed or document viewer

This gives maximum breathing room to the content that matters (documents and conversations) while keeping navigation and status compact.

### Why No Org Chart (Yet)

The Startup Crew is flat — Chief of Staff delegates to parallel specialists. The Elite 9 is sequential — it's a pipeline, not a hierarchy. An org chart implies reporting structures that don't exist in these models. Future expansion (see roadmap) will add true hierarchical orchestration where an org chart makes sense.

---

## Decision Log

Key architectural and design decisions made during development:

| Decision | Rationale |
|----------|-----------|
| **Sequential pipeline over parallel** | Mirrors real orgs — you validate before you build. Cumulative context gets richer at each step. |
| **SSE streaming over WebSockets** | Simpler, unidirectional (server→client), supported by edge functions, no connection management. |
| **Red lines as prompt engineering** | Keyword detection (`RED_LINE_VIOLATED`) is reliable when agents are well-prompted. Semantic analysis adds complexity without proportional accuracy gains. |
| **Debates after specific agents, not after every agent** | Not every transition needs adversarial review. Market→Scope and Security→Growth are natural friction points. |
| **Context files in DB, not file storage** | Versioning, tagging, search, and RLS come free with Postgres. Export to .md is a view concern. |
| **Judgement rules separate from entries** | Entries are events (immutable log). Rules are living documents (mutable, toggleable, versionable). |
| **No external state management** | React state + useCallback handles the complexity. Redux/Zustand would add indirection without solving real problems at this scale. |
| **Chat bubbles for debates** | Makes agent exchanges feel like real conversations, not database rows. The left/right alternation creates visual rhythm. |
| **Profile avatar over "Sign out" text** | Users need quick access to context files and judgement rules. A dropdown menu from the avatar serves this better than a single sign-out button. |
| **Idea selector inline with title** | Eliminates redundancy (no separate "Select Idea" and "New Idea" buttons at different sizes). Pencil icon for rename keeps the header clean. |

---

## Future State

### Near-Term

- [ ] **Inter-Agent Messaging View** — Watch agents message each other in real-time as documents are generated. See the Chief of Staff delegate, the specialist respond, the CoS review, and the handoff happen.
- [ ] **Agent-Initiated Conversations** — Agents reach out to the user when they encounter misalignment or need clarification, rather than only responding to user messages.
- [ ] **Stacked Chat History** — When an agent messages you at different pipeline stages, the full thread is preserved and appended, not replaced.
- [ ] **Document Collaboration Markers** — Google Docs-style indicators showing which agent contributed which sections to a document.
- [ ] **Document Export** — Download all generated documents as a PDF/markdown bundle.

### Medium-Term

- [ ] **Agile Squad** — Post-launch crew focused on growth, maintenance, streamlining. The Startup Crew gets you from 0→1; the Agile Squad runs the engine from 1→N.
- [ ] **Chief of Staff Autonomy** — The CoS operates like a true executive assistant — executing tasks to completion and only surfacing decision points above a confidence threshold. The Judgement Framework provides the confidence calibration.
- [ ] **Hierarchical Orchestration** — Move from sequential pipeline to true org-chart delegation. The CoS delegates to leads, leads delegate to specialists, with escalation paths.
- [ ] **Cross-Idea Learning** — Judgement rules learned from one idea automatically apply to future ideas. Pattern recognition across projects.
- [ ] **Weekly QA Reviews** — Automated reports on autonomous agent decisions. Compare agent judgement against your historical decisions. Calibrate confidence levels.

### Long-Term Vision

- [ ] **Self-Hosting on Mac Mini** — Clone, configure, run persistently. Your own private agent hub, always on call.
- [ ] **Custom Domain Context** — `JessesAgents.com/context/{token}` serving your Soul.md, Skills.md, and Rules to any AI tool.
- [ ] **Model Routing** — Delegation/Routing.md informs which model handles which task based on complexity, cost, and confidence. Simple classification → cheap model. Complex architecture → premium model.
- [ ] **Thinking Evaluation** — Thinking.md captures your reasoning patterns. Agents evaluate your thinking for strengths and weaknesses, then optimize and codify a "better version of you."
- [ ] **Communication Style Adaptation** — Communications.md teaches agents when to be terse (pure output), when to banter, and when to add context. Different situations demand different cadences.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18, TypeScript, Vite | Type safety, fast HMR, modern tooling |
| Styling | Tailwind CSS, shadcn/ui | Semantic tokens, accessible components, dark mode |
| Animation | Framer Motion | Declarative, performant, gesture support |
| Markdown | react-markdown | Rich document rendering in chat and viewer |
| Backend | Lovable Cloud (Supabase) | Postgres, RLS, Edge Functions, Auth — zero infrastructure management |
| AI | Lovable AI Gateway (Gemini 3 Flash Preview) | Streaming SSE, no API key management, fast inference |
| Auth | Email/password + RLS | Simple, secure, no OAuth complexity for personal use |
| State | React useState + useCallback | Right-sized for the complexity. No unnecessary abstractions. |

---

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

1. **Sign up** with email at `/auth`
2. **Choose a crew** — `/startup` for the 6-agent team, `/squad` for the Elite 9
3. **Describe your idea** — Chat with the intake agent
4. **Watch agents work** — Documents generate in real-time via streaming
5. **Review debates** — Switch to the Debates tab to see agents challenge each other
6. **Manage context** — `/context` to edit your Soul.md, Skills.md, etc.
7. **Review judgements** — `/judgement` to rule on uncertain decisions and codify patterns

---

## License

MIT

---

*Built with conviction. Every agent has red lines. Every decision has a paper trail. Every judgement makes the system smarter.*
