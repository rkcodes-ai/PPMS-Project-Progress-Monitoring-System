import io
import hashlib
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.models.project import Project
from app.models.milestone import Milestone

def compute_certificate_hash(entity_type: str, entity_id: int, code: str, date_str: str) -> str:
    raw = f"{entity_type}:{entity_id}:{code}:{date_str}:PPMS_ACADEMIC_INTEGRITY_SALT"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16].upper()

def generate_project_certificate_pdf(project: Project) -> bytes:
    """
    Generates a high-quality, print-friendly Project Completion Certificate in PDF format.
    Uses vector graphics, typography hierarchy, and academic borders.
    """
    buffer = io.BytesIO()
    p_width, p_height = landscape(letter) # 792 x 612 points
    c = canvas.Canvas(buffer, pagesize=(p_width, p_height))

    # Determine completion date string
    comp_date = project.updated_at or project.planned_completion_date or datetime.now(timezone.utc)
    date_str = comp_date.strftime("%B %d, %Y")
    cert_hash = compute_certificate_hash("PROJECT", project.id, project.code, date_str)
    cert_ref = f"PPMS-PRJ-{project.code}-{cert_hash[:8]}"

    # 1. Background & Multi-tier Academic Borders
    # Outer dark slate border
    c.setStrokeColor(colors.HexColor("#0f172a")) # Slate 900
    c.setLineWidth(3)
    c.rect(30, 30, p_width - 60, p_height - 60)

    # Inset gold / amber accent line
    c.setStrokeColor(colors.HexColor("#d97706")) # Amber 600
    c.setLineWidth(1)
    c.rect(36, 36, p_width - 72, p_height - 72)

    # Inset subtle border
    c.setStrokeColor(colors.HexColor("#e2e8f0")) # Slate 200
    c.setLineWidth(0.5)
    c.rect(40, 40, p_width - 80, p_height - 80)

    # Corner decorations
    c.setFillColor(colors.HexColor("#4f46e5")) # Indigo 600
    for cx in (36, p_width - 44):
        for cy in (36, p_height - 44):
            c.rect(cx, cy, 8, 8, fill=1, stroke=0)

    # 2. Institutional Header
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(p_width / 2, 545, "COLLEGE OF ENGINEERING & TECHNOLOGY")

    c.setFillColor(colors.HexColor("#4f46e5"))
    c.setFont("Helvetica-Bold", 10)
    dept_name = project.department.name.upper() if project.department else "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING"
    c.drawCentredString(p_width / 2, 530, f"{dept_name}")

    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(p_width / 2, 517, "ACADEMIC PROJECT PROGRESS MONITORING SYSTEM (PPMS)")

    # Horizontal divider
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.line(160, 505, p_width - 160, 505)

    # 3. Certificate Title
    c.setFillColor(colors.HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(p_width / 2, 472, "CERTIFICATE OF PROJECT COMPLETION")

    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(p_width / 2, 448, "This is to formally certify the successful culmination and approval of the project titled")

    # 4. Project Title & Code
    c.setFillColor(colors.HexColor("#1e1b4b")) # Indigo 950
    c.setFont("Helvetica-Bold", 17)
    # Truncate title if extremely long to fit gracefully
    proj_title = project.title if len(project.title) <= 75 else f"{project.title[:72]}..."
    c.drawCentredString(p_width / 2, 418, f'"{proj_title}"')

    c.setFillColor(colors.HexColor("#4f46e5"))
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(p_width / 2, 396, f"Project Code: {project.code}  |  Category: {project.category}")

    # 5. Student Team Section
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(p_width / 2, 365, "Successfully executed and submitted by the student engineering team:")

    # Gather student names
    student_names = [m.user.full_name for m in project.members if m.user]
    if not student_names and project.team_lead:
        student_names = [project.team_lead.full_name]
    students_str = ", ".join(student_names) if student_names else "Designated Student Investigators"
    if len(students_str) > 85:
        students_str = f"{students_str[:82]}..."

    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(p_width / 2, 344, students_str)

    # Section, Academic Year, and Performance
    sec_name = project.section.name if project.section else f"Section {project.section_id}"
    year_name = project.academic_year.name if project.academic_year else "Academic Year 2025-2026"
    mentor_name = project.mentor.full_name if project.mentor else "Designated Faculty Mentor"

    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 10)
    meta_line = f"{year_name}  |  {sec_name}  |  Faculty Supervisor: Prof. {mentor_name}"
    c.drawCentredString(p_width / 2, 320, meta_line)

    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 9)
    c.drawCentredString(
        p_width / 2, 
        295, 
        "Having fulfilled all comprehensive academic deliverables, milestone reviews, and technical criteria."
    )

    # 6. Signatures and Verification Columns
    sig_y = 150
    # Left: Supervisor
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)
    c.line(80, sig_y + 35, 240, sig_y + 35)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(160, sig_y + 20, f"Prof. {mentor_name}")
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(160, sig_y + 8, "Project Supervisor / Mentor")

    # Center: Institutional Seal
    c.setStrokeColor(colors.HexColor("#d97706"))
    c.setFillColor(colors.HexColor("#fffbeb"))
    c.circle(p_width / 2, sig_y + 25, 32, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#b45309"))
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(p_width / 2, sig_y + 30, "VERIFIED")
    c.drawCentredString(p_width / 2, sig_y + 20, "PPMS CSE")
    c.setFont("Helvetica", 6)
    c.drawCentredString(p_width / 2, sig_y + 10, "ACADEMIC SEAL")

    # Right: Head of Department
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.line(p_width - 240, sig_y + 35, p_width - 80, sig_y + 35)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(p_width - 160, sig_y + 20, "Head of Department (HOD)")
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(p_width - 160, sig_y + 8, "Computer Science & Engineering")

    # 7. Bottom Academic Verification Footer
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawString(60, 65, f"Date of Completion: {date_str}")
    c.drawCentredString(p_width / 2, 65, f"Certificate Ref: {cert_ref}")
    c.drawRightString(p_width - 60, 65, f"Security Hash: {cert_hash}")

    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica-Oblique", 7)
    c.drawCentredString(
        p_width / 2, 
        48, 
        "Verified Academic Record • Generated via Department Project Progress Monitoring System • Demonstration Document"
    )

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.getvalue()


def generate_milestone_certificate_pdf(milestone: Milestone) -> bytes:
    """
    Generates a Milestone Achievement Certificate in PDF format.
    """
    buffer = io.BytesIO()
    p_width, p_height = landscape(letter)
    c = canvas.Canvas(buffer, pagesize=(p_width, p_height))

    project = milestone.project
    comp_date = milestone.completed_at or milestone.updated_at or milestone.planned_due_date or datetime.now(timezone.utc)
    date_str = comp_date.strftime("%B %d, %Y")
    cert_hash = compute_certificate_hash("MILESTONE", milestone.id, project.code if project else "MS", date_str)
    cert_ref = f"PPMS-MS-{milestone.id}-{cert_hash[:8]}"

    # Outer & Inset Borders
    c.setStrokeColor(colors.HexColor("#0f172a"))
    c.setLineWidth(3)
    c.rect(30, 30, p_width - 60, p_height - 60)

    c.setStrokeColor(colors.HexColor("#0284c7")) # Sky 600
    c.setLineWidth(1)
    c.rect(36, 36, p_width - 72, p_height - 72)

    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(0.5)
    c.rect(40, 40, p_width - 80, p_height - 80)

    # Header
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(p_width / 2, 545, "COLLEGE OF ENGINEERING & TECHNOLOGY")

    c.setFillColor(colors.HexColor("#0284c7"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(p_width / 2, 530, "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING")

    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.line(160, 508, p_width - 160, 508)

    # Title
    c.setFillColor(colors.HexColor("#1e293b"))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(p_width / 2, 475, "CERTIFICATE OF MILESTONE ACHIEVEMENT")

    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(p_width / 2, 448, "This certifies that the academic stage gate has been formally evaluated and approved:")

    # Milestone Title
    c.setFillColor(colors.HexColor("#0369a1")) # Sky 700
    c.setFont("Helvetica-Bold", 17)
    ms_title = milestone.title if len(milestone.title) <= 75 else f"{milestone.title[:72]}..."
    c.drawCentredString(p_width / 2, 418, f'"{ms_title}"')

    # Associated Project
    if project:
        c.setFillColor(colors.HexColor("#1e293b"))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(p_width / 2, 390, f"Project: {project.code} - {project.title[:65]}")

        # Students
        names = [m.user.full_name for m in project.members if m.user]
        if not names and project.team_lead:
            names = [project.team_lead.full_name]
        names_str = ", ".join(names) if names else "Designated Student Investigators"
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 10)
        c.drawCentredString(p_width / 2, 355, "Presented to the project research team:")

        c.setFillColor(colors.HexColor("#0f172a"))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(p_width / 2, 336, names_str)

    # Evaluation details
    reviewer_name = milestone.reviewer.full_name if milestone.reviewer else (project.mentor.full_name if project and project.mentor else "Review Committee")
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(
        p_width / 2, 
        300, 
        f"Formal Stage Gate Status: {milestone.status.value}  |  Evaluated by: Prof. {reviewer_name}"
    )

    # Signatures
    sig_y = 150
    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.setLineWidth(1)
    c.line(100, sig_y + 35, 260, sig_y + 35)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(180, sig_y + 20, f"Prof. {reviewer_name}")
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(180, sig_y + 8, "Milestone Evaluator / Supervisor")

    c.setStrokeColor(colors.HexColor("#94a3b8"))
    c.line(p_width - 260, sig_y + 35, p_width - 100, sig_y + 35)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(p_width - 180, sig_y + 20, "Academic Project Coordinator")
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(p_width - 180, sig_y + 8, "Department Committee")

    # Footer
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawString(60, 65, f"Date of Gate Approval: {date_str}")
    c.drawCentredString(p_width / 2, 65, f"Milestone Ref: {cert_ref}")
    c.drawRightString(p_width - 60, 65, f"Verification: {cert_hash}")

    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica-Oblique", 7)
    c.drawCentredString(
        p_width / 2, 
        48, 
        "Verified Academic Stage Gate Record • Generated via PPMS • Demonstration Document"
    )

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.getvalue()
