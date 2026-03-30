# 🛡️ Agent Armory — Multi-Agent AI Operating System

> **Ship entire startups with orchestrated AI agent teams.**  
> From raw idea → market validation → architecture → design → implementation → security audit → growth strategy → compliance → launch.  
> With adversarial debates, red-line enforcement, human-in-the-loop judgement, persistent decision intelligence, and integrated external tooling.

---

## Table of Contents

- [Vision](#vision)
- [Architecture](#architecture)
- [Agent Teams](#agent-teams)
- [Adversarial Debate System](#adversarial-debate-system)
- [Judgement Framework](#judgement-framework)
- [Context File System](#context-file-system)
- [Settings & Secret Management](#settings--secret-management)
- [External Integrations](#external-integrations)
- [Sharing & Agent-Accessible Endpoints](#sharing--agent-accessible-endpoints)
- [Technical Implementation](#technical-implementation)
- [Design Philosophy](#design-philosophy)
- [Decision Log](#decision-log)
- [Future State](#future-state)
- [Tech Stack](#tech-stack)
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
- **Integrated external tooling** — Telegram for capturing notes on the fly, Firecrawl for deep web extraction, API key management for connecting to any service

The result: AI that operates like a high-functioning team, not a single overloaded assistant.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Agent Armory Frontend                              │
│  React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion   │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐│
│  │ Startup  │ │  Elite 9 │ │ Context  │ │Judgement │ │  Settings/Keys     ││
│  │  Crew    │ │  Squad   │ │  Files   │ │Framework │ │  Integrations      ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘│
│       │             │            │             │                │            │
├───────┼─────────────┼────────────┼─────────────┼────────────────┼────────────┤
│       ▼             ▼            ▼             ▼                ▼            │
│                       Lovable Cloud (Supabase)                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Edge Functions (Streaming SSE + REST)                                   ││
│  │  ├── startup-chat     → Agent conversation + doc generation             ││
│  │  ├── context          → Public context doc serving                      ││
│  │  ├── agent-context    → Tokenized agent config endpoint                 ││
│  │  ├── firecrawl-scrape → Single-page web extraction                      ││
│  │  ├── firecrawl-search → Web search with optional scraping               ││
│  │  ├── firecrawl-map    → Sitemap discovery                               ││
│  │  └── firecrawl-crawl  → Recursive website crawl                         ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  Postgres + RLS                                                          ││
│  │  ├── startup_ideas     (user-scoped, phase-tracked)                     ││
│  │  ├── idea_messages     (per-agent conversation history)                 ││
│  │  ├── idea_documents    (generated deliverables)                         ││
│  │  ├── debate_messages   (adversarial debate transcripts)                 ││
│  │  ├── context_files     (Soul.md, Skills.md, API keys, etc.)             ││
│  │  ├── judgement_entries  (HITL decision log)                              ││
│  │  ├── judgement_rules    (codified decision patterns)                     ││
│  │  ├── share_tokens      (secure URL sharing)                             ││
│  │  ├── agents / teams    (agent configuration)                            ││
│  │  ├── tools             (tool registry)                                  ││
│  │  ├── prompt_templates  (reusable prompt library)                        ││
│  │  └── context_docs      (public knowledge base)                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  AI Gateway: Lovable AI (Gemini 3 Flash Preview) — streaming SSE            │
│  Auth: Email/password with RLS on all user data                             │
│  Connectors: Telegram Bot API · Firecrawl Web Extraction                    │
└─────────────────────────────────────────────────────────────────────────────┘
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
     │  • Judgement extraction    │
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
     ┌─── Judgement Extraction ──┐
     │  Auto-detect decisions    │
     │  Surface to HITL review   │
     │  Codify into rules        │
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

A high-fidelity, opinionated squad modeled after top-tier startup operators. Every agent has hard constraints (red lines) and areas of flexibility. This crew operates as a **command center** — documents generate in a central canvas, debates happen in structured rounds, and the user oversees everything from a single view.

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

**Auto-Judgement Extraction:** As documents are generated, the system scans for decision patterns (e.g., "prioritized X over Y", "chose A instead of B") and automatically surfaces them as pending judgement entries for human review.

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

### Concise, Conversational Debates

Debates are engineered for readability — agents are prompted to keep responses to 3-5 sentences, use a conversational tone, and reference each other by name. This prevents wall-of-text syndrome and makes debates feel like watching a real team conversation. Chat bubbles with left/right alignment create visual rhythm.

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

**Auto-Surfacing from Agent Output:** The Elite 9 Squad automatically scans generated documents for decision patterns using regex matching. Phrases like "prioritized", "chose", "trade-off", "instead of" trigger automatic creation of pending judgement entries. This ensures no significant decision slips through without human review.

### Editable Rules

Rules are fully editable — toggle active/inactive, update rule text, adjust confidence, and delete obsolete rules. Categories help organize by domain (Architecture, Security, Design, Business, Process).

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

### Per-File Sharing

Each file has an individual `is_shared` toggle and generates its own shareable link. This allows selective exposure — share your Skills.md publicly while keeping Soul.md private.

### Aggregate Sharing

A "Share All" button generates a single tokenized URL that bundles all files marked as shared, plus your active judgement rules. This creates a complete agent configuration endpoint.

---

## Settings & Secret Management

The Settings page (`/settings`) serves as a personal secret manager:

- **API Key Storage** — Save keys for OpenAI, Anthropic, Google AI, Supabase, Firecrawl, Telegram, GitHub, or custom providers
- **Masked Display** — Keys are masked by default with show/hide toggle
- **Provider Tagging** — Each key is tagged with its provider for easy identification
- **Private Storage** — Keys are stored in the user's `context_files` table with `category: 'api_keys'`, fully RLS-protected
- **Quick Links** — Direct navigation to Context Files, Judgement Rules, and Share Links

This centralizes all credentials needed for autonomous agent execution in one secure, user-owned location.

---

## External Integrations

### Telegram Bot API

Connected via the Lovable connector system. Enables:
- Sending documents and notes to a Telegram bot for quick capture
- Future: receiving messages as a persistent feed of ideas, links, and context

### Firecrawl Web Extraction

Four edge functions provide full web extraction capabilities:

| Function | Purpose | Use Case |
|----------|---------|----------|
| `firecrawl-scrape` | Extract content from a single URL | Rich context from articles, docs, competitor pages |
| `firecrawl-search` | Web search with optional scraping | Research and competitive intelligence |
| `firecrawl-map` | Discover all URLs on a domain | Sitemap generation, project structure mapping |
| `firecrawl-crawl` | Recursively scrape entire sites | Deep knowledge base extraction |

**Output formats:** markdown, HTML, raw HTML, links, screenshots, branding extraction, AI-generated summaries, and structured JSON extraction with custom schemas.

---

## Sharing & Agent-Accessible Endpoints

### Tokenized URLs

Every share link uses a cryptographically generated token:
```
https://your-domain.com/share/{token}           → Human-readable terminal view
https://your-project.supabase.co/functions/v1/agent-context/{token}  → Raw JSON for agents
```

### Terminal-Style Shared View

The `/share/:token` route renders outside the app shell (no navbar) in a polished dark terminal aesthetic:
- **Summary header** with file count and generation timestamp
- **Jump index** with line number ranges per file (e.g., `L1–L42: Soul.md`)
- **Monospace content** with line numbers for easy agent indexing
- **Optimized for scraping** — agents hit the page, read the summary, see the index, and know exactly which line ranges to extract

### Edge Function Endpoint

The `agent-context` edge function serves structured JSON:
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

Tables that are inherently public (tools, prompt_templates, context_docs) use `is_public = true` policies. Shared context files have an additional anon policy: `is_shared = true`.

### State Management

The application uses **React state** with `useCallback` memoization for agent message handling. No external state library — the complexity doesn't warrant it. Key patterns:

- `agentMessages: Record<string, Message[]>` — per-agent conversation history
- `documents: IdeaDocument[]` — generated deliverables with status tracking
- `completedAgents: Set<string>` — pipeline progress tracking
- `activityFeed: ActivityEvent[]` — real-time event log

### Component Architecture

```
pages/
  Dashboard.tsx    — Armory overview with live stats (crews, tools, ideas, docs, rules)
  Startup.tsx      — Startup Crew orchestrator (state + pipeline logic)
  Squad.tsx        — Elite 9 orchestrator (state + debate + judgement extraction)
  Context.tsx      — Context file editor with per-file sharing
  Judgement.tsx    — HITL decision framework with full CRUD on rules
  Settings.tsx     — API key manager + quick links
  SharedContext.tsx — Public terminal-style shared view (no auth, no navbar)

components/
  startup/
    AgentChat.tsx          — Real-time chat with streaming
    DocumentPanel.tsx      — Document list with status indicators
    DocumentViewer.tsx     — Full markdown document viewer (prose-xs sizing)
    CenterCanvas.tsx       — Dynamic content area (activity / documents)
    PipelineFlow.tsx       — Phase-based pipeline visualization
    IdeaSelector.tsx       — Idea picker with inline rename
    AgentActivityFeed.tsx  — Event log with agent attribution

  squad/
    SquadPipelineFlow.tsx        — 9-agent sequential pipeline
    DebateCanvas.tsx              — Adversarial debate with chat bubbles (3-5 sentence limit)
    DebateFlowVisualization.tsx  — Pipeline + debate node overlay

  AppNavigation.tsx — Hierarchical nav with Crews, Resources, Personal dropdowns
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

**5. Share Token Persistence**  
Aggregate share tokens are loaded from the database on mount, ensuring they survive tab switches and page refreshes. Individual file tokens use `resource_id` linking for precise per-file access.

**6. Auto-Judgement Extraction**  
Regex pattern matching against generated document content identifies decision-making language (e.g., "prioritized", "chose", "trade-off") and automatically creates pending judgement entries. This bridges the gap between agent autonomy and human oversight.

**7. Concise Debate Prompts**  
Debate agents are system-prompted with strict length limits (3-5 sentences) and conversational tone requirements. This prevents the common LLM failure mode of verbose, repetitive debate responses.

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

The crew pages use a **command center layout**:
1. **Top:** Full-width collapsible pipeline flow (the "mission status" bar)
2. **Left sidebar:** Agent chat with quick-switch icons
3. **Center canvas:** Tabbed — Documents / Debates / Activity
4. **Right sidebar:** Contextual panels (activity feed, settings)

This gives maximum breathing room to the content that matters (documents and conversations) while keeping navigation and status compact.

### Navigation Structure

Hierarchical dropdowns keep the top bar clean:
- **Armory** — Dashboard with live stats
- **Crews** → Startup Crew, Elite Squad
- **Resources** → Toolbox, Prompts, Builder, Spec
- **Personal** → Context Files, Judgement
- **Profile icon** → Settings (API keys), Sign out

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
| **API keys in context_files table** | Reuses existing RLS-protected, user-scoped table. Avoids creating a new table for what is effectively user-scoped key-value storage. |
| **Per-file sharing with aggregation** | Granular control over what's public. Share Skills.md but not Soul.md. Aggregate endpoint for "give agents everything." |
| **Shared view outside app shell** | No navbar, no auth required. Optimized for agent consumption. Terminal aesthetic signals "this is for machines." |
| **Dashboard includes built-in crews** | Stats show `crews: N + 2` to reflect the Startup and Elite 9 as built-in crews, even when no custom teams exist. |
| **Connectors over raw API keys** | Telegram and Firecrawl use the Lovable connector system for automatic credential injection. No manual secret management for core integrations. |
| **3-5 sentence debate limit** | Prevents verbose LLM outputs. More rounds with less text creates better readability and more natural conversation flow. |
| **Auto-judgement extraction via regex** | Simple pattern matching catches 80%+ of explicit decisions. More sophisticated NLP would add latency without proportional value at this stage. |

---

## Future State

### Near-Term

- [ ] **Telegram Feed Integration** — Send links, notes, and documents to a Telegram bot. Firecrawl auto-extracts rich context from URLs. Creates a searchable, indexed knowledge base.
- [ ] **Inter-Agent Messaging View** — Watch agents message each other in real-time. See the Chief of Staff delegate, the specialist respond, the CoS review.
- [ ] **Document Markup & Revision** — Select a generated document, annotate it, and send back to the authoring agent for revision with your notes as context.
- [ ] **Context-Attached Agent Chats** — Select context files (Soul.md, Skills.md) to attach when chatting with a specific agent.
- [ ] **Agent Work Event Tracking** — When switching between agents, see how many events occurred since your last interaction (docs edited, new docs created, debates completed).

### Medium-Term

- [ ] **Agile Squad** — Post-launch crew focused on growth, maintenance, streamlining. The Startup Crew gets you from 0→1; the Agile Squad runs the engine from 1→N.
- [ ] **Chief of Staff Autonomy** — The CoS operates like a true executive assistant — executing tasks to completion and only surfacing decision points above a confidence threshold.
- [ ] **Hierarchical Orchestration** — Move from sequential pipeline to true org-chart delegation. The CoS delegates to leads, leads delegate to specialists, with escalation paths.
- [ ] **Cross-Idea Learning** — Judgement rules learned from one idea automatically apply to future ideas. Pattern recognition across projects.
- [ ] **GitHub Repository Index** — Firecrawl extracts project structure and key files from GitHub repos. Creates a personal project registry with rich metadata.

### Long-Term Vision

- [ ] **Self-Hosting on Mac Mini** — Clone, configure, run persistently. Your own private agent hub, always on call.
- [ ] **Custom Domain Context** — `YourDomain.com/context/{token}` serving your full agent configuration to any AI tool.
- [ ] **Model Routing** — Delegation.md informs which model handles which task based on complexity, cost, and confidence. Simple classification → cheap model. Complex architecture → premium model.
- [ ] **Thinking Evaluation** — Thinking.md captures your reasoning patterns. Agents evaluate your thinking for strengths and weaknesses, then optimize and codify a "better version of you."
- [ ] **Communication Style Adaptation** — Communications.md teaches agents when to be terse, when to banter, and when to add context.

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
| Web Extraction | Firecrawl | Scrape, search, map, crawl — 4 edge functions for full coverage |
| Messaging | Telegram Bot API | Quick capture, note-taking, document relay |
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
8. **Configure settings** — `/settings` to store API keys and manage integrations
9. **Share context** — Toggle files to shared, generate tokenized URLs for agents

---

## License

MIT

---

*Built with conviction. Every agent has red lines. Every decision has a paper trail. Every judgement makes the system smarter. Now with integrated web extraction, messaging, and a personal secret manager — because a one-person company needs a full arsenal.*
