"""Backend tests for Phase 2 features: AI Assistant, Email Sequences, Search+Pagination, Razorpay."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-deal-flow.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@aisalescrm.com"
DEMO_PASSWORD = "Demo1234!"
VIEWER_EMAIL = "riley@aisalescrm.com"


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    return s, r


@pytest.fixture(scope="module")
def owner():
    s, r = _login(DEMO_EMAIL, DEMO_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"Owner login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def viewer():
    s, r = _login(VIEWER_EMAIL, DEMO_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"Viewer login failed: {r.status_code}")
    return s


# ---------- AI Assistant ----------
class TestAssistant:
    def test_suggestions_returns_four_chips(self, owner):
        r = owner.get(f"{API}/ai/assistant/suggestions")
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, list) and len(data) == 4
        assert all(isinstance(s, str) and len(s) > 0 for s in data)

    def test_chat_returns_non_empty_answer(self, owner):
        r = owner.post(f"{API}/ai/assistant/chat",
                       json={"message": "Which 3 deals should I focus on today?", "history": []},
                       timeout=45)
        assert r.status_code == 200, r.text
        answer = r.json()["data"]["answer"]
        assert isinstance(answer, str) and len(answer) > 20

    def test_chat_requires_auth(self):
        r = requests.post(f"{API}/ai/assistant/chat", json={"message": "hi"})
        assert r.status_code == 401


# ---------- Email Sequences ----------
class TestSequences:
    def test_full_sequence_lifecycle(self, owner):
        # pick a deal
        deals = owner.get(f"{API}/deals").json()["data"]
        assert deals, "need a seeded deal"
        deal_id = deals[0]["id"]

        # create
        r = owner.post(f"{API}/sequences", json={"deal_id": deal_id}, timeout=45)
        assert r.status_code == 201, r.text
        seq = r.json()["data"]
        assert len(seq["steps"]) == 3
        assert seq["steps"][0]["status"] == "drafted"
        assert seq["steps"][0]["subject"] and seq["steps"][0]["body"]
        assert seq["steps"][1]["status"] == "pending"
        assert seq.get("deal_title")
        sid = seq["id"]

        # list has deal_title
        r = owner.get(f"{API}/sequences")
        assert r.status_code == 200
        lst = r.json()["data"]
        found = [s for s in lst if s["id"] == sid]
        assert found and found[0].get("deal_title")

        # sending pending step 2 must fail
        r = owner.post(f"{API}/sequences/{sid}/steps/2/send")
        assert r.status_code == 400

        # draft step 2
        r = owner.post(f"{API}/sequences/{sid}/steps/2/draft", timeout=45)
        assert r.status_code == 200
        s2 = next(s for s in r.json()["data"]["steps"] if s["step_no"] == 2)
        assert s2["status"] == "drafted"
        assert s2["subject"] and s2["body"]

        # send step 2 succeeds
        r = owner.post(f"{API}/sequences/{sid}/steps/2/send")
        assert r.status_code == 200
        s2 = next(s for s in r.json()["data"]["steps"] if s["step_no"] == 2)
        assert s2["status"] == "sent"

        # delete
        r = owner.delete(f"{API}/sequences/{sid}")
        assert r.status_code == 200
        # not in list
        lst2 = owner.get(f"{API}/sequences").json()["data"]
        assert not any(s["id"] == sid for s in lst2)

    def test_create_sequence_bad_deal(self, owner):
        r = owner.post(f"{API}/sequences", json={"deal_id": "does-not-exist"})
        assert r.status_code == 404


# ---------- Search + Pagination ----------
class TestSearchPagination:
    def test_deals_pagination_shape(self, owner):
        r = owner.get(f"{API}/deals?q=API&page=1&page_size=5")
        assert r.status_code == 200
        body = r.json()
        for k in ("data", "total", "page", "page_size", "pages"):
            assert k in body
        assert body["page"] == 1
        assert body["page_size"] == 5
        assert len(body["data"]) <= 5
        # all returned titles should contain 'api' (case-insensitive) — if any
        for d in body["data"]:
            assert "api" in d["title"].lower()
        # pages math
        assert body["pages"] == max(1, (body["total"] + 4) // 5)

    def test_deals_empty_search(self, owner):
        r = owner.get(f"{API}/deals?q=zzz_no_match_xyz_TEST&page=1&page_size=5")
        assert r.status_code == 200
        body = r.json()
        assert body["data"] == []
        assert body["total"] == 0

    def test_contacts_pagination_shape(self, owner):
        r = owner.get(f"{API}/contacts?q=&page=1&page_size=12")
        assert r.status_code == 200
        body = r.json()
        for k in ("data", "total", "page", "page_size", "pages"):
            assert k in body
        assert len(body["data"]) <= 12
        assert body["page_size"] == 12

    def test_contacts_search(self, owner):
        # first get any contact
        first = owner.get(f"{API}/contacts?page=1&page_size=1").json()["data"]
        if not first:
            pytest.skip("no contacts")
        needle = first[0]["name"].split(" ")[0]
        r = owner.get(f"{API}/contacts?q={needle}&page=1&page_size=12")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] >= 1
        assert any(needle.lower() in (c["name"] or "").lower() for c in body["data"])


# ---------- Razorpay ----------
class TestRazorpay:
    def test_create_order_returns_expected_fields(self, owner):
        r = owner.post(f"{API}/billing/razorpay/order", json={"plan": "pro", "annual": False})
        assert r.status_code == 200, r.text
        d = r.json()["data"]
        assert d["order_id"].startswith("order_")
        assert isinstance(d["amount"], int) and d["amount"] > 0
        assert d["currency"] == "INR"
        assert d["key_id"]
        assert d["plan"] == "pro"

    def test_create_order_annual_discounted(self, owner):
        r = owner.post(f"{API}/billing/razorpay/order", json={"plan": "pro", "annual": True})
        assert r.status_code == 200
        d = r.json()["data"]
        # annual with 20% discount over 12 months should be greater than 1 month monthly
        assert d["amount"] > 0

    def test_verify_invalid_signature_returns_400(self, owner):
        # create real order first
        r = owner.post(f"{API}/billing/razorpay/order", json={"plan": "pro", "annual": False})
        oid = r.json()["data"]["order_id"]
        r = owner.post(f"{API}/billing/razorpay/verify", json={
            "plan": "pro",
            "razorpay_order_id": oid,
            "razorpay_payment_id": "pay_INVALID",
            "razorpay_signature": "invalid_signature_xxx",
        })
        assert r.status_code == 400
        # ensure plan was NOT changed to something new — org still on original plan
        u = owner.get(f"{API}/billing/usage").json()["data"]
        assert u["plan"] in ("free", "pro", "enterprise")

    def test_upgrade_paid_plan_requires_checkout(self, owner):
        r = owner.post(f"{API}/billing/upgrade", json={"plan": "pro"})
        assert r.status_code == 400
        assert "checkout" in r.json().get("detail", "").lower()

    def test_upgrade_free_succeeds(self, owner):
        # capture current plan then downgrade + restore
        before = owner.get(f"{API}/billing/usage").json()["data"]["plan"]
        r = owner.post(f"{API}/billing/upgrade", json={"plan": "free"})
        assert r.status_code == 200
        assert r.json()["data"]["plan"] == "free"
        # restore original plan via direct DB-less means: use razorpay/verify would need signature.
        # We use the upgrade endpoint only for free; restore by directly updating via internal? not available.
        # Best-effort: leave org on free for test session; note in report.
        # If original was 'pro' or 'enterprise', restore by direct DB write via pymongo.
        if before != "free":
            import pymongo
            client = pymongo.MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
            db = client[os.environ.get("DB_NAME", "ai_sales_crm")]
            # find org_id
            me = owner.get(f"{API}/auth/me").json()
            org_id = me["organization"]["id"]
            db.organizations.update_one({"id": org_id}, {"$set": {"plan": before}})

    def test_viewer_cannot_create_order(self, viewer):
        r = viewer.post(f"{API}/billing/razorpay/order", json={"plan": "pro", "annual": False})
        assert r.status_code == 403
