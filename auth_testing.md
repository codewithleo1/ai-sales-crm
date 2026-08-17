# Auth Testing Playbook — AI Sales CRM

JWT email/password auth with httpOnly cookies on FastAPI + MongoDB.

## Step 1: MongoDB verification
```
mongosh
use ai_sales_crm
db.users.find({role: "owner"}).pretty()
db.users.findOne({email: "demo@aisalescrm.com"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`; unique index on users.email and users.id.

## Step 2: API testing (local)
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@aisalescrm.com","password":"Demo1234!"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns the user + organization and sets access_token + refresh_token cookies.

## Tenant isolation
Register a second workspace, confirm it sees ZERO deals/contacts from the demo org.

## AI endpoints (require Groq key, already set)
- POST /api/ai/email/draft { deal_id, tone }
- POST /api/ai/insights/generate
- POST /api/deals/{id}/explain
