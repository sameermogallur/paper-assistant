import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Paper, Project, ProjectPaper
from app.schemas.models import (
    AddPaperRequest,
    ProjectCreate,
    ProjectDetail,
    ProjectSummary,
    ProjectUpdate,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger(__name__)


def _project_detail(project: Project) -> ProjectDetail:
    return ProjectDetail(
        id=project.id,
        name=project.name,
        description=project.description,
        paper_ids=[pp.paper_id for pp in project.paper_links],
        created_at=project.created_at.isoformat(),
    )


def _get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, f"Project {project_id} not found")
    return project


@router.get("", response_model=List[ProjectSummary])
def list_projects(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Project, func.count(ProjectPaper.paper_id).label("cnt"))
        .outerjoin(ProjectPaper, ProjectPaper.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    ).all()
    return [
        ProjectSummary(
            id=project.id,
            name=project.name,
            description=project.description,
            paper_count=cnt,
            created_at=project.created_at.isoformat(),
        )
        for project, cnt in rows
    ]


@router.post("", response_model=ProjectDetail, status_code=201)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(name=body.name, description=body.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_detail(project)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return _project_detail(_get_project_or_404(db, project_id))


@router.put("/{project_id}", response_model=ProjectDetail)
def update_project(project_id: int, body: ProjectUpdate, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    db.commit()
    db.refresh(project)
    return _project_detail(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/papers", status_code=201)
def add_paper_to_project(
    project_id: int, body: AddPaperRequest, db: Session = Depends(get_db)
):
    _get_project_or_404(db, project_id)

    paper = db.get(Paper, body.paper_id)
    if not paper:
        raise HTTPException(404, f"Paper {body.paper_id} not found")

    existing = db.get(ProjectPaper, (project_id, body.paper_id))
    if existing:
        raise HTTPException(409, "Paper already in project")

    db.add(ProjectPaper(project_id=project_id, paper_id=body.paper_id))
    db.commit()
    return {"project_id": project_id, "paper_id": body.paper_id}


@router.delete("/{project_id}/papers/{paper_id}", status_code=204)
def remove_paper_from_project(
    project_id: int, paper_id: int, db: Session = Depends(get_db)
):
    _get_project_or_404(db, project_id)

    link = db.get(ProjectPaper, (project_id, paper_id))
    if not link:
        raise HTTPException(404, "Paper not in project")

    db.delete(link)
    db.commit()
