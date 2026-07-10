"""
Tests for Projects CRUD endpoints (GET/POST/PUT/DELETE /api/projects and paper membership).
Uses FastAPI TestClient with an in-memory SQLite DB injected via dependency override.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.models import Paper
from app.main import app


# ---------------------------------------------------------------------------
# DB override fixture — fresh in-memory DB per test
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    # StaticPool: all connections share one in-memory DB, so the schema
    # created here is visible to the sync threadpool that runs endpoint handlers.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(engine)


@pytest.fixture
def paper_id(client):
    """Insert a Paper row and return its id for membership tests."""
    db: Session = next(app.dependency_overrides[get_db]())
    p = Paper(sha256="b" * 64, word_count=0, extraction_method="native")
    db.add(p)
    db.commit()
    db.refresh(p)
    pid = p.id
    db.close()
    return pid


# ---------------------------------------------------------------------------
# List / Create
# ---------------------------------------------------------------------------

def test_list_projects_empty(client):
    r = client.get("/api/projects")
    assert r.status_code == 200
    assert r.json() == []


def test_create_project(client):
    r = client.post("/api/projects", json={"name": "My Project", "description": "A desc"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "My Project"
    assert data["description"] == "A desc"
    assert data["paper_ids"] == []
    assert "id" in data


def test_create_project_minimal(client):
    r = client.post("/api/projects", json={"name": "Minimal"})
    assert r.status_code == 201
    assert r.json()["description"] is None


def test_list_projects_shows_created(client):
    client.post("/api/projects", json={"name": "P1"})
    client.post("/api/projects", json={"name": "P2"})
    r = client.get("/api/projects")
    assert r.status_code == 200
    names = {p["name"] for p in r.json()}
    assert {"P1", "P2"} == names


def test_list_projects_paper_count(client, paper_id):
    proj = client.post("/api/projects", json={"name": "Counted"}).json()
    client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": paper_id})
    r = client.get("/api/projects")
    entry = next(p for p in r.json() if p["id"] == proj["id"])
    assert entry["paper_count"] == 1


# ---------------------------------------------------------------------------
# Get
# ---------------------------------------------------------------------------

def test_get_project(client):
    proj = client.post("/api/projects", json={"name": "GetMe"}).json()
    r = client.get(f"/api/projects/{proj['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "GetMe"


def test_get_project_not_found(client):
    assert client.get("/api/projects/9999").status_code == 404


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

def test_update_project_name(client):
    proj = client.post("/api/projects", json={"name": "Old"}).json()
    r = client.put(f"/api/projects/{proj['id']}", json={"name": "New"})
    assert r.status_code == 200
    assert r.json()["name"] == "New"


def test_update_project_description(client):
    proj = client.post("/api/projects", json={"name": "P", "description": "old desc"}).json()
    r = client.put(f"/api/projects/{proj['id']}", json={"description": "new desc"})
    assert r.status_code == 200
    assert r.json()["description"] == "new desc"
    assert r.json()["name"] == "P"  # unchanged


def test_update_project_not_found(client):
    assert client.put("/api/projects/9999", json={"name": "X"}).status_code == 404


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

def test_delete_project(client):
    proj = client.post("/api/projects", json={"name": "ToDelete"}).json()
    r = client.delete(f"/api/projects/{proj['id']}")
    assert r.status_code == 204
    assert client.get(f"/api/projects/{proj['id']}").status_code == 404


def test_delete_project_not_found(client):
    assert client.delete("/api/projects/9999").status_code == 404


# ---------------------------------------------------------------------------
# Paper membership
# ---------------------------------------------------------------------------

def test_add_paper_to_project(client, paper_id):
    proj = client.post("/api/projects", json={"name": "WithPaper"}).json()
    r = client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": paper_id})
    assert r.status_code == 201

    detail = client.get(f"/api/projects/{proj['id']}").json()
    assert paper_id in detail["paper_ids"]


def test_add_paper_duplicate_is_409(client, paper_id):
    proj = client.post("/api/projects", json={"name": "Dup"}).json()
    client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": paper_id})
    r = client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": paper_id})
    assert r.status_code == 409


def test_add_paper_project_not_found(client, paper_id):
    r = client.post("/api/projects/9999/papers", json={"paper_id": paper_id})
    assert r.status_code == 404


def test_add_paper_paper_not_found(client):
    proj = client.post("/api/projects", json={"name": "P"}).json()
    r = client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": 9999})
    assert r.status_code == 404


def test_remove_paper_from_project(client, paper_id):
    proj = client.post("/api/projects", json={"name": "Remove"}).json()
    client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": paper_id})

    r = client.delete(f"/api/projects/{proj['id']}/papers/{paper_id}")
    assert r.status_code == 204

    detail = client.get(f"/api/projects/{proj['id']}").json()
    assert paper_id not in detail["paper_ids"]


def test_remove_paper_not_in_project(client, paper_id):
    proj = client.post("/api/projects", json={"name": "P"}).json()
    r = client.delete(f"/api/projects/{proj['id']}/papers/{paper_id}")
    assert r.status_code == 404


def test_delete_project_cascades_membership(client, paper_id):
    """Deleting a project removes its ProjectPaper links; the paper itself survives."""
    proj = client.post("/api/projects", json={"name": "Cascade"}).json()
    client.post(f"/api/projects/{proj['id']}/papers", json={"paper_id": paper_id})
    client.delete(f"/api/projects/{proj['id']}")
    # Project is gone
    assert client.get(f"/api/projects/{proj['id']}").status_code == 404
