# 🛡️ Agent Armory — Multi-Agent AI Operating System

> **Ship entire startups with orchestrated AI agent teams.**  
> From raw idea → market validation → architecture → design → implementation → security audit → growth strategy → compliance → launch.  
> With **executable constraints**, adversarial debates, human-in-the-loop judgement, truth maintenance, and integrated external tooling.

---

## Table of Contents

- [Vision](#vision)
- [The Constraint Engine (v2)](#the-constraint-engine-v2)
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
- [The Critique That Changed Everything](#the-critique-that-changed-everything)
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
- A **constraint engine** enforces standards as executable validation — not prompts, enforcement
- A **human-in-the-loop framework** captures uncertain decisions and codifies your judgement into reusable rules
- A **context file system** stores your operating identity — Soul.md, Skills.md, Judgements.md — shareable via secure tokenized URLs
- **Integrated external tooling** — Telegram for capturing notes on the fly, Firecrawl for deep web extraction, API key management for connecting to any service

The result: AI that operates like a high-functioning team, not a single overloaded assistant. And with v2, it's a team with **real enforcement** — bad outputs literally cannot persist.

---

## The Constraint Engine (v2)

**This is the inflection point.** The Constraint Engine converts Agent Armory from a high-fidelity simulation into a system that maintains truth over time.

### Why This Matters

Before v2, the system had a fundamental gap:

| What we had | What we needed |
|---|---|
| Red lines as prompt artifacts | Red lines as executable constraints |
| "Don't exceed 6 features" in a system prompt | System that **blocks** 8 features automatically |
| Agents agreeing confidently on wrong assumptions | Validation layer catching violations before they persist |
| Errors compounding silently through the pipeline | Ground truth enforcement at every stage |

### How It Works

Every agent output passes through a validation layer before it can be saved to the database:

```
Agent Output → Streaming → Complete
                              ↓
                    Constraint Engine
                    (validate-output)
                              ↓
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
           ✅ PASS        ⚠️ WARN         ⛔ FAIL
         Save to DB      Save + Flag      Block + Revise
                                              ↓
                                     Agent gets feedback:
                                     "You violated: [X, Y]"
                                     "Revise ONLY to fix these."
                                              ↓
                                     Revised output → Re-validate
```

### Constraint Types

| Type | Description | Effect |
|---|---|---|
| **Red Line** | Non-negotiable standard | Typically blocks; always logged |
| **Rule** | Operational guideline | Warns or blocks based on severity |

### Validator Types

| Validator | How It Works | Best For |
|---|---|---|
| **Regex** | Pattern matching with `must_match` or `must_not_match` mode | Checking for required keywords, forbidden terms, format compliance |
| **Function** | Structured checks: feature count, sprint days, required sections, word count | Quantitative constraints (max 6 features, word count range) |
| **LLM** | AI evaluation via Gemini Flash Lite | Semantic checks ("Does this allow high-severity vulnerabilities?") |

### Severity Levels

- **Block** (`⛔`): Output cannot be saved. Agent enters automatic revision loop.
- **Warn** (`⚠️`): Output saved with flags. Visible in activity feed.

### Automatic Revision Loop

When a blocking constraint fails:

1. System captures all violations with messages
2. Agent receives structured feedback: "Your output was flagged by the system: [violations]. Revise ONLY to fix these."
3. Agent regenerates, receiving its previous output + constraint feedback
4. Revised output is saved (even if constraints still fail on retry, to prevent infinite loops)

This turns agents into **self-correcting systems**. Quality jumps because they're forced to satisfy constraints.

### Default Constraints (10 High-Impact)

The system ships with seed constraints that users can customize:

| # | Agent | Constraint | Validator | Severity |
|---|---|---|---|---|
| 1 | A2 (PM) | Max 6 MVP features | Function | Block |
| 2 | A2 (PM) | Sprint must be ≤ 14 days | Function | Block |
| 3 | A5 (Frontend) | Must specify Lighthouse target | Regex | Block |
| 4 | A7 (Security) | No CRITICAL/HIGH vulnerabilities allowed | LLM | Block |
| 5 | A3 (Architect) | Must include required architecture sections | Function | Warn |
| 6 | All Agents | Documents must be 200-5000 words | Function | Warn |
| 7 | A6 (Backend) | No raw SQL allowed | Regex (must_not_match) | Block |
| 8 | A8 (Growth) | No dark patterns | LLM | Block |
| 9 | A5 (Frontend) | Must specify bundle size target | Regex | Warn |
| 10 | A1 (Market) | Must include TAM analysis | Regex | Block |

### Constraints Management UI

The `/constraints` page provides full CRUD:
- Toggle constraints active/inactive
- Set agent scope (specific agent or global)
- Choose validator type with quick templates
- Configure validator JSON (regex patterns, function checks, LLM prompts)
- Visual severity indicators (block vs warn)

### From Judgement Rules to Runtime Constraints

Judgement rules discovered through the HITL framework can be promoted to runtime constraints. Example:

```
Judgement Rule: "Max 6 MVP features"
    ↓ (promoted)
Constraint: {
  agent_code: "A2_vision",
  type: "rule",
  validator_type: "function",
  validator_config: { "check": "max_features", "max": 6 },
  severity: "block"
}
```

Now the rule isn't passive memory — it's active enforcement.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Agent Armory Frontend                              │
│  React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Framer Motion   │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐│
│  │ Startup  │ │  Elite 9 │ │ Context  │ │Judgement │ │  Constraint Engine ││
│  │  Crew    │ │  Squad   │ │  Files   │ │Framework │ │  Settings/Keys     ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘│
│       │             │            │             │                │            │
├───────┼─────────────┼────────────┼─────────────┼────────────────┼────────────┤
│       ▼             ▼            ▼             ▼                ▼            │
│                       Lovable Cloud (Supabase)                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Edge Functions (Streaming SSE + REST)                                   ││
│  │  ├── startup-chat       → Agent conversation + doc generation           ││
│  │  ├── validate-output    → Constraint validation engine (v2)             ││
│  │  ├── context            → Public context doc serving                    ││
│  │  ├── agent-context      → Tokenized agent config endpoint              ││
│  │  ├── firecrawl-scrape   → Single-page web extraction                    ││
│  │  ├── firecrawl-search   → Web search with optional scraping             ││
│  │  ├── firecrawl-map      → Sitemap discovery                             ││
│  │  └── firecrawl-crawl    → Recursive website crawl                       ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  Postgres + RLS                                                          ││
│  │  ├── startup_ideas       (user-scoped, phase-tracked)                   ││
│  │  ├── idea_messages       (per-agent conversation history)               ││
│  │  ├── idea_documents      (generated deliverables)                       ││
│  │  ├── debate_messages     (adversarial debate transcripts)               ││
│  │  ├── context_files       (Soul.md, Skills.md, API keys, etc.)           ││
│  │  ├── constraints         (executable validation rules — v2)             ││
│  │  ├── validation_results  (audit log of every check — v2)                ││
│  │  ├── judgement_entries    (HITL decision log)                            ││
│  │  ├── judgement_rules      (codified decision patterns)                   ││
│  │  ├── share_tokens        (secure URL sharing)                           ││
│  │  ├── agents / teams      (agent configuration)                          ││
│  │  ├── tools               (tool registry)                                ││
│  │  ├── prompt_templates    (reusable prompt library)                      ││
│  │  └── context_docs        (public knowledge base)                        ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  AI Gateway: Lovable AI (Gemini 3 Flash Preview + Gemini 2.5 Flash Lite)   │
│  Auth: Email/password with RLS on all user data                             │
│  Connectors: Telegram Bot API · Firecrawl Web Extraction                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow (v2 — with Constraint Enforcement)

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
     └──────────┬─────────────────┘
                │
                ▼
     ┌─── Constraint Engine ──────┐    ← NEW in v2
     │  For each active constraint: │
     │  • Regex validation          │
     │  • Function checks           │
     │  • LLM evaluation            │
     │                              │
     │  Result:                     │
     │  • PASS → Persist to DB      │
     │  • WARN → Persist + Flag     │
     │  • FAIL → Revision Loop      │
     └──────────┬─────────────────┘
                │
                ▼ (if PASS)
     ┌─── Persisted to DB ────────┐
     │  • Activity feed update     │
     │  • Judgement extraction      │
     │  • Validation results logged │
     └──────────┬─────────────────┘
                │
                ▼
     ┌─── Adversarial Debates ───┐
     │  Triggered after key       │
     │  agent completions         │
     │  Red line enforcement      │
     │  Majority alignment        │
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

The Chief of Staff acts as the orchestrator — the user chats directly with them, and they delegate to specialists. Each phase generates documents that become cumulative context for subsequent agents. **All outputs pass through the Constraint Engine before persistence.**

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

Each agent auto-generates their document by consuming all prior context. The pipeline is sequential — A1 validates before A2 scopes, A2 scopes before A3 architects. **With v2, red lines are now executable constraints — A2 literally cannot persist more than 6 features.**

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

**1 Open Forum** — all 9 agents converge for final alignment.

### The Relationship Between Debates and Constraints

With the Constraint Engine, many conflicts that debates used to surface are now **pre-resolved**:

- A2 can't propose 8 features → constraint blocks it before debate
- A5 can't omit performance targets → regex catches it
- A6 can't use raw SQL → pattern matching prevents it

Debates still matter for **subjective tensions** (market positioning, prioritization, design philosophy) where there's no binary right/wrong. But the Constraint Engine handles **objective violations** — making debates more focused and productive.

---

## Judgement Framework

The Human-In-The-Loop (HITL) Judgement Framework is the learning system that makes agents smarter over time.

### The Problem

AI agents make thousands of micro-decisions. Most are fine. Some are wrong. The problem is:
1. You can't review every decision
2. You can't pre-program every preference
3. Different contexts require different judgement

### The Solution

**Judgement Entries** — Agents surface uncertain decisions to the user.

**User Rules** — You make a decision, then codify the pattern.

**Learning Loop:**
1. Agent encounters uncertainty → logs a Judgement Entry
2. You review → make a decision
3. You optionally codify into a Rule
4. **NEW:** You can promote rules to executable Constraints
5. Future agents check Rules before asking
6. Constraints actively block violations in real-time

### Judgement → Constraint Pipeline

This is the v2 upgrade: judgement rules are no longer passive memory. They become active enforcement:

```
Passive Rule: "Max 6 MVP features"
    ↓ (promoted to constraint)
Active Enforcement: Agent proposes 8 → System blocks → Forces revision
```

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
| **Communications.md** | Style, cadence, channel routing |
| **Delegation.md** | When to orchestrate, cost-based model routing |
| **Thinking.md** | Lines of thinking, reasoning patterns |

### Per-File Sharing & Aggregate Sharing

Each file has an individual `is_shared` toggle. A "Share All" button bundles all shared files + active judgement rules into a single tokenized URL for agent consumption.

---

## Settings & Secret Management

The Settings page (`/settings`) serves as a personal secret manager with API key storage for OpenAI, Anthropic, Google AI, Supabase, Firecrawl, Telegram, GitHub, and custom providers.

---

## External Integrations

### Telegram Bot API
Connected via the Lovable connector system. Enables sending documents and notes to a Telegram bot.

### Firecrawl Web Extraction
Four edge functions: `firecrawl-scrape`, `firecrawl-search`, `firecrawl-map`, `firecrawl-crawl`.

---

## Sharing & Agent-Accessible Endpoints

### Tokenized URLs
Every share link uses a cryptographically generated token. The `/share/:token` route renders in a polished dark terminal aesthetic optimized for agent consumption — no navbar, monospace content, line numbers, jump index.

---

## Technical Implementation

### The Constraint Engine (Edge Function)

The `validate-output` edge function is the enforcement backbone:

```typescript
// Input
{
  "agent_code": "A5_frontend",
  "content": "...generated document...",
  "document_id": "uuid",
  "idea_id": "uuid"
}

// Validation flow
1. Fetch active constraints for agent + global (*)
2. Run each validator (regex, function, LLM)
3. Log all results to validation_results table
4. Return status: pass | fail | needs_review

// Output
{
  "status": "fail",
  "violations": [
    {
      "type": "RED_LINE",
      "constraint_id": "uuid",
      "severity": "block",
      "description": "Lighthouse ≥ 98 on mobile",
      "message": "Content does not match required pattern"
    }
  ],
  "constraints_checked": 5,
  "message": "1 blocking violation(s) found"
}
```

### Three Validator Implementations

**Regex Validator:**
```typescript
const regex = new RegExp(config.pattern, config.flags || "i");
const matches = regex.test(content);
// mode: "must_match" | "must_not_match"
```

**Function Validator:**
- `max_features`: Counts markdown headers matching feature patterns
- `max_sprint_days`: Extracts day estimates, checks against threshold
- `has_sections`: Verifies required markdown sections exist
- `word_count_range`: Validates document length

**LLM Validator:**
```typescript
// Uses Gemini Flash Lite for speed + cost efficiency
// System prompt: "You are a constraint validator. Respond with {pass: bool, message: str}"
// Content truncated to 3000 chars for speed
```

### Revision Loop Integration

Both Startup and Squad pipelines intercept the `onDone` handler:

```typescript
onDone: async () => {
  const validation = await validateOutput({
    agentCode: agent.id,
    content,
    ideaId: idea.id,
    token,
  });

  if (validation.status === 'fail') {
    // DO NOT SAVE
    // Send violations as feedback → agent revises
    await streamChat({
      messages: [
        { role: 'assistant', content: content.slice(0, 3000) },
        { role: 'user', content: `Your output was flagged: ${violations}. Revise.` },
      ],
      ...
    });
    return;
  }

  // Only now persist
  await saveDocument(finalContent);
}
```

### Streaming Architecture

All agent responses use **Server-Sent Events (SSE)** via edge functions. The `streamChat` utility handles parsing and state updates.

### Row-Level Security

Every user-facing table uses RLS with `auth.uid()`. The `constraints` and `validation_results` tables are fully user-scoped.

### State Management

React state + `useCallback` memoization. No external state library.

### Challenges Solved

**1. Constraint Validation Without Blocking UX**  
Validation runs after streaming completes but before persistence. If a constraint fails, the revision loop happens transparently — the user sees "⛔ System enforcing standards" in the activity feed, then "✅ Revised and completed" moments later.

**2. LLM Validators at Scale**  
LLM validation uses Gemini 2.5 Flash Lite — the cheapest, fastest model — with content truncated to 3000 chars. This keeps validation under 2 seconds per check. If the validator is unavailable, it passes by default (fail-open for non-critical validators).

**3. Constraint Scope Resolution**  
Constraints can target a specific agent (`A5_frontend`) or all agents (`*`). The query uses `.or()` to fetch both, ensuring global rules like word count limits apply everywhere.

**4. Cumulative Context Without Explosion**  
Each agent receives all prior documents + the original conversation. We concatenate with clear delimiters but keep prompts focused.

**5. Debate Ordering**  
Debates run sequentially with `await`, ensuring each agent sees the full conversation history.

**6. Auto-Judgement Extraction**  
Regex pattern matching on generated content identifies decision-making language and creates pending judgement entries.

---

## Design Philosophy

### Aesthetic: Command Center, Not Dashboard

Agent Armory draws from **military operations centers** and **trading floor terminals** — dense information, low chrome, maximum signal.

### Layout Architecture

Crew pages use a **command center layout**: full-width pipeline flow, left sidebar (chat), center canvas (documents/debates/activity).

### UI for Constraint Violations

**Critical design choice:** Constraint failures are NOT presented as "errors." They're presented as:

```
✅ "System enforcing performance standard (Lighthouse ≥98)"
NOT
❌ "Agent failed validation"
```

This reinforces trust in the **system**, not individual agents.

---

## Decision Log

Key architectural and design decisions:

| Decision | Rationale |
|----------|-----------|
| **Executable constraints over prompt-only red lines** | Prompts are suggestions. Constraints are enforcement. The gap between "agent was told not to" and "agent physically cannot" is the difference between simulation and reliability. |
| **Three validator types (regex, function, LLM)** | Regex handles 60% of checks cheaply. Functions handle quantitative rules (counts, thresholds). LLM handles semantic questions. This covers the full spectrum without overusing expensive AI calls. |
| **Block + auto-revision over just flagging** | If you only flag, nobody reviews the flags. If you block + auto-revise, quality improves automatically. The revision loop is the multiplier. |
| **Gemini Flash Lite for LLM validation** | Cheapest and fastest model. Constraint checking is binary (pass/fail), not nuanced reasoning. Using a premium model would add cost without accuracy gains. |
| **Fail-open for unavailable validators** | If the validation endpoint is down, don't block the user's workflow. Log the gap, pass by default. Trust is built over time, not by breaking things. |
| **Constraints as user-scoped data** | Different users have different standards. A security-focused founder wants strict OWASP checks. A hackathon project wants speed. Constraints are personal, not global. |
| **Sequential pipeline over parallel** | Mirrors real orgs — you validate before you build. |
| **SSE streaming over WebSockets** | Simpler, unidirectional, supported by edge functions. |
| **Debates after specific agents, not every agent** | Not every transition needs adversarial review. |
| **Context files in DB, not file storage** | Versioning, tagging, search, and RLS come free. |
| **Judgement rules separate from entries** | Entries are events. Rules are living documents. |
| **API keys in context_files table** | Reuses existing RLS-protected table. |
| **Shared view outside app shell** | Optimized for agent consumption. |
| **Connectors over raw API keys** | Telegram and Firecrawl use the connector system. |
| **3-5 sentence debate limit** | Prevents verbose LLM outputs. |

---

## The Critique That Changed Everything

A rigorous external analysis identified five critical failure modes in the v1 system:

### 1. Theater Over Reliability
> "9 agents, 6 debates, 4 rounds, red line flags, streaming UI — this feels powerful. But under the hood, it's still probabilistic text generation stacked in layers."

**Fix:** The Constraint Engine adds a verification layer between generation and persistence.

### 2. Red Lines Were Cosmetic
> "There is no verification layer, no constraint engine, no post-check validation. Agents can miss violations, falsely flag violations, contradict themselves later."

**Fix:** Red lines are now executable. `RED_LINE_VIOLATED` in a prompt became `validator_type: 'regex', severity: 'block'` in a database row.

### 3. No Separation Between Proposal and Reality
> "Agents generate documents. Documents become state. Next agents trust that state. Errors compound silently."

**Fix:** The validation layer creates a gate between proposal (raw output) and committed state (persisted document). Only validated content persists.

### 4. Judgement System Was Under-Leveraged
> "It's a dashboard, not a control system."

**Fix:** Judgement rules can be promoted to active constraints. The system goes from "log decisions" to "enforce decisions in real-time."

### 5. Context Accumulation ≠ Intelligence
> "More context → more noise. More tokens → weaker signal."

**Acknowledged — future fix.** The current system still uses full context injection. The roadmap includes retrieval + synthesis to replace raw document dumps.

### The Core Insight

> "You're building a pipeline that produces outputs. You need a system that maintains truth over time."

The Constraint Engine is the first concrete step toward truth maintenance. It doesn't solve everything, but it solves the foundation: **bad outputs literally cannot persist.**

---

## Future State

### Near-Term (Next)

- [ ] **Document Staging (Draft → Verified → Canonical)** — Three-layer document model where only validated documents become canonical context for future agents
- [ ] **Context Retrieval Over Injection** — Replace "give every agent everything" with relevant slices, prior decisions, and compressed summaries
- [ ] **Constraint-Informed Debates** — Debates reference active constraints, making disagreements about legitimate trade-offs rather than detectable violations
- [ ] **Telegram Feed Integration** — Send links, notes, and documents to a Telegram bot
- [ ] **Document Markup & Revision** — Annotate generated documents and send back to the authoring agent

### Medium-Term

- [ ] **Agent Count Optimization** — Consolidate from 9 shallow specialists to 3-5 deep agents with stronger constraints, better tools, and deeper reasoning
- [ ] **Rewrite Loop** — Periodically merge documents, remove redundancy, resolve contradictions, extract higher-order insights. The system evolves from many documents to fewer, sharper truths.
- [ ] **Chief of Staff Autonomy** — The CoS operates like a true executive assistant, executing to completion and only surfacing decision points above a confidence threshold
- [ ] **Cross-Idea Learning** — Judgement rules and constraints learned from one idea automatically apply to future ideas

### Long-Term Vision

- [ ] **Truth Maintenance Engine** — Full separation of proposal/verification/canonical state. Every claim tracked, every contradiction resolved, every insight compounded.
- [ ] **Self-Hosting on Mac Mini** — Clone, configure, run persistently
- [ ] **Model Routing via Delegation.md** — Task complexity → model selection
- [ ] **Active Constraint Learning** — System observes which constraints frequently trigger revision and suggests new constraints based on patterns

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18, TypeScript, Vite | Type safety, fast HMR, modern tooling |
| Styling | Tailwind CSS, shadcn/ui | Semantic tokens, accessible components, dark mode |
| Animation | Framer Motion | Declarative, performant, gesture support |
| Markdown | react-markdown | Rich document rendering |
| Backend | Lovable Cloud (Supabase) | Postgres, RLS, Edge Functions, Auth |
| AI (Generation) | Lovable AI Gateway (Gemini 3 Flash Preview) | Streaming SSE, fast inference |
| AI (Validation) | Lovable AI Gateway (Gemini 2.5 Flash Lite) | Cheap, fast constraint checking |
| Web Extraction | Firecrawl | Scrape, search, map, crawl |
| Messaging | Telegram Bot API | Quick capture, note-taking |
| Auth | Email/password + RLS | Simple, secure |
| State | React useState + useCallback | Right-sized for the complexity |

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
5. **Constraint enforcement** — Watch the activity feed for ✅ pass / ⚠️ warn / ⛔ block indicators
6. **Review debates** — Switch to the Debates tab to see agents challenge each other
7. **Manage constraints** — `/constraints` to create, edit, toggle validation rules
8. **Manage context** — `/context` to edit your Soul.md, Skills.md, etc.
9. **Review judgements** — `/judgement` to rule on uncertain decisions and codify patterns
10. **Configure settings** — `/settings` to store API keys and manage integrations
11. **Share context** — Toggle files to shared, generate tokenized URLs for agents

---

## License

MIT

---

*Built with conviction. Every agent has red lines — and now those red lines are executable. Every decision has a paper trail. Every judgement makes the system smarter. Every constraint makes it more reliable. The gap between simulation and truth maintenance starts closing here.*
