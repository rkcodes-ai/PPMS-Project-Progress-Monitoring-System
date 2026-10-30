from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.document import DocumentTypeEnum

class DocumentResponse(BaseModel):
    id: int
    project_id: int
    uploaded_by_id: int
    uploader_name: Optional[str] = None
    title: str
    document_type: DocumentTypeEnum
    file_name: str
    file_size_bytes: int
    mime_type: str
    version: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
