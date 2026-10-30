import os
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.notifications import send_notification
from app.api.deps import (
    get_current_user_and_token,
    check_project_access,
    check_document_access
)
from app.models.user import User, RoleEnum
from app.models.document import Document, DocumentTypeEnum
from app.models.activity import ProjectActivity
from app.models.notification import NotificationEventTypeEnum
from app.schemas.document import DocumentResponse

router = APIRouter()

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".txt", ".pptx", ".xlsx", ".zip", ".png", ".jpg", ".jpeg"
}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
    "application/octet-stream"
}

def format_document_response(doc: Document) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        project_id=doc.project_id,
        uploaded_by_id=doc.uploaded_by_id,
        uploader_name=doc.uploaded_by.full_name if doc.uploaded_by else "Academic User",
        title=doc.title,
        document_type=doc.document_type,
        file_name=doc.file_name,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        version=doc.version,
        created_at=doc.created_at
    )

@router.post("/projects/{project_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_project_document(
    project_id: int,
    title: str = Form(...),
    document_type: DocumentTypeEnum = Form(DocumentTypeEnum.OTHER),
    file: UploadFile = File(...),
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    # Authorize project access based on role
    project = check_project_access(project_id, user, active_role, db)

    # Sanitize and validate filename & extension
    original_filename = Path(file.filename or "uploaded_document").name
    # Strip potential path traversal sequences
    clean_filename = original_filename.replace("..", "").replace("/", "").replace("\\", "").strip()
    if not clean_filename:
        clean_filename = "document"

    ext = Path(clean_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disallowed file extension '{ext}'. Permitted extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Validate MIME type if provided
    content_type = file.content_type or "application/octet-stream"
    if content_type.lower() not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disallowed Content-Type '{content_type}'."
        )

    # Ensure destination directory exists
    storage_root = os.path.abspath(settings.UPLOAD_DIR)
    doc_storage_dir = os.path.join(storage_root, "documents")
    os.makedirs(doc_storage_dir, exist_ok=True)

    # Generate safe unique internal storage name
    storage_filename = f"{uuid.uuid4().hex}{ext}"
    target_filepath = os.path.join(doc_storage_dir, storage_filename)

    # Read and stream file with size check
    total_size = 0
    try:
        with open(target_filepath, "wb") as f_out:
            while True:
                chunk = await file.read(64 * 1024)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE_BYTES:
                    f_out.close()
                    if os.path.exists(target_filepath):
                        os.remove(target_filepath)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File size exceeds maximum allowed limit of 15MB."
                    )
                f_out.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        if os.path.exists(target_filepath):
            os.remove(target_filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store file safely on disk: {str(exc)}"
        )
    finally:
        await file.close()

    # Determine document version
    existing_count = db.query(Document).filter(
        Document.project_id == project.id,
        Document.title == title.strip()
    ).count()
    version = existing_count + 1

    # Create document record
    document = Document(
        project_id=project.id,
        uploaded_by_id=user.id,
        title=title.strip(),
        document_type=document_type,
        file_name=clean_filename,
        file_path=target_filepath,
        file_size_bytes=total_size,
        mime_type=content_type,
        version=version
    )
    db.add(document)
    db.flush()

    # Log project activity
    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="DOCUMENT_UPLOADED",
        description=f"Document '{document.title}' ({clean_filename}, v{version}) uploaded by {user.full_name}."
    ))

    # Send notifications to relevant stakeholders
    if active_role == RoleEnum.STUDENT and project.mentor_id:
        send_notification(
            db=db,
            recipient_id=project.mentor_id,
            event_type=NotificationEventTypeEnum.REVIEW_REQUEST,
            title=f"New Document Uploaded: {document.title}",
            message=f"Team {project.code} uploaded document '{document.title}' ({document.document_type.value}) for your review.",
            resource_type="project",
            resource_id=project.id
        )

    db.commit()
    db.refresh(document)

    return format_document_response(document)

@router.get("/projects/{project_id}/documents", response_model=List[DocumentResponse])
def list_project_documents(
    project_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    project = check_project_access(project_id, user, active_role, db)
    documents = db.query(Document).filter(
        Document.project_id == project.id
    ).order_by(Document.created_at.desc()).all()

    return [format_document_response(d) for d in documents]

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document_metadata(
    document_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    document, _ = check_document_access(document_id, user, active_role, db)
    return format_document_response(document)

@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    document, _ = check_document_access(document_id, user, active_role, db)

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file missing on server."
        )

    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type=document.mime_type
    )

@router.get("/documents/{document_id}/preview")
def preview_document(
    document_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    """
    Renders document inline for secure in-browser preview without exposing filesystem paths.
    """
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    document, _ = check_document_access(document_id, user, active_role, db)

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file missing on server."
        )

    return FileResponse(
        path=document.file_path,
        media_type=document.mime_type,
        content_disposition_type="inline"
    )

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    user_and_token: tuple[User, dict] = Depends(get_current_user_and_token),
    db: Session = Depends(get_db)
):
    user, payload = user_and_token
    active_role = RoleEnum(payload.get("active_role"))

    document, project = check_document_access(document_id, user, active_role, db)

    # Permission check: Student can only delete documents they uploaded
    if active_role == RoleEnum.STUDENT and document.uploaded_by_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students may only delete documents they uploaded."
        )

    # Clean up physical file if exists
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception:
        pass  # Continue to remove DB entry even if file deletion encounters warning

    doc_title = document.title
    db.delete(document)

    db.add(ProjectActivity(
        project_id=project.id,
        user_id=user.id,
        activity_type="DOCUMENT_DELETED",
        description=f"Document '{doc_title}' was deleted by {user.full_name} ({active_role.value})."
    ))
    db.commit()

    return {"detail": "Document successfully deleted", "document_id": document_id}
