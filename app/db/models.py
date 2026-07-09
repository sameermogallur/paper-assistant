from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, LargeBinary,
    DateTime, ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def _now() -> datetime:
    # timezone-naive UTC — SQLite's pysqlite driver rejects tz-aware datetimes
    return datetime.utcnow()


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True)
    sha256 = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(Text, nullable=True)
    authors = Column(Text, nullable=True)       # JSON-encoded list
    year = Column(Integer, nullable=True)
    doi = Column(String(255), nullable=True)
    pdf_path = Column(String(512), nullable=True)
    full_text = Column(Text, nullable=True)
    sections = Column(Text, nullable=True)       # JSON-encoded dict
    word_count = Column(Integer, nullable=True)
    extraction_method = Column(String(50), nullable=True)
    created_at = Column(DateTime(), default=_now, nullable=False)

    reports = relationship("AnalysisReport", back_populates="paper", cascade="all, delete-orphan")
    references = relationship("Reference", back_populates="paper", cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates="paper", cascade="all, delete-orphan")
    project_links = relationship("ProjectPaper", back_populates="paper", cascade="all, delete-orphan")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    report_json = Column(Text, nullable=False)
    integrity_score = Column(Integer, nullable=True)
    integrity_grade = Column(String(2), nullable=True)
    analyzer_version = Column(String(20), nullable=False)
    created_at = Column(DateTime(), default=_now, nullable=False)

    paper = relationship("Paper", back_populates="reports")


class Reference(Base):
    __tablename__ = "references"

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text, nullable=False)
    doi = Column(String(255), nullable=True)
    matched_title = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)  # verified / suspicious / not_found
    confidence = Column(Float, nullable=True)

    paper = relationship("Paper", back_populates="references")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(), default=_now, nullable=False)

    paper_links = relationship("ProjectPaper", back_populates="project", cascade="all, delete-orphan")


class ProjectPaper(Base):
    __tablename__ = "project_papers"

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime(), default=_now, nullable=False)

    project = relationship("Project", back_populates="paper_links")
    paper = relationship("Paper", back_populates="project_links")


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(50), nullable=False)   # e.g. "title_abstract"
    vector = Column(LargeBinary, nullable=False) # numpy array as EMBEDDING_DTYPE bytes

    __table_args__ = (UniqueConstraint("paper_id", "kind", name="uq_embedding_paper_kind"),)

    paper = relationship("Paper", back_populates="embeddings")
