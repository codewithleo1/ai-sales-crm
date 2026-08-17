"""Backend regression tests for AI Sales CRM (Phase 1 rebuild)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-deal-flow.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@aisalescrm.com"
DEMO_PASSWORD = "Demo1234!"
MEMBER_EMAIL = "sam@aisalescrm.com"
VIEWER_EMAIL = "riley@aisalescrm.com"


def _login(session, email, password):
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password})
    return r


@pytest.fixture(scope="module")
def demo_session():
    s = requests.Session()
    r = _login(s, DEMO_EMAIL, DEMO_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"Demo login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def viewer_session():
    s = requests.Session()
    r = _login(s, VIEWER_EMAIL, DEMO_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"Viewer login failed: {r.status_code} {r.text}")
    return s


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_login_success_sets_cookies(self):
        s = requests.Session()
        r = _login(s, DEMO_EMAIL, DEMO_PASSWORD)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == DEMO_EMAIL
        assert data.get("role") == "owner"
        assert data.get("organization", {}).get("name")
        # httpOnly cookies present
        assert "access_token" in s.cookies
        assert "refresh_token" in s.cookies

    def test_me(self, demo_session):
        r = demo_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == DEMO_EMAIL
        assert "organization" in u and u["organization"]["name"]

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_bcrypt_hash_format(self):
        # Load password_hash directly from DB via a fresh register call — hash should start with $2b$
        # We validate through the register flow: register a user then fetch DB directly through login (indirect).
        # Easiest: connect to Mongo via env
        import pymongo
        client = pymongo.MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = client[os.environ.get("DB_NAME", "ai_sales_crm")]
        u = db.users.find_one({"email": DEMO_EMAIL})
        assert u is not None
        assert u["password_hash"].startswith("$2b$"), f"bcrypt hash malformed: {u['password_hash'][:10]}"


# ---------- Multi-tenant isolation ----------
class TestTenantIsolation:
    def test_register_new_workspace_is_empty(self):
        s = requests.Session()
        unique = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "Test Owner", "email": unique, "password": "TestPass123!",
            "org_name": "TEST_Isolation_Org",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == unique.lower()
        assert data["role"] == "owner"
        # New org should see zero deals and contacts
        d = s.get(f"{API}/deals").json()["data"]
        c = s.get(f"{API}/contacts").json()["data"]
        assert d == [], f"New org has {len(d)} deals leaking!"
        assert c == [], f"New org has {len(c)} contacts leaking!"

    def test_org_A_deal_not_visible_to_org_B(self, demo_session):
        # Create a new org
        s2 = requests.Session()
        unique = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = s2.post(f"{API}/auth/register", json={
            "name": "Other Owner", "email": unique, "password": "TestPass123!",
            "org_name": "TEST_Other_Org",
        })
        assert r.status_code == 200

        # Demo user creates a deal
        r = demo_session.post(f"{API}/deals", json={"title": "TEST_isolated_deal", "value": 5000})
        assert r.status_code == 201
        deal_id = r.json()["data"]["id"]

        # Org B (new) should NOT see it
        b_deals = s2.get(f"{API}/deals").json()["data"]
        assert not any(d["id"] == deal_id for d in b_deals)

        # cleanup
        demo_session.delete(f"{API}/deals/{deal_id}")


# ---------- Dashboard ----------
class TestDashboard:
    def test_stats_shape(self, demo_session):
        r = demo_session.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()["data"]
        for k in ("total_pipeline", "win_rate", "at_risk_count", "stage_counts", "stage_values",
                  "contacts_count", "active_deals", "total_deals"):
            assert k in d
        # demo has 70 deals seeded
        assert d["total_deals"] >= 1


# ---------- Deals CRUD + stage change + at-risk + explain ----------
class TestDeals:
    def test_list(self, demo_session):
        r = demo_session.get(f"{API}/deals")
        assert r.status_code == 200
        assert isinstance(r.json()["data"], list)

    def test_create_update_delete(self, demo_session):
        # create
        r = demo_session.post(f"{API}/deals", json={"title": "TEST_deal", "value": 10000, "probability": 40})
        assert r.status_code == 201
        deal = r.json()["data"]
        did = deal["id"]
        assert "lead_score" in deal and "churn_score" in deal

        # patch (drag to another stage)
        r = demo_session.patch(f"{API}/deals/{did}", json={"stage": "negotiation"})
        assert r.status_code == 200
        assert r.json()["data"]["stage"] == "negotiation"

        # verify persistence
        r = demo_session.get(f"{API}/deals")
        found = [d for d in r.json()["data"] if d["id"] == did]
        assert found and found[0]["stage"] == "negotiation"

        # delete
        r = demo_session.delete(f"{API}/deals/{did}")
        assert r.status_code == 200

        # gone
        r = demo_session.get(f"{API}/deals")
        assert not any(d["id"] == did for d in r.json()["data"])

    def test_at_risk_list(self, demo_session):
        r = demo_session.get(f"{API}/deals/at-risk")
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, list)
        for d in data:
            assert d.get("churn_score", 0) >= 0.7

    def test_explain_uses_groq(self, demo_session):
        r = demo_session.get(f"{API}/deals/at-risk")
        deals = r.json()["data"]
        if not deals:
            pytest.skip("No at-risk deals to explain")
        did = deals[0]["id"]
        r = demo_session.post(f"{API}/deals/{did}/explain")
        assert r.status_code == 200
        text = r.json()["data"]["explanation"]
        assert isinstance(text, str) and len(text) > 10


# ---------- Contacts ----------
class TestContacts:
    def test_crud(self, demo_session):
        r = demo_session.get(f"{API}/contacts")
        assert r.status_code == 200

        r = demo_session.post(f"{API}/contacts", json={
            "name": "TEST_ContactX", "email": f"TEST_{uuid.uuid4().hex[:6]}@ex.com",
            "company": "TestCo", "title": "VP",
        })
        assert r.status_code == 201
        cid = r.json()["data"]["id"]
        r = demo_session.delete(f"{API}/contacts/{cid}")
        assert r.status_code == 200


# ---------- AI ----------
class TestAI:
    def test_email_draft(self, demo_session):
        deals = demo_session.get(f"{API}/deals").json()["data"]
        if not deals:
            pytest.skip("no deals")
        did = deals[0]["id"]
        r = demo_session.post(f"{API}/ai/email/draft", json={"deal_id": did, "tone": "professional"})
        assert r.status_code == 200, r.text
        d = r.json()["data"]
        assert d.get("subject") and isinstance(d["subject"], str)
        assert d.get("body") and isinstance(d["body"], str) and len(d["body"]) > 20

    def test_email_send_stub(self, demo_session):
        r = demo_session.post(f"{API}/ai/email/send", json={
            "deal_id": "x", "to_email": "test@example.com",
            "subject": "s", "body": "b"})
        assert r.status_code == 200
        # sent may be False in demo mode
        assert "sent" in r.json()["data"]

    def test_insights_generate_and_list(self, demo_session):
        r = demo_session.post(f"{API}/ai/insights/generate")
        assert r.status_code == 200, r.text
        content = r.json()["data"]["content"]
        assert isinstance(content, str) and len(content) > 20
        r = demo_session.get(f"{API}/ai/insights")
        assert r.status_code == 200
        assert len(r.json()["data"]) >= 1


# ---------- Team RBAC ----------
class TestTeam:
    def test_members_list(self, demo_session):
        r = demo_session.get(f"{API}/team/members")
        assert r.status_code == 200
        assert len(r.json()["data"]) >= 1

    def test_owner_can_invite_change_remove(self, demo_session):
        email = f"TEST_invite_{uuid.uuid4().hex[:6]}@ex.com"
        r = demo_session.post(f"{API}/team/invite", json={"name": "TEST_Invited", "email": email, "role": "member"})
        assert r.status_code == 201, r.text
        d = r.json()["data"]
        assert d["temp_password"]
        mid = d["id"]

        r = demo_session.patch(f"{API}/team/members/{mid}", json={"role": "viewer"})
        assert r.status_code == 200

        r = demo_session.delete(f"{API}/team/members/{mid}")
        assert r.status_code == 200

    def test_viewer_cannot_invite(self, viewer_session):
        r = viewer_session.post(f"{API}/team/invite", json={
            "name": "n", "email": f"TEST_{uuid.uuid4().hex[:6]}@ex.com", "role": "member"})
        assert r.status_code == 403


# ---------- Billing ----------
class TestBilling:
    def test_plans(self, demo_session):
        r = demo_session.get(f"{API}/billing/plans")
        assert r.status_code == 200
        assert "pro" in r.json()["data"]

    def test_usage(self, demo_session):
        r = demo_session.get(f"{API}/billing/usage")
        assert r.status_code == 200
        d = r.json()["data"]
        assert d["plan"] in ("free", "pro", "enterprise")
        assert "usage" in d and "seats" in d["usage"]

    def test_upgrade_stub(self, demo_session):
        # upgrade to pro (already pro, but should still succeed)
        r = demo_session.post(f"{API}/billing/upgrade", json={"plan": "pro"})
        assert r.status_code == 200
        assert r.json()["data"]["plan"] == "pro"
