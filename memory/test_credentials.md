# Test Credentials — AI Sales CRM

## Demo / Admin (seeded on startup)
- **Email:** demo@aisalescrm.com
- **Password:** Demo1234!
- **Role:** owner
- **Workspace:** Northwind Sales Co (plan: pro)

## Seeded team members (same password: Demo1234!)
- jordan@aisalescrm.com — admin
- sam@aisalescrm.com — member
- riley@aisalescrm.com — viewer

## Auth endpoints (all under /api)
- POST /api/auth/register  { name, email, password, org_name }
- POST /api/auth/login     { email, password }
- POST /api/auth/logout
- GET  /api/auth/me

Auth uses httpOnly cookies (access_token 12h, refresh_token 7d). Frontend sends credentials with every request (withCredentials).

## Notes
- Data is multi-tenant: every deal/contact/insight is scoped by org_id.
- AI features use Groq (model: qwen/qwen3.6-27b) via GROQ_API_KEY in backend/.env.
