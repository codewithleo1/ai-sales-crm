# 🤖 AI Sales CRM Assistant

> An AI-powered CRM that analyzes your sales pipeline, predicts churn, drafts personalized follow-up emails, and delivers them — powered by Groq LLaMA 3.

**[Live Demo](https://ai-sales-crm-nu.vercel.app)** · **[API Docs](https://ai-sales-crm-ehv0.onrender.com/docs)**

> ⚠️ First load may take 30–50 seconds (Render free tier cold start)

---

## 📸 Screenshots

| Dashboard | Pipeline |
|-----------|----------|
| ![Dashboard](Screenshots/01_Dashboard.png) | ![Pipeline](Screenshots/02_Sales%20Deal%20Pipelines.png) |

| At Risk | AI Insights |
|---------|-------------|
| ![At Risk](Screenshots/03_Risk%20Prediction.png) | ![AI Insights](Screenshots/04_AI%20Insights%20on%20Deals.png) |

![Email Generation](Screenshots/05_Email%20Generation%20%26%20Send%20%26%20Received.png)

---

---

## ✨ Features

- **📊 Pipeline Dashboard** — $7.3M pipeline visualized with KPI cards, stage bar charts, and win rate donut chart
- **🚨 AI Churn Prediction** — Rule-based scoring + Groq LLaMA 3 explains WHY each deal is at risk in plain English
- **✉️ AI Email Drafting** — One-click Groq-powered follow-up emails in 3 tones (Professional, Urgent, Friendly)
- **📬 Real Email Delivery** — Send AI-drafted emails directly to contacts via Resend
- **💡 Pipeline Insights** — Groq analyzes all active deals and surfaces top risks + opportunities
- **🗂️ Kanban Pipeline** — Drag deals between stages, search in real time
- **👥 Contact Management** — 50 contacts with search, add new contacts from UI
- **➕ Add Deals from UI** — Full deal creation form without touching the API

---

## 🏗️ Architecture

```
Frontend (React + Vite)          Backend (FastAPI + Python)
┌─────────────────────┐          ┌─────────────────────────────┐
│  Dashboard          │  REST    │  /api/deals                 │
│  Pipeline Kanban    │◄────────►│  /api/predictions/churn     │
│  AI Insights Feed   │          │  /api/emails/draft          │
│  At-Risk Panel      │          │  /api/emails/send           │
│  Contacts Grid      │          │  /api/insights/generate     │
└─────────────────────┘          └──────────┬──────────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │   Supabase (PostgreSQL)     │
                              │   + Groq LLM API            │
                              │   + Resend Email API        │
                              └────────────────────────────┘

Deployment:
  Frontend → Vercel
  Backend  → Render (free tier)
  Database → Supabase (free tier, PostgreSQL)
```

---

## 🛠️ Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | React 18 + Vite | Fast, modern, portfolio-standard |
| Styling | Tailwind CSS | Clean utility-first styling |
| Charts | Recharts | Declarative React charts |
| State | Zustand | Lightweight, no boilerplate |
| Backend | FastAPI (Python) | Async, auto-docs, industry standard |
| AI/LLM | Groq API (llama-3.1-8b-instant) | Free tier, blazing fast inference |
| Database | Supabase (PostgreSQL) | Free hosted Postgres |
| Email | Resend | Free tier email delivery |
| Deployment FE | Vercel | Free, instant CI/CD |
| Deployment BE | Render | Free tier web service |

---

## 🤖 AI Features (Groq + llama-3.1-8b-instant)

### 1. Churn Prediction Engine
Rule-based scoring combined with LLM explanation:
- Days since last activity (>14 days = high risk)
- Days stuck in same stage (>21 days = warning)
- Deal probability patterns
- Groq explains WHY the deal is at risk in plain English

### 2. Follow-up Email Drafter + Sender
```
POST /api/emails/draft  →  Groq drafts personalized email
POST /api/emails/send   →  Groq drafts + Resend delivers to inbox
Body: { deal_id, tone: "professional" | "urgent" | "friendly" }
```

### 3. Pipeline Insights Feed
AI summary of:
- Top 3 deals most likely to be lost and why
- Top 3 deals most likely to close soon
- One immediate action the team should take today

### 4. At-Risk Account Surfacing
Automatically flags deals with `churn_score > 0.7` with one-click email draft and send.

---

## 📁 Project Structure

```
ai-sales-crm/
├── backend/                        # FastAPI app
│   ├── main.py                     # App entry point + CORS
│   ├── requirements.txt            # Python dependencies
│   ├── Procfile                    # Render deployment
│   ├── runtime.txt                 # Python 3.12 pin
│   └── app/
│       ├── config.py               # Pydantic settings
│       ├── database.py             # Async SQLAlchemy engine
│       ├── models/                 # ORM models (Deal, Contact, Activity, AIInsight)
│       ├── schemas/                # Pydantic request/response schemas
│       ├── routers/                # API endpoints
│       │   ├── deals.py            # CRUD for deals
│       │   ├── contacts.py         # CRUD for contacts
│       │   ├── emails.py           # Draft + send emails
│       │   ├── insights.py         # AI pipeline analysis
│       │   └── predictions.py      # Churn scoring
│       ├── services/
│       │   ├── groq_service.py     # Groq LLM wrapper
│       │   ├── churn_service.py    # Churn scoring + explanation
│       │   ├── email_service.py    # Email draft generation
│       │   ├── insight_service.py  # Pipeline insights
│       │   └── resend_service.py   # Real email delivery
│       └── utils/
│           └── seed.py             # 50 contacts, 120 deals, ~400 activities
│
└── frontend/                       # React + Vite app
    └── src/
        ├── api/                    # Axios client + endpoint functions
        ├── store/                  # Zustand state (deals, insights)
        ├── components/
        │   ├── layout/             # Sidebar, Topbar, Layout
        │   ├── dashboard/          # KPICard, PipelineChart, WinRateChart, AtRiskPanel, AIInsightsFeed
        │   ├── deals/              # AddDealModal, AddContactModal
        │   └── ai/                 # EmailDraftModal (draft + send)
        └── pages/                  # Dashboard, Pipeline, AtRisk, Contacts
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company TEXT, title TEXT, phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  contact_id TEXT REFERENCES contacts(id),
  stage TEXT,           -- prospecting → qualification → proposal → negotiation → closed_won/lost
  value NUMERIC(12,2),
  probability INTEGER,  -- 0–100
  churn_score NUMERIC(3,2) DEFAULT 0.0,  -- 0.0–1.0, >0.7 = at-risk
  days_in_stage INTEGER,
  last_activity_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id),
  contact_id TEXT REFERENCES contacts(id),
  type TEXT,  -- email, call, meeting, note, demo
  description TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_insights (
  id TEXT PRIMARY KEY,
  deal_id TEXT REFERENCES deals(id),
  type TEXT,  -- churn_risk, follow_up, opportunity, warning
  content TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  dismissed BOOLEAN DEFAULT false
);
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.12+ with `uv`
- Node.js 18+
- Supabase account (free)
- Groq API key (free)
- Resend API key (free)

### Backend

```bash
cd backend
uv init
uv python pin 3.12
uv add fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg groq python-dotenv "pydantic[email]" pydantic-settings httpx faker ruff resend
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_publishable_key
DATABASE_URL=postgresql+asyncpg://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres
GROQ_API_KEY=gsk_...
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
SECRET_KEY=your-secret-key
```

Run the SQL schema in Supabase SQL editor (see `database schema` section above), then:

```bash
# Seed demo data
uv run python -m app.utils.seed

# Start server
uv run uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Open `http://localhost:5173`

---

## 🌐 Deployment

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Supabase | PostgreSQL database | 500MB, 2GB bandwidth |
| Render | FastAPI backend | 750 hrs/month |
| Vercel | React frontend | 100GB bandwidth |
| Groq | LLM inference | 14,400 req/day |
| Resend | Email delivery | 100 emails/day |

**Backend (Render):**
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add all env vars from `.env`

**Frontend (Vercel):**
- Root directory: `frontend`
- Framework: Vite
- Add `VITE_API_URL=https://your-backend.onrender.com`

---

## 🎯 Demo Script

1. **Dashboard** → $7.3M pipeline, 45% win rate, 16 at-risk deals
2. **Pipeline chart** → colored bars by stage, donut win rate chart
3. **At-Risk panel** → deals flagged by AI churn scoring
4. **Click "Draft Follow-up"** → Groq generates personalized email in ~1 second
5. **Switch tone** to "Urgent" → new email instantly
6. **Enter email + click "Send Email"** → email arrives in inbox via Resend
7. **Click "Analyze Pipeline"** → Groq surfaces top risks + opportunities by deal name
8. **Pipeline page** → Kanban board, drag deal to new stage
9. **Search deals** → filters kanban in real time
10. **Add Deal** → create from UI, appears in kanban instantly
11. **Contacts page** → 50 contacts, search, add new

**Key talking point:** *"This replaces what a sales ops analyst would spend 2 hours doing every morning — pipeline review, risk flagging, follow-up drafting, and email delivery — all in one AI-powered dashboard."*

---

## 📋 API Endpoints

```
GET    /api/deals                  # All deals with churn scores
POST   /api/deals                  # Create deal
PATCH  /api/deals/{id}             # Update deal
DELETE /api/deals/{id}             # Delete deal

GET    /api/contacts               # All contacts
POST   /api/contacts               # Create contact

POST   /api/emails/draft           # Draft follow-up email (Groq)
POST   /api/emails/send            # Draft + send email (Groq + Resend)

GET    /api/insights               # Latest AI insights
POST   /api/insights/generate      # Trigger fresh pipeline analysis

GET    /api/predictions/churn      # Deals sorted by churn score
POST   /api/predictions/refresh    # Recalculate all churn scores

GET    /api/health                 # Health check
```

---

## 💡 Key Engineering Decisions

- **Groq over OpenAI** — Free tier, 10x faster inference via LPU hardware
- **Async SQLAlchemy** — Non-blocking DB calls for FastAPI concurrency
- **Zustand over Redux** — 80% less boilerplate, same power
- **Session Pooler for Supabase** — Direct connection fails on IPv4 networks
- **Rule-based churn + LLM explanation** — Fast scoring, human-readable output
- **Resend for email** — Free tier, reliable delivery, simple API

---

*Built for GitHub portfolio — industry-grade, end-to-end, production deployed.*