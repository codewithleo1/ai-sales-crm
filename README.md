# 🤖 Northwind — AI Sales CRM

> A production-grade, multi-tenant AI Sales CRM with churn prediction, autonomous email agents, drag-and-drop pipeline, team management, and subscription billing — powered by Groq Qwen3.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-6366f1?style=for-the-badge&logo=vercel)](https://ai-sales-crm-nu.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://ai-sales-crm-ehv0.onrender.com/docs)

> ⚠️ First load may take 30–50 seconds (Render free tier cold start)
>
> **Demo account:** `demo@aisalescrm.com` / `Demo1234!`

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

## ✨ Features

- **📊 Pipeline Dashboard** — KPI cards (ARR, open pipeline, win rate, at-risk count), stage bar chart, deal outcomes donut
- **🗂️ Kanban Pipeline** — Drag deals across 6 stages, lead score badges, real-time search
- **🚨 AI Churn Prediction** — Rule-based scoring + Qwen3 explains WHY each deal is at risk in plain English
- **🤖 Agentic AI System** — Human-in-the-loop agent scans at-risk deals, acts autonomously on low-risk deals, queues high-value deals for human approval
- **💬 AI Sales Assistant** — Chat with Qwen3 about your live pipeline — risks, priorities, what to chase today
- **✉️ AI Email Drafting** — One-click follow-ups in 3 tones (Professional, Persuasive, Casual) + real delivery via Resend
- **📧 Email Sequences** — Multi-step AI cadences: 3-step drip campaigns auto-drafted per deal, send on approval
- **💡 Pipeline Insights** — Qwen3 surfaces top risks + opportunities across all active deals
- **👥 Contact Management** — Paginated contacts with search, add from UI
- **🧑‍🤝‍🧑 Team Management** — Invite members, assign roles (Owner / Admin / Member / Viewer), revoke access
- **💳 Subscription Billing** — Free / Pro / Enterprise plans with Razorpay checkout, usage meters (seats, AI credits, deals)
- **🔐 Multi-tenant Auth** — JWT Bearer token auth, per-org data isolation, workspace switcher

---

## 🏗️ Architecture

```
Frontend (React + Vite)              Backend (FastAPI + Python)
┌──────────────────────┐             ┌──────────────────────────────────┐
│  Dashboard           │   REST/JWT  │  /api/auth      — login, register │
│  Pipeline Kanban     │◄───────────►│  /api/deals     — CRUD + scoring  │
│  AI Assistant Chat   │             │  /api/ai        — Qwen3 endpoints  │
│  Agent Inbox         │             │  /api/agent     — autonomous agent │
│  Email Sequences     │             │  /api/sequences — email cadences   │
│  Team Management     │             │  /api/team      — members + roles  │
│  Billing & Plans     │             │  /api/billing   — Razorpay + plans │
└──────────────────────┘             └──────────────┬───────────────────┘
                                                    │
                                     ┌──────────────▼──────────────┐
                                     │   MongoDB Atlas              │
                                     │   + Groq API (Qwen3)        │
                                     │   + Resend Email API        │
                                     │   + Razorpay Payments       │
                                     └─────────────────────────────┘

Deployment:
  Frontend → Vercel
  Backend  → Render (free tier)
  Database → MongoDB Atlas (free tier)
```

---

## 🛠️ Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | React 18 + Vite | Fast, modern, portfolio-standard |
| Styling | Tailwind CSS | Utility-first, dark mode |
| Charts | Recharts | Declarative React charts |
| Drag & Drop | @dnd-kit | Accessible, headless DnD |
| Notifications | Sonner | Beautiful toast system |
| Backend | FastAPI (Python 3.12) | Async, auto-docs, industry standard |
| AI/LLM | Groq API (Qwen3) | Free tier, blazing fast inference |
| Database | MongoDB Atlas (Motor async) | Flexible schema, free tier |
| Auth | JWT Bearer tokens | Cross-domain compatible |
| Email | Resend | Free tier email delivery |
| Payments | Razorpay | Test mode checkout |
| Deploy FE | Vercel | Free, instant CI/CD |
| Deploy BE | Render | Free tier web service |

---

## 🤖 AI Features (Groq + Qwen3)

### 1. Churn Prediction Engine
Rule-based scoring + LLM explanation:
- Days since last activity (>14 days = high risk)
- Days stuck in current stage (>21 days = warning)
- Win probability decay patterns
- Qwen3 explains WHY the deal is at risk in plain English

### 2. Agentic AI System (Human-in-the-Loop)
```
Decision boundary:
  lead/contacted + value < $50k  → agent acts autonomously (drafts + sends)
  proposal OR value ≥ $50k       → agent prepares draft, human approves
  negotiation/closed             → agent observes only, no action

POST /api/agent/run              → trigger agent scan
GET  /api/agent/inbox            → pending approvals + recent actions
POST /api/agent/approve/{id}     → human approves → email sent
POST /api/agent/reject/{id}      → human rejects → action discarded
```

### 3. AI Sales Assistant
Chat interface powered by Qwen3 with access to live pipeline context. Ask anything: "Which deals are most at risk this week?" or "What should I prioritize today?"

### 4. Follow-up Email Drafter + Sender
```
POST /api/ai/email/draft   → Qwen3 drafts personalized email
POST /api/ai/email/send    → draft + deliver via Resend
Tones: professional | persuasive | casual
```

### 5. Email Sequences (Multi-step Cadences)
AI builds a 3-step drip campaign per deal: Day 1 / Day 3 / Day 7. Each step auto-drafted by Qwen3, sent on manual approval.

### 6. Pipeline Insights Feed
Qwen3 analyzes all active deals and surfaces:
- Top 3 deals most likely to be lost and why
- Top 3 deals most likely to close soon
- One immediate action the team should take today

---

## 📁 Project Structure

```
ai-sales-crm/
├── backend/
│   ├── server.py                   # FastAPI app entry point + CORS + lifespan
│   ├── auth.py                     # JWT auth, login, register, get_current_user
│   ├── database.py                 # MongoDB Motor async client + indexes
│   ├── agent.py                    # Agentic AI decision engine (HITL boundary)
│   ├── ai.py                       # Groq Qwen3 wrapper — churn, email, insights, chat
│   ├── email_service.py            # Resend async email delivery
│   ├── seed.py                     # Demo data seeder
│   ├── requirements.txt
│   ├── Procfile
│   └── routers/
│       ├── agent.py                # /api/agent — inbox, run, approve, reject
│       ├── deals.py                # /api/deals — CRUD, churn scoring, at-risk
│       ├── contacts.py             # /api/contacts — CRUD + search + pagination
│       ├── dashboard.py            # /api/dashboard/stats
│       ├── assistant.py            # /api/ai/assistant — chat + suggestions
│       ├── sequences.py            # /api/sequences — email cadences
│       ├── team.py                 # /api/team — members, roles, invite
│       └── billing.py              # /api/billing — plans, usage, Razorpay
│
└── frontend/
    └── src/
        ├── App.js                  # React Router — all routes
        ├── context/AuthContext.js  # JWT auth state + login/register/logout
        ├── lib/api.js              # Axios instance + Bearer token interceptor
        ├── components/
        │   ├── Layout.js           # Sidebar + topbar + outlet
        │   ├── ui.js               # Badge, Button, Card, Avatar, Modal, Input
        │   ├── EmailDraftModal.js  # AI email drafter (3 tones + send)
        │   ├── AddDealModal.js
        │   └── AddContactModal.js
        └── pages/
            ├── Dashboard.js        # KPIs + charts + at-risk + insights
            ├── Pipeline.js         # Kanban drag-and-drop
            ├── AgentInbox.js       # HITL agent inbox — approve/reject
            ├── Assistant.js        # AI chat interface
            ├── Sequences.js        # Email cadence builder
            ├── AtRisk.js           # At-risk deals + explain + recover
            ├── Contacts.js         # Contact grid + search + pagination
            ├── Team.js             # Team members + roles + invite
            ├── Billing.js          # Plans + usage + Razorpay checkout
            ├── Settings.js         # Profile + workspace info
            ├── Login.js
            └── Register.js
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.12+ with `uv`
- Node.js 18+
- MongoDB Atlas account (free)
- Groq API key (free)
- Resend API key (free)

### Backend

```bash
cd backend
uv venv && uv pip install -r requirements.txt
```

Create `backend/.env`:
```env
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/
DB_NAME=ai_sales_crm
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_...
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

```bash
# Start server
uv run uvicorn server:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

```bash
npm start
```

Open `http://localhost:3000`

---

## 🌐 Deployment

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| MongoDB Atlas | Database | 512MB storage |
| Render | FastAPI backend | 750 hrs/month |
| Vercel | React frontend | 100GB bandwidth |
| Groq | LLM inference | 14,400 req/day |
| Resend | Email delivery | 100 emails/day |
| Razorpay | Payments | Test mode unlimited |

**Backend (Render):**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Env vars: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `GROQ_API_KEY`, `RESEND_API_KEY`, `FRONTEND_URL`, `PYTHON_VERSION=3.12.0`

**Frontend (Vercel):**
- Framework: Create React App
- Env var: `REACT_APP_BACKEND_URL=https://your-backend.onrender.com`

---

## 🎯 Demo Script

1. **Login** → `demo@aisalescrm.com / Demo1234!`
2. **Dashboard** → KPIs, pipeline chart, deal outcomes donut, at-risk panel, AI insights
3. **Click "Draft"** on any at-risk deal → Qwen3 generates personalized email in ~1 second
4. **Click "Analyze"** → Qwen3 surfaces top risks + opportunities across the pipeline
5. **Pipeline** → Kanban board, drag a deal to a new stage, search in real time
6. **AI Assistant** → Chat: *"Which deals should I prioritize today?"*
7. **Agent Inbox** → Click "Run Agent" → see autonomous actions + pending approvals
8. **Approve** a pending email → delivered via Resend
9. **Sequences** → Create a 3-step drip cadence for a stalled deal
10. **Team** → Invite a member, assign a role
11. **Billing** → Switch plans, see usage meters, Razorpay checkout (test mode)

**Key talking point:** *"This is a production SaaS — multi-tenant auth, subscription billing, an autonomous AI agent with human-in-the-loop controls, and a full sales workflow. Every feature a real CRM needs, built end-to-end from scratch."*

---

## 📋 API Endpoints

```
# Auth
POST   /api/auth/register          # Create workspace + owner account
POST   /api/auth/login             # Login → JWT token
GET    /api/auth/me                # Current user + org

# Deals
GET    /api/deals                  # All deals (paginated, search)
POST   /api/deals                  # Create deal
PATCH  /api/deals/{id}             # Update deal / move stage
DELETE /api/deals/{id}             # Delete deal
GET    /api/deals/at-risk          # Deals with churn_score ≥ 0.7
POST   /api/deals/refresh-scores   # Recalculate all churn scores
POST   /api/deals/{id}/explain     # Qwen3 explains churn risk

# AI
POST   /api/ai/email/draft         # Draft follow-up email
POST   /api/ai/email/send          # Draft + send via Resend
GET    /api/ai/insights            # Latest pipeline insights
POST   /api/ai/insights/generate   # Trigger fresh analysis
POST   /api/ai/assistant/chat      # Chat with AI assistant
GET    /api/ai/assistant/suggestions # Suggested prompts

# Agent
POST   /api/agent/run              # Trigger autonomous agent scan
GET    /api/agent/inbox            # Pending approvals + recent actions
POST   /api/agent/approve/{id}     # Approve → send email
POST   /api/agent/reject/{id}      # Reject action

# Sequences
GET    /api/sequences              # All email cadences
POST   /api/sequences              # Create 3-step cadence for a deal
POST   /api/sequences/{id}/steps/{n}/draft  # AI draft one step
POST   /api/sequences/{id}/steps/{n}/send   # Mark step as sent
DELETE /api/sequences/{id}         # Delete sequence

# Team
GET    /api/team/members           # All workspace members
POST   /api/team/invite            # Invite new member
PATCH  /api/team/members/{id}      # Change role
DELETE /api/team/members/{id}      # Remove member

# Billing
GET    /api/billing/plans          # Available plans + pricing
GET    /api/billing/usage          # Current usage vs limits
POST   /api/billing/upgrade        # Switch plan (free downgrade)
POST   /api/billing/razorpay/order # Create Razorpay order
POST   /api/billing/razorpay/verify # Verify payment + upgrade

# Dashboard
GET    /api/dashboard/stats        # ARR, pipeline, win rate, at-risk count
GET    /api/contacts               # Contacts (paginated + search)
POST   /api/contacts               # Create contact
DELETE /api/contacts/{id}          # Delete contact
```

---

## 💡 Key Engineering Decisions

- **MongoDB over PostgreSQL** — Flexible schema fits evolving CRM data; Motor async driver for FastAPI concurrency
- **JWT Bearer tokens over cookies** — Cross-domain cookies blocked between Vercel and Render; Bearer header works everywhere
- **Groq Qwen3 over OpenAI** — Free tier, LPU hardware = 10x faster inference
- **Human-in-the-loop agent boundary** — Value + stage determine autonomy; high-value deals always need human sign-off
- **Razorpay in test mode** — Full payment flow without real charges; swap key for production
- **PYTHON_VERSION env var over runtime.txt** — Render only respects env var for Python version pinning
- **Sonner for toasts** — Better DX than react-hot-toast, native dark mode support

---

## 🎯 What This Demonstrates (For Interviews)

- **Full-stack SaaS ownership** — auth, billing, team management, AI, deployment
- **Agentic AI design** — human-in-the-loop boundary rules, autonomous vs approval vs observe
- **Multi-tenancy** — per-org data isolation, role-based access control
- **LLM integration** — structured prompts, temperature control, streaming-ready
- **Async Python** — FastAPI + Motor (async MongoDB) for non-blocking concurrency
- **Modern React** — Context API, React Router v6, custom hooks, drag-and-drop
- **Payment integration** — Razorpay order creation + signature verification
- **Production deployment** — 3 free-tier services, CI/CD via GitHub → Vercel/Render

---

*Built for GitHub portfolio — production-grade, end-to-end, fully deployed.*