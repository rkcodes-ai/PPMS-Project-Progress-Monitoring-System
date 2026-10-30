from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base

class DocumentTypeEnum(str, enum.Enum):
    PROPOSAL = "PROPOSAL"
    REQUIREMENTS = "REQUIREMENTS"
    DESIGN = "DESIGN"
    PROGRESS_REPORT = "PROGRESS_REPORT"
    RESEARCH = "RESEARCH"
    TEST_REPORT = "TEST_REPORT"
    FINAL_DOCUMENTATION = "FINAL_DOCUMENTATION"
    OTHER = "OTHER"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    document_type = Column(Enum(DocumentTypeEnum), default=DocumentTypeEnum.OTHER, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    mime_type = Column(String(100), default="application/octet-stream", nullable=False)
    version = Column(Integer, default=1, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
