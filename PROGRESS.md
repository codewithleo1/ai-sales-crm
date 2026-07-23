# 📊 PROGRESS.md — AI Sales CRM Assistant
> Paste this file into every new Claude chat to restore full context instantly.
> Update this after every completed step.

---

## 🧠 Project Summary
Building an AI-powered Sales CRM Assistant for GitHub portfolio.
AI analyzes deals, predicts churn, drafts follow-up emails, surfaces at-risk accounts.

**Live URLs**
- Frontend: `https://ai-sales-crm-nu.vercel.app`
- Backend:  `https://ai-sales-crm-ehv0.onrender.com`
- API Docs: `https://ai-sales-crm-ehv0.onrender.com/docs`
- GitHub:   `https://github.com/codewithleo1/ai-sales-crm`

---

## 🛠️ Stack
| Layer | Tool |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS + Zustand |
| Backend | FastAPI + SQLAlchemy async + Python 3.12 |
| Database | Supabase (PostgreSQL) |
| AI | Groq API — llama-3.1-8b-instant |
| Charts | Recharts |
| Deploy FE | Vercel |
| Deploy BE | Render (free tier, Singapore region) |
| Env | Windows + PowerShell + VS Code + uv |

---

## ✅ Completed Steps

### Phase 1 — Backend Foundation ✅
- [x] `uv init` inside `backend/` folder
- [x] Python 3.12 pinned via `.python-version`
- [x] All packages installed via `uv add`: fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, groq, python-dotenv, pydantic, pydantic-settings, httpx, faker, ruff, pydantic[email]
- [x] Folder structure created: `app/models`, `app/routers`, `app/services`, `app/schemas`, `app/utils`
- [x] All `__init__.py` files created
- [x] Supabase project created: `ai-sales-crm` (region: ap-south-1 Mumbai)
- [x] Database schema applied in Supabase SQL editor (contacts, deals, activities, ai_insights) — ran WITHOUT RLS
- [x] `app/config.py` — pydantic-settings with `.env` loading
- [x] `backend/.env` configured with all keys
- [x] `app/database.py` — async SQLAlchemy engine + session factory + Base + get_db()
- [x] Models created: `contact.py`, `deal.py`, `activity.py`, `prediction.py` (AIInsight)
- [x] Pydantic schemas: `contact.py` (ContactCreate/Response/Update), `deal.py` (DealCreate/Response/Update), `insight.py` (InsightResponse + APIResponse)
- [x] Routers: `contacts.py`, `deals.py`, `activities.py` (full CRUD)
- [x] `main.py` — FastAPI app, CORS, all routers registered
- [x] Health check endpoint `/api/health` working
- [x] Server tested: `uv run uvicorn main:app --reload --port 8000`
- [x] Live test: POST /api/contacts → 201, data saved to Supabase ✅
- [x] Ruff linting passing on all files
- [x] Git repo initialized at project root, pushed to GitHub
- [x] **Git commit: `feat: backend foundation with CRUD endpoints`**

### Phase 2 — AI Services ✅
- [x] `app/services/groq_service.py` — AsyncGroq client wrapper, `chat_completion()` function
- [x] `app/services/churn_service.py` — rule-based scoring (days inactive + days in stage + probability), `explain_churn_risk()` via Groq, `score_and_explain()` convenience function
- [x] `app/services/email_service.py` — 3 tones (professional/urgent/friendly), `draft_follow_up_email()` via Groq
- [x] `app/services/insight_service.py` — `generate_pipeline_insights()` and `generate_deal_insight()` via Groq
- [x] `app/routers/predictions.py` — GET /api/predictions/churn, POST /api/predictions/refresh
- [x] `app/routers/emails.py` — POST /api/emails/draft (body: deal_id + tone)
- [x] `app/routers/insights.py` — GET /api/insights, POST /api/insights/generate, PATCH /api/insights/{id}/dismiss
- [x] All routers registered in `main.py`
- [x] Live test: Groq drafted a real personalized email ✅
- [x] Ruff linting passing
- [x] **Git commit: `feat: groq AI services — churn, email draft, insights`**

### Phase 3 — Frontend Foundation ✅
- [x] Vite + React project scaffolded in `frontend/`
- [x] Tailwind CSS v3 configured
- [x] Packages installed: axios, zustand, react-router-dom, recharts, lucide-react, clsx, tailwind-merge, class-variance-authority, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- [x] `frontend/.env` configured with `VITE_API_URL=http://127.0.0.1:8000`
- [x] Folder structure: `src/api`, `src/store`, `src/components/layout`, `src/components/dashboard`, `src/components/deals`, `src/components/ai`, `src/pages`
- [x] `src/api/client.js` — Axios instance with baseURL from env
- [x] `src/api/deals.js` — getDeals, getDeal, createDeal, updateDeal, deleteDeal, getChurnPredictions, refreshChurnScores
- [x] `src/api/insights.js` — getInsights, generateInsights, draftEmail
- [x] `src/store/dealsStore.js` — Zustand store: deals, atRiskDeals, loading, fetchDeals, fetchAtRiskDeals, refreshChurn
- [x] `src/store/insightsStore.js` — Zustand store: insights, emailDraft, loading, fetchInsights, generateInsights, draftEmail, clearEmailDraft
- [x] Layout components: `Sidebar.jsx`, `Topbar.jsx`, `Layout.jsx`
- [x] Dashboard components: `KPICard.jsx`, `AtRiskPanel.jsx`, `AIInsightsFeed.jsx`
- [x] Chart components: `PipelineChart.jsx` (colored bar chart by stage), `WinRateChart.jsx` (donut chart)
- [x] Deal components: `AddDealModal.jsx` (create deals from UI), `AddContactModal.jsx`
- [x] AI components: `EmailDraftModal.jsx` (3 tone selector + Groq draft + copy to clipboard)
- [x] Pages: `Dashboard.jsx`, `Pipeline.jsx` (kanban), `AtRisk.jsx`, `Contacts.jsx`
- [x] `App.jsx` — React Router with all 4 routes + Render cold start health ping on load
- [x] Visual style: gradient purple sidebar + colored KPI cards (indigo/green/red/yellow)
- [x] **Git commit: `feat: frontend dashboard and pipeline view`**

### Phase 4 — AI Features in UI ✅
- [x] At-Risk Accounts panel on Dashboard (churn_score ≥ 0.7)
- [x] AI Insights feed with "Analyze Pipeline" + "Generate New" buttons
- [x] Email Draft modal — 3 tone buttons, Groq generates email, copy to clipboard
- [x] Churn score badge on every deal card in pipeline and at-risk panel
- [x] One-click "Draft Follow-up" button on at-risk deals and pipeline cards
- [x] Search bar on Pipeline kanban (filters deals by title in real time)
- [x] Add Deal modal (title, stage, value, probability, close date, notes)
- [x] Add Contact modal (name, email, company, title, phone)
- [x] Contacts page with search + 3-column card grid
- [x] Pipeline kanban — drag deals between stages to update stage in DB
- [x] Dashboard charts — Pipeline by Stage bar chart + Deal Outcomes donut chart

### Phase 5 — Seed Data + Deploy ✅
- [x] `app/utils/seed.py` — creates 50 contacts, 120 deals, ~400 activities with realistic data
- [x] Seed executed: $7.3M pipeline, 16 at-risk deals, 13 closed won
- [x] `backend/Procfile` created for Render
- [x] `backend/runtime.txt` created (3.12.0) to pin Python version on Render
- [x] `backend/requirements.txt` generated via `uv pip compile pyproject.toml -o requirements.txt`
- [x] Backend deployed to Render — `https://ai-sales-crm-ehv0.onrender.com`
- [x] All 7 env vars set on Render (SUPABASE_URL, SUPABASE_KEY, DATABASE_URL, GROQ_API_KEY, FRONTEND_URL, ENVIRONMENT, SECRET_KEY)
- [x] CORS opened to `allow_origins=["*"]` to fix Vercel→Render CORS error
- [x] Frontend deployed to Vercel — `https://ai-sales-crm-nu.vercel.app`
- [x] `VITE_API_URL` set to Render backend URL on Vercel
- [x] Render cold start health ping added to `App.jsx` `useEffect`
- [x] Live app fully working end to end ✅
- [x] **Git commits: `chore: add Procfile, runtime.txt, requirements.txt for Render`**, `fix: open CORS for portfolio demo`**, `fix: add Render cold start health ping on app load`**

---

## 🔄 Current Status

**Currently on:** Phase 5 complete. Working on UI improvements.

**Last completed action:**
> Fixed pipeline kanban topbar layout (search + Add Deal + Refresh left-aligned).
> Fixed PipelineChart to show colored bars per stage.
> Added search to Pipeline kanban.
> Added Add Deal modal to Dashboard and Pipeline pages.
> Added Contacts page with search and Add Contact modal.
> Removed debug "Deals loaded" line from Dashboard.

**Next action to take:**
> Remove debug line from Dashboard.jsx if still present.
> Commit all UI improvements and push to GitHub + Vercel auto-deploys.
> Add Resend email sending (real email delivery from email modal).
> Write README.md with screenshots and live demo link.

---

## 📁 Files Created

```
ai-sales-crm/                          ← GitHub repo root
├── PROGRESS.md                        ✅
├── .gitignore                         ✅ (root level)
│
├── backend/
│   ├── main.py                        ✅
│   ├── requirements.txt               ✅
│   ├── Procfile                       ✅
│   ├── runtime.txt                    ✅ (3.12.0)
│   ├── pyproject.toml                 ✅
│   ├── uv.lock                        ✅
│   ├── .gitignore                     ✅
│   ├── .env                           ✅ (NOT committed)
│   └── app/
│       ├── config.py                  ✅
│       ├── database.py                ✅
│       ├── models/
│       │   ├── contact.py             ✅
│       │   ├── deal.py                ✅
│       │   ├── activity.py            ✅
│       │   └── prediction.py          ✅ (AIInsight)
│       ├── schemas/
│       │   ├── contact.py             ✅
│       │   ├── deal.py                ✅
│       │   └── insight.py             ✅
│       ├── routers/
│       │   ├── contacts.py            ✅
│       │   ├── deals.py               ✅
│       │   ├── activities.py          ✅
│       │   ├── emails.py              ✅
│       │   ├── insights.py            ✅
│       │   └── predictions.py         ✅
│       ├── services/
│       │   ├── groq_service.py        ✅
│       │   ├── churn_service.py       ✅
│       │   ├── email_service.py       ✅
│       │   └── insight_service.py     ✅
│       └── utils/
│           └── seed.py                ✅
│
└── frontend/
    ├── package.json                   ✅
    ├── vite.config.js                 ✅
    ├── tailwind.config.js             ✅
    ├── postcss.config.js              ✅
    ├── .gitignore                     ✅
    ├── .env                           ✅ (NOT committed)
    └── src/
        ├── main.jsx                   ✅
        ├── App.jsx                    ✅
        ├── index.css                  ✅
        ├── api/
        │   ├── client.js              ✅
        │   ├── deals.js               ✅
        │   └── insights.js            ✅
        ├── store/
        │   ├── dealsStore.js          ✅
        │   └── insightsStore.js       ✅
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx        ✅
        │   │   ├── Topbar.jsx         ✅
        │   │   └── Layout.jsx         ✅
        │   ├── dashboard/
        │   │   ├── KPICard.jsx        ✅
        │   │   ├── AtRiskPanel.jsx    ✅
        │   │   ├── AIInsightsFeed.jsx ✅
        │   │   ├── PipelineChart.jsx  ✅ (colored bars)
        │   │   └── WinRateChart.jsx   ✅ (donut)
        │   ├── deals/
        │   │   ├── AddDealModal.jsx   ✅
        │   │   └── AddContactModal.jsx ✅
        │   └── ai/
        │       └── EmailDraftModal.jsx ✅
        └── pages/
            ├── Dashboard.jsx          ✅
            ├── Pipeline.jsx           ✅ (kanban + search + drag)
            ├── AtRisk.jsx             ✅
            └── Contacts.jsx           ✅
```

---

## 🔑 Environment Variables

### Backend `.env` (local) + Render (production)
```env
SUPABASE_URL=https://pgggaltfcqgbpnuaplka.supabase.co
SUPABASE_KEY=sb_publishable_...
DATABASE_URL=postgresql+asyncpg://postgres.pgggaltfcqgbpnuaplka:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
GROQ_API_KEY=gsk_...
FRONTEND_URL=https://ai-sales-crm-nu.vercel.app
ENVIRONMENT=production
SECRET_KEY=...
```

### Frontend `.env` (local)
```env
VITE_API_URL=http://127.0.0.1:8000
```

### Frontend on Vercel
```env
VITE_API_URL=https://ai-sales-crm-ehv0.onrender.com
```

---

## 🐛 Gotchas (Bugs & Fixes — Never Repeat These)

| # | Bug | Fix | Discovered In |
|---|-----|-----|---------------|
| 1 | PowerShell doesn't support `&&` | Always write commands on separate lines | Setup |
| 2 | Render free tier sleeps after 15min | Ping `/api/health` on frontend app load via useEffect | Deployment |
| 3 | Supabase free DB pauses after 1 week inactive | Manually unpause before demoing | Deployment |
| 4 | `uv run python` not needed — use `uv run` only | Always prefix with `uv run`, never raw `python` | Setup |
| 5 | `.env` file was outside `backend/` folder | Move `.env` into `backend/` — same folder as `main.py` | Phase 1 |
| 6 | `pydantic[email]` not installed — `EmailStr` fails | `uv add "pydantic[email]"` | Phase 1 |
| 7 | Supabase direct connection fails on Windows (IPv6) | Use Session Pooler URL: `aws-0-ap-south-1.pooler.supabase.com` | Phase 1 |
| 8 | Password with special chars in DATABASE_URL breaks URI | Use only letters and numbers in DB password | Phase 1 |
| 9 | `SUPABASE_URL` was set to DATABASE_URL by mistake | SUPABASE_URL = `https://xxx.supabase.co` (just the project URL) | Phase 1 |
| 10 | Deal ID truncated in Swagger UI display | Always copy ID from terminal logs, not Swagger response display | Phase 2 |
| 11 | Frontend `.git` and backend `.git` caused submodule issues | Remove nested `.git` folders with `Remove-Item -Recurse -Force`, then `git rm --cached -f` | GitHub |
| 12 | Render defaults to Python 3.14 — breaks deps | Add `runtime.txt` with `3.12.0` in backend root | Deployment |
| 13 | CORS error on Vercel → Render requests | Set `allow_origins=["*"]` in FastAPI CORS middleware | Deployment |
| 14 | Render cold start takes 50+ seconds | Add health ping in `App.jsx` useEffect on mount | Deployment |
| 15 | `node_modules/` pasted into terminal instead of .gitignore | Create .gitignore in VS Code, not terminal | Phase 3 |
| 16 | Charts not rendering — Recharts needs `default=[]` on props | Add `deals = []` default to PipelineChart and WinRateChart props | Phase 3 |
| 17 | Tailwind inline `style={{ background }}` not applying | Use Tailwind class strings (`bg-indigo-50`) instead of inline style for backgrounds | Phase 3 |
| 18 | Git push rejected — remote has work not in local | Use `git push --force` for fresh portfolio repos | GitHub |
| 19 | `git commit` forgotten before `git push` | Always commit before push — `push` alone does nothing if no commit | GitHub |
| 20 | `resend` package missing from `requirements.txt` — crashes FastAPI on startup | Always run `uv pip compile pyproject.toml -o requirements.txt` after `uv add <package>` | Deployment |
| 21 | `import resend` at module level — missing package kills entire app, not just that route | Add packages to requirements before pushing any new import | Deployment |
| 22 | Kanban topbar scrolls away with columns — `overflow-x-auto` on same container as header | Give topbar its own `shrink-0` div, put only kanban in the scrollable container | Phase 3 |
| 23 | Per-column `overflow-y-auto` creates ugly individual scrollbars on each kanban column | Remove per-column overflow, let entire board scroll as one unit | Phase 3 |
| 24 | `ml-auto` on buttons pushes Add Deal + Refresh off-screen on normal viewport | Remove `ml-auto`, place buttons directly after search with `ml-6` gap | Phase 3 |
| 25 | Screenshots not rendering in README — folder not committed to git | `git add frontend/Screenshots/` explicitly before push | Deployment |
| 26 | GitHub README image paths are case-sensitive — `Screenshots` vs `screenshots` breaks on Linux | Match exact folder casing, URL-encode spaces as `%20` and `&` as `%26` | Deployment |
---

## 📝 Key Decisions Made

| Decision | Reason |
|----------|--------|
| Groq over OpenAI | Free tier, faster inference |
| Supabase over raw Postgres | Free hosted DB + auth built-in |
| Render over Railway | More generous free tier |
| SQLAlchemy async | Non-blocking DB calls for FastAPI |
| Zustand over Redux | Simpler, less boilerplate |
| Session Pooler over Direct connection | Direct connection uses IPv6 which fails on Windows |
| `allow_origins=["*"]` for CORS | Portfolio demo — no auth, no sensitive user data |
| Recharts over Chart.js | Better React integration, declarative API |
| Gradient purple sidebar | Distinctive visual style — stands out from typical dark dashboards |
| Colored KPI cards | Indigo/green/red/yellow — each metric has semantic color |
| Kanban board for Pipeline | Industry-standard CRM pattern, drag-to-move is impressive in demos |
| Seed script with Faker | Realistic demo data — 50 contacts, 120 deals, ~400 activities |

---

## 🎯 What This Project Demonstrates (For Interviews)

> "I built an AI-powered Sales CRM from scratch — FastAPI backend with async SQLAlchemy connecting to Supabase PostgreSQL, a Groq LLaMA 3 integration for churn prediction and email drafting, and a React frontend with a kanban pipeline, real-time charts, and an AI insights feed. It's fully deployed — backend on Render, frontend on Vercel, database on Supabase — all on free tiers."

**Key concepts demonstrated:**
- Full-stack ownership — backend, frontend, database, deployment
- AI/LLM integration — Groq API with structured prompts, temperature control
- Async Python — FastAPI + async SQLAlchemy
- Modern React — Zustand, React Router, custom hooks, drag-and-drop
- Data visualization — Recharts bar + donut charts
- Production deployment — Render + Vercel + Supabase
- Database design — normalized schema, foreign keys, UUID primary keys
- API design — REST, `{ data, error, meta }` envelope pattern
- Clean architecture — separation of concerns (models/schemas/routers/services)

---

## 🚀 Demo Script (For Interviewers)

1. Open `https://ai-sales-crm-nu.vercel.app`
   - Note: first load may take 30-50 seconds (Render free tier cold start)
2. **Dashboard** → Show KPIs: $7.3M pipeline, 45% win rate, 16 at-risk deals
3. **Pipeline by Stage chart** → colored bars showing deal distribution
4. **Deal Outcomes donut** → 45% win rate visualization
5. **At-Risk panel** → 16 deals flagged by AI churn scoring
6. Click **"Draft Follow-up"** on any at-risk deal → Groq generates email in ~1 second
7. Switch tone to "Urgent" → new email drafted instantly
8. Click **"Analyze Pipeline"** in AI Insights → Groq surfaces top risks + opportunities
9. **Pipeline page** → Kanban board, drag a deal to a new stage
10. Search for a company name — kanban filters in real time
11. Click **"Add Deal"** → fill form → deal appears in kanban instantly
12. **Contacts page** → 50 contacts, search works instantly
13. **At Risk page** → full list of high-risk deals

**Key talking point:** *"This replaces what a sales ops analyst would spend 2 hours doing every morning — pipeline review, risk flagging, and follow-up drafting — all in one AI-powered dashboard."*

---

## ⏭️ Remaining Tasks

- [x] Remove debug line `Deals loaded: {deals.length}` from Dashboard.jsx
- [x] Fixed pipeline topbar — locked in place, only kanban scrolls
- [x] Fixed per-column scrollbars — whole board scrolls as one
- [x] Moved Add Deal + Refresh buttons next to search bar
- [x] Added resend package to requirements.txt — fixed Render deploy crash
- [x] Added screenshots to README.md
- [x] Added Gotchas section to PROGRESS.md
- [x] Commit and push Screenshots folder to GitHub
- [x] Add Settings page (currently 404)
- [x] Test real email sending end-to-end (Resend is wired up — verify send works)
- [x] Final PROGRESS.md update + push everything

---

## 💬 How to Use This File in a New Claude Chat

1. Open a new chat in the **AI Sales CRM Assistant** Claude Project
2. Paste this entire file as your first message
3. Say: **"Continue from where we left off. Next action: [paste Next action above]"**
4. Claude will pick up exactly where you stopped

---

*Last updated: July 23, 2026 — PROJECT COMPLETE ✅*
