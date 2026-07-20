"""
Seed script — populates the database with realistic demo data.
Run with: uv run python -m app.utils.seed
Creates 50 contacts and 120 deals across all pipeline stages.
"""

import asyncio
import random
from datetime import date, timedelta

from faker import Faker
from sqlalchemy import text

from app.database import AsyncSessionLocal
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.activity import Activity

fake = Faker()

STAGES = [
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
]

STAGE_WEIGHTS = [20, 25, 20, 15, 12, 8]

TITLES = [
    "VP of Sales", "Head of Engineering", "CTO", "CEO", "CFO",
    "Director of Operations", "Product Manager", "Procurement Manager",
    "IT Director", "COO", "Chief Revenue Officer", "VP of Marketing",
]

DEAL_TEMPLATES = [
    "Enterprise License", "Platform Subscription", "Professional Services",
    "SaaS Implementation", "Annual Support Contract", "Cloud Migration",
    "Data Analytics Suite", "Security Audit", "API Integration",
    "Custom Development", "Training Package", "Consulting Retainer",
]

ACTIVITY_TYPES = ["email", "call", "meeting", "note", "demo"]


def random_date_within(days_back: int) -> date:
    """Return a random date within the last N days."""
    return date.today() - timedelta(days=random.randint(0, days_back))


def calculate_churn_score(
    days_inactive: int,
    days_in_stage: int,
    probability: int,
) -> float:
    """Mirror the churn scoring logic from churn_service.py."""
    score = 0.0
    if days_inactive > 30:
        score += 0.4
    elif days_inactive > 14:
        score += 0.2
    elif days_inactive > 7:
        score += 0.1

    if days_in_stage > 30:
        score += 0.4
    elif days_in_stage > 21:
        score += 0.25
    elif days_in_stage > 14:
        score += 0.1

    if probability < 20:
        score += 0.2
    elif probability < 30:
        score += 0.1

    return round(min(score, 1.0), 2)


async def seed():
    """Main seed function — creates contacts, deals, and activities."""
    async with AsyncSessionLocal() as db:
        print("🌱 Starting seed...")

        # Clear existing data
        await db.execute(text("DELETE FROM ai_insights"))
        await db.execute(text("DELETE FROM activities"))
        await db.execute(text("DELETE FROM deals"))
        await db.execute(text("DELETE FROM contacts"))
        await db.commit()
        print("🧹 Cleared existing data")

        # Create 50 contacts
        contacts = []
        for _ in range(50):
            contact = Contact(
                name=fake.name(),
                email=fake.unique.email(),
                company=fake.company(),
                title=random.choice(TITLES),
                phone=fake.phone_number()[:20],
            )
            db.add(contact)
            contacts.append(contact)

        await db.flush()
        print(f"👥 Created {len(contacts)} contacts")

        # Create 120 deals
        deals = []
        for _ in range(120):
            contact = random.choice(contacts)
            stage = random.choices(STAGES, weights=STAGE_WEIGHTS)[0]

            # Realistic values per stage
            if stage in ["prospecting", "qualification"]:
                value = random.randint(5000, 50000)
                probability = random.randint(10, 40)
            elif stage in ["proposal", "negotiation"]:
                value = random.randint(20000, 150000)
                probability = random.randint(40, 75)
            elif stage == "closed_won":
                value = random.randint(10000, 200000)
                probability = 100
            else:
                value = random.randint(5000, 100000)
                probability = 0

            days_in_stage = random.randint(0, 45)
            last_activity_date = random_date_within(40)
            days_inactive = (date.today() - last_activity_date).days

            churn_score = calculate_churn_score(
                days_inactive, days_in_stage, probability
            )

            # Override churn for closed deals
            if stage in ["closed_won", "closed_lost"]:
                churn_score = 0.0

            deal = Deal(
                title=f"{contact.company} — {random.choice(DEAL_TEMPLATES)}",
                contact_id=contact.id,
                stage=stage,
                value=value,
                probability=probability,
                expected_close_date=date.today() + timedelta(days=random.randint(7, 120)),
                last_activity_date=last_activity_date,
                days_in_stage=days_in_stage,
                churn_score=churn_score,
                notes=fake.sentence() if random.random() > 0.3 else None,
            )
            db.add(deal)
            deals.append(deal)

        await db.flush()
        print(f"💼 Created {len(deals)} deals")

        # Create 2-5 activities per deal
        activity_count = 0
        for deal in deals:
            for _ in range(random.randint(2, 5)):
                activity = Activity(
                    deal_id=deal.id,
                    contact_id=deal.contact_id,
                    type=random.choice(ACTIVITY_TYPES),
                    description=fake.sentence(),
                    occurred_at=fake.date_time_between(start_date="-60d", end_date="now"),
                )
                db.add(activity)
                activity_count += 1

        await db.commit()
        print(f"📋 Created {activity_count} activities")

        # Summary
        at_risk = [d for d in deals if d.churn_score >= 0.7]
        won = [d for d in deals if d.stage == "closed_won"]
        total_value = sum(d.value for d in deals if d.value)

        print("\n✅ Seed complete!")
        print(f"   Total pipeline value: ${total_value:,.0f}")
        print(f"   At-risk deals: {len(at_risk)}")
        print(f"   Closed won: {len(won)}")


if __name__ == "__main__":
    asyncio.run(seed())