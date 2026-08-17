"""Seed a demo organization with a rich pipeline so the app looks alive on first login."""
import random
import uuid
from datetime import date, datetime, timezone, timedelta

from faker import Faker
from database import get_db
from auth import hash_password
from ai import calculate_churn_score, calculate_lead_score

fake = Faker()

STAGES = ["lead", "contacted", "proposal", "negotiation", "closed_won", "closed_lost"]
STAGE_WEIGHTS = [22, 24, 20, 14, 12, 8]
TITLES = ["VP of Sales", "Head of Engineering", "CTO", "CEO", "CFO", "Director of Operations",
          "Product Manager", "Procurement Manager", "IT Director", "COO", "Chief Revenue Officer"]
DEAL_TEMPLATES = ["Enterprise License", "Platform Subscription", "Professional Services",
                  "SaaS Implementation", "Annual Support Contract", "Cloud Migration",
                  "Data Analytics Suite", "Security Audit", "API Integration", "Custom Development"]


def _iso(d: date) -> str:
    return d.isoformat()


async def seed_demo():
    db = get_db()
    admin_email = "demo@aisalescrm.com"
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        return  # already seeded

    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.organizations.insert_one({
        "id": org_id, "name": "Northwind Sales Co", "plan": "pro",
        "ai_credits_used": 12, "created_at": now})

    owner_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": owner_id, "email": admin_email, "password_hash": hash_password("Demo1234!"),
        "name": "Alex Rivera", "org_id": org_id, "role": "owner", "created_at": now})

    for name, mail, role in [("Jordan Blake", "jordan@aisalescrm.com", "admin"),
                             ("Sam Carter", "sam@aisalescrm.com", "member"),
                             ("Riley Woods", "riley@aisalescrm.com", "viewer")]:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": mail, "password_hash": hash_password("Demo1234!"),
            "name": name, "org_id": org_id, "role": role, "created_at": now})

    contacts = []
    for _ in range(40):
        c = {"id": str(uuid.uuid4()), "org_id": org_id, "name": fake.name(),
             "email": fake.unique.email(), "company": fake.company(),
             "title": random.choice(TITLES), "phone": fake.phone_number()[:20],
             "created_at": now}
        contacts.append(c)
    await db.contacts.insert_many(contacts)

    members = [owner_id]
    deals = []
    for _ in range(70):
        contact = random.choice(contacts)
        stage = random.choices(STAGES, weights=STAGE_WEIGHTS)[0]
        if stage in ("lead", "contacted"):
            value, prob = random.randint(5000, 50000), random.randint(10, 40)
        elif stage in ("proposal", "negotiation"):
            value, prob = random.randint(20000, 150000), random.randint(40, 75)
        elif stage == "closed_won":
            value, prob = random.randint(10000, 200000), 100
        else:
            value, prob = random.randint(5000, 100000), 0
        last_activity = date.today() - timedelta(days=random.randint(0, 40))
        deal = {"id": str(uuid.uuid4()), "org_id": org_id, "owner_id": random.choice(members),
                "title": f"{contact['company']} — {random.choice(DEAL_TEMPLATES)}",
                "contact_id": contact["id"], "stage": stage, "value": value, "probability": prob,
                "expected_close_date": _iso(date.today() + timedelta(days=random.randint(7, 120))),
                "last_activity_date": _iso(last_activity),
                "days_in_stage": random.randint(0, 45),
                "notes": fake.sentence() if random.random() > 0.4 else None,
                "created_at": now, "updated_at": now}
        deal["churn_score"] = calculate_churn_score(deal)
        deal["lead_score"] = calculate_lead_score(deal)
        deals.append(deal)
    await db.deals.insert_many(deals)
