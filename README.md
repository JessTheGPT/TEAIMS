# 🚀 AgentOS — Multi-Agent Startup Builder

Build startups with AI agent teams. Spin up entire crews that research, plan, architect, design, develop, audit, and launch — all orchestrated through sequential pipelines with human-in-the-loop checkpoints.

## What It Does

AgentOS operationalizes two distinct agent teams that take a founder's idea from raw concept to launch-ready startup:

### 🏢 Startup Crew (6 Agents)
A classic startup team that covers the core functions:
- **Chief of Staff** — Intake & synthesis, the strategic operator
- **Tech Lead** — System architecture & tech stack decisions
- **Business Exec** — Market strategy, business model, GTM
- **Designer** — UX strategy, personas, design system
- **Developer** — Implementation plan, sprint breakdown
- **Competitive Research** — Market intelligence & competitor analysis

### ⚡ Elite 9 Squad (9 Agents)
A high-fidelity, opinionated squad modeled after top-tier operators:
- **A1 Market Strategist** — TAM/SAM/SOM, competitor deep-dive, kill-or-validate
- **A2 Visionary PM** — Scope lock (6 features max), acceptance criteria
- **A3 Systems Architect** — Full architecture, ERD, API contracts
- **A4 UI Specialist** — Production-ready design system & component code
- **A5 Frontend Engineer** — Implementation with quality gates (Lighthouse ≥98)
- **A6 Backend Engineer** — Zero N+1 queries, Prisma schema, background jobs
- **A7 Security Auditor** — OWASP Top 10, RLS audit, deployment blocker
- **A8 Growth Lead** — 500+ waitlist strategy, pricing, A/B tests
- **A9 SRE/Ops/Legal** — CI/CD, GDPR, TOS, launch runbook

### Key Features
- **Sequential Pipeline** — Each agent builds on cumulative context from all previous phases
- **Streaming AI Responses** — Real-time document generation via edge functions
- **Human-in-the-Loop (HITL)** — Checkpoints where founders review and approve before advancing
- **Persistent State** — Ideas, messages, and documents saved per user with RLS
- **Collapsible Layout** — Full-width pipeline top, tabbed chat/docs sidebar for maximum workspace
- **Auth-Protected** — Email auth with row-level security on all user data

## Architecture

```
┌─────────────────────────────────────────────┐
│  React + Vite + Tailwind + shadcn/ui        │
│  ├── /startup  — Startup Crew pipeline      │
│  ├── /squad    — Elite 9 Squad pipeline      │
│  └── /auth     — Email authentication        │
├─────────────────────────────────────────────┤
│  Lovable Cloud (Supabase)                    │
│  ├── Edge Function: startup-chat (streaming) │
│  ├── Tables: startup_ideas, idea_messages,   │
│  │           idea_documents                  │
│  └── RLS: user_id = auth.uid() on all tables │
└─────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Lovable Cloud (Supabase) — Edge Functions, Postgres, RLS
- **AI**: Lovable AI Gateway (Gemini 3 Flash Preview) — streaming SSE
- **Auth**: Email/password with row-level security

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

## How It Works

1. **Sign up** with email
2. **Choose a crew** — Startup Crew (6 agents) or Elite 9 Squad (9 agents)
3. **Describe your idea** — Chat with the intake agent
4. **Watch agents work** — Each generates a structured document
5. **Review at HITL checkpoints** — Approve or provide feedback
6. **Get a complete startup package** — Market validation, architecture, design, implementation plan, security audit, growth strategy, and launch runbook

## Roadmap

- [ ] **Agent Debate Canvas** — Multi-agent adversarial discussions with push/pull dynamics
- [ ] **Red Lines System** — Each agent has non-negotiable constraints and flexible areas
- [ ] **Cross-Domain Challenges** — Growth vs Risk, Business vs Tech, Design vs Compliance
- [ ] **Document Export** — Download all generated documents as PDF/markdown bundle
- [ ] **Idea Comparison** — Compare outputs across different crews for the same idea
