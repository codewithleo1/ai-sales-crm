# AI Sales CRM — Product Requirements & Progress

## Original problem statement
Take an existing "AI Sales CRM" (GitHub: codewithleo1/ai-sales-crm, originally Vite + FastAPI/Supabase + Groq)
and turn it into a product-class, SaaS-level product. User picks: multi-tenancy, billing, better AI,
UI/UX redesign, auth + roles + teams ("all of the above"). AI provider = Groq (Qwen). Audit first, then build top priorities.

## Decisions
- Rebuilt on native Emergent stack: React (CRA) + FastAPI + MongoDB (was Vite/Supabase).
- Auth: JWT email/password with httpOnly cookies.
- AI: Groq official SDK, model `qwen/qwen3.6-27b` (user's own key).
- Payments: Stripe planned for Phase 2 (billing UI present, upgrade is a stub).

## Architecture
- Backend: server.py + auth.py + ai.py + seed.py + routers/{deals,contacts,team,dashboard,billing}.py
- Multi-tenant: every user has org_id; all deals/contacts/insights scoped by org_id.
- RBAC roles: owner / admin / member / viewer.
- Frontend: AuthContext + protected routes; pages Dashboard, Pipeline (kanban), AtRisk, Contacts, Team, Billing, Settings.

## Implemented (2026-08-17) — Phase 1 ✅
- JWT auth (register/login/logout/me), bcrypt, brute-force lockout, cookie sessions.
- Multi-tenant workspaces with strict data isolation (verified by tests).
- Team management + RBAC (invite w/ temp password, change role, remove) — admin gated.
- Deals CRUD + drag-and-drop kanban across 6 stages; churn score + lead score auto-compute.
- Contacts CRUD.
- Dashboard: KPIs, pipeline bar chart, deal-outcome donut, at-risk panel, AI insights feed.
- AI (Groq Qwen): churn "why at risk?" explanations, email drafting (3 tones), pipeline insights.
- Billing page: plans (free/pro/enterprise), usage meters, plan switching (payment stub).
- Seed: Northwind Sales Co, 4 users, 40 contacts, 70 deals.
- Tested: 22/22 backend pytest pass; all critical frontend flows pass (iteration_1.json).

## Backlog / Next
- P0 (Phase 2): Real Stripe subscriptions & checkout + AI usage-limit enforcement.
- P1 (Phase 3): Smarter lead scoring, AI email sequences/cadences, AI chat assistant over pipeline.
- P1: Server-side search & pagination on deals/contacts.
- P2: Activity timeline, tasks/reminders, notes, email open/click tracking, template library.
- P2: Landing page + onboarding wizard, audit logs, soft deletes, observability.
- Tech notes: days_in_stage should evolve over time (compute-on-read or scheduled job); silence /auth/me 401 console noise.
