from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    Department, AcademicPeriod, AcademicYear, Section, AdvisorAssignment,
    User, Role, RoleEnum, UserRole,
    Project, ProjectMember, MentorAssignment, ProjectStatusEnum, ProjectPriorityEnum, ProjectHealthEnum,
    Task, TaskStatusEnum, TaskPriorityEnum,
    Milestone, MilestoneStatusEnum, MilestoneTask,
    ProgressReport, ReportReview, ReportStatusEnum,
    Document, DocumentTypeEnum,
    Conversation, ConversationParticipant, Message, ConversationTypeEnum,
    Notification, NotificationEventTypeEnum,
    ProjectActivity, AuditEvent
)
from app.services.progress_service import calculate_project_progress, evaluate_project_health
from app.db.project_catalog import CATALOG_PROJECTS

PROJECT_TITLES = [
    # Second Year (10 projects: 2 per section across CSE-A..CSE-E)
    ("AI-Based Student Performance Prediction", "Machine Learning model predicting academic trajectory and risk factors based on continuous assessment data.", "AI/ML", 2, "CSE-A"),
    ("Smart Attendance Management System", "Facial recognition-driven automated attendance tracking with anti-spoofing verification.", "Computer Vision", 2, "CSE-A"),
    ("Campus Placement Preparation Portal", "Interactive mock interview, coding challenge, and recruitment analytics platform for students.", "Web Application", 2, "CSE-B"),
    ("Intelligent Resume Screening System", "NLP-powered parser evaluating candidate skill compatibility against department industry benchmarks.", "NLP/AI", 2, "CSE-B"),
    ("College Event Management Platform", "Centralized scheduling, ticketing, and volunteer coordination portal with live qr-pass check-ins.", "Full-Stack Web", 2, "CSE-C"),
    ("AI-Powered Medical Report Assistant", "Extracts, summarizes, and explains complex EHR laboratory findings in layman terms.", "Healthcare AI", 2, "CSE-C"),
    ("Secure Online Examination System", "Browser-locked proctored testing platform with automated tab-switch and anomalous motion detection.", "Cybersecurity/Web", 2, "CSE-D"),
    ("Library Management and Recommendation System", "Collaborative filtering book recommendation engine paired with automated RFID tracking.", "Information Systems", 2, "CSE-D"),
    ("Smart Waste Classification System", "Edge-deployed camera classification system sorting recyclables from organic waste in real time.", "IoT & Vision", 2, "CSE-E"),
    ("Student Grievance Management Portal", "Anonymous reporting, escalation workflow, and SLA resolution tracking system for campus grievances.", "Enterprise Web", 2, "CSE-E"),

    # Third Year (8 projects: 2 per section across CSE-A..CSE-D)
    ("AI-Based Fake News Detection", "Transformer-based fact-checking crawler analyzing headline veracity and source credibility.", "NLP/Deep Learning", 3, "CSE-A"),
    ("Network Intrusion Detection System", "Packet-level anomaly detector catching DDoS and port-scanning patterns using random forests.", "Cybersecurity", 3, "CSE-A"),
    ("Smart Agriculture Monitoring Platform", "IoT soil moisture and ambient telemetry node network triggering precision drip irrigation.", "IoT & Embedded", 3, "CSE-B"),
    ("E-Learning Recommendation Platform", "Adaptive learning graph suggesting custom video lectures based on conceptual quiz deficits.", "EdTech / ML", 3, "CSE-B"),
    ("Emergency Ambulance Route Analyzer", "Graph routing algorithm computing live siren priority paths avoiding congested urban corridors.", "Algorithms/GIS", 3, "CSE-C"),
    ("Blockchain-Based Certificate Verification", "Tamper-evident academic credential verification on Ethereum compatible ledger.", "Blockchain", 3, "CSE-C"),
    ("Local Language Translation Assistant", "Bidirectional regional language translation neural network for technical terminology.", "NLP / Speech", 3, "CSE-D"),
    ("Smart Expense Tracking Application", "Receipt OCR and categorical spend budget analyzer with predictive anomaly alerts.", "Mobile & AI", 3, "CSE-D"),

    # Fourth Year (7 projects: 2 in A, B, C; 1 in D)
    ("AI-Based Plant Disease Detection", "Leaf lesion segmentation and pesticide recommendation mobile engine using MobileNet.", "Computer Vision", 4, "CSE-A"),
    ("College Bus Tracking System", "Real-time GPS bus tracking with route delay estimation and parent SMS dispatch.", "IoT & Telematics", 4, "CSE-A"),
    ("Secure File Sharing Application", "Zero-knowledge end-to-end encrypted distributed vault with ephemeral link revocation.", "Cryptography", 4, "CSE-B"),
    ("Intelligent Code Review Assistant", "AST-level static analysis bot highlighting memory leaks, security flaws, and PEP8 deviations.", "Developer Tools", 4, "CSE-B"),
    ("Mental Wellness Resource Platform", "Confidential self-assessment journal with mood analytics and counselor appointment dispatch.", "Healthcare Web", 4, "CSE-C"),
    ("Energy Consumption Analytics Dashboard", "Smart meter telemetry aggregator pinpointing department electrical wastage and peak loads.", "Data Analytics", 4, "CSE-C"),
    ("Disaster Response Coordination System", "Geotagged citizen SOS map coordinating volunteer supplies and relief camp logistics.", "Emergency Tech", 4, "CSE-D"),
]

def seed_database(db: Session, reset: bool = False):
    """
    Seeds database deterministically with:
    - 1 CSE Department
    - 1 Academic Period (2026-2027)
    - 3 Academic Years (2nd, 3rd, 4th)
    - 13 Sections (5 Second Year, 4 Third Year, 4 Fourth Year)
    - 4 Core Roles (HOD, ADVISOR, MENTOR, STUDENT)
    - 1 HOD User
    - 13 Advisor Users & 13 Active Advisor Assignments
    - 6 Mentor Users
    - 50+ Student Users
    - Exactly 25 Academic Projects matching required specifications
    - Tasks with realistic weights and completion fractions
    - Milestones linked to tasks
    - Progress reports & reviews
    - Discussion conversations & direct messages
    - In-app notifications
    - Activity & Audit logs
    """
    if reset:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    # 1. Department
    dept = db.query(Department).filter_by(code="CSE").first()
    if not dept:
        dept = Department(code="CSE", name="Computer Science and Engineering")
        db.add(dept)
        db.flush()

    # 2. Academic Period
    period = db.query(AcademicPeriod).filter_by(name="2026-2027 Academic Year").first()
    if not period:
        period = AcademicPeriod(
            name="2026-2027 Academic Year",
            start_date=datetime(2026, 7, 1, tzinfo=timezone.utc),
            end_date=datetime(2027, 5, 31, tzinfo=timezone.utc),
            is_active=True
        )
        db.add(period)
        db.flush()

    # 3. Academic Years (2, 3, 4)
    years_data = [
        (2, "Second Year"),
        (3, "Third Year"),
        (4, "Fourth Year")
    ]
    years_map = {}
    for num, name in years_data:
        ay = db.query(AcademicYear).filter_by(year_number=num).first()
        if not ay:
            ay = AcademicYear(year_number=num, name=name)
            db.add(ay)
            db.flush()
        years_map[num] = ay

    # 4. Sections (13 total: 5 in Y2, 4 in Y3, 4 in Y4)
    sections_spec = [
        (2, ["CSE-A", "CSE-B", "CSE-C", "CSE-D", "CSE-E"]),
        (3, ["CSE-A", "CSE-B", "CSE-C", "CSE-D"]),
        (4, ["CSE-A", "CSE-B", "CSE-C", "CSE-D"])
    ]
    sections_map = {}  # (year_num, sec_name) -> section
    for year_num, sec_names in sections_spec:
        ay = years_map[year_num]
        for sname in sec_names:
            code = f"Y{year_num}-{sname}"
            sec = db.query(Section).filter_by(code=code).first()
            if not sec:
                sec = Section(
                    name=sname,
                    code=code,
                    department_id=dept.id,
                    academic_year_id=ay.id,
                    academic_period_id=period.id
                )
                db.add(sec)
                db.flush()
            sections_map[(year_num, sname)] = sec

    # 5. Roles
    roles_map = {}
    for r_enum in RoleEnum:
        role = db.query(Role).filter_by(name=r_enum).first()
        if not role:
            role = Role(name=r_enum, description=f"Academic role: {r_enum.value}")
            db.add(role)
            db.flush()
        roles_map[r_enum] = role

    # Helper for creating users
    def get_or_create_user(
        email: str, 
        username: str, 
        full_name: str, 
        role_enums: list[RoleEnum], 
        section_id: int = None
    ) -> User:
        user = db.query(User).filter_by(email=email).first()
        if user:
            # Existing user: preserve existing user and their hashed_password
            return user

        # Require a seed password only when a corresponding account actually needs to be created
        password_plain = None
        role_env_name = None
        if RoleEnum.HOD in role_enums:
            password_plain = settings.SEED_HOD_PASSWORD
            role_env_name = "SEED_HOD_PASSWORD"
        elif RoleEnum.ADVISOR in role_enums:
            password_plain = settings.SEED_ADVISOR_PASSWORD
            role_env_name = "SEED_ADVISOR_PASSWORD"
        elif RoleEnum.MENTOR in role_enums:
            password_plain = settings.SEED_MENTOR_PASSWORD
            role_env_name = "SEED_MENTOR_PASSWORD"
        elif RoleEnum.STUDENT in role_enums:
            password_plain = settings.SEED_STUDENT_PASSWORD
            role_env_name = "SEED_STUDENT_PASSWORD"

        if not password_plain:
            raise RuntimeError(
                f"Cannot create account for '{email}': missing required environment variable '{role_env_name}'. "
                f"Set {role_env_name} in environment to seed this account."
            )

        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=get_password_hash(password_plain),
            is_active=True,
            department_id=dept.id,
            section_id=section_id
        )
        db.add(user)
        db.flush()
        for re in role_enums:
            ur = UserRole(user_id=user.id, role_id=roles_map[re].id)
            db.add(ur)
        db.flush()
        return user

    # 6. HOD User
    hod_user = get_or_create_user(
        email="hod.cse@college.edu",
        username="hod_cse",
        full_name="Dr. K. S. Ramanathan",
        role_enums=[RoleEnum.HOD]
    )

    # 7. Mentors (6 faculty mentors)
    mentor_data = [
        ("mentor.sharma@college.edu", "mentor_sharma", "Dr. Aruna Sharma"),
        ("mentor.patel@college.edu", "mentor_patel", "Dr. Biren Patel"),
        ("mentor.raman@college.edu", "mentor_raman", "Dr. Chitra Raman"),
        ("mentor.kumar@college.edu", "mentor_kumar", "Dr. Dinesh Kumar"),
        ("mentor.mehta@college.edu", "mentor_mehta", "Dr. Esha Mehta"),
        ("mentor.gupta@college.edu", "mentor_gupta", "Dr. Farhan Gupta"),
    ]
    mentors = []
    for email, uname, fname in mentor_data:
        m_user = get_or_create_user(email, uname, fname, [RoleEnum.MENTOR])
        mentors.append(m_user)

    # 8. 13 Section Advisors (1 active per section)
    # Prof. Sneha Kulkarni (advisor.3a) has both ADVISOR and MENTOR roles for testing role switching!
    advisor_specs = [
        (2, "CSE-A", "advisor.2a@college.edu", "adv_2a", "Prof. Rajesh Verma"),
        (2, "CSE-B", "advisor.2b@college.edu", "adv_2b", "Prof. Sunita Rao"),
        (2, "CSE-C", "advisor.2c@college.edu", "adv_2c", "Prof. Amit Sharma"),
        (2, "CSE-D", "advisor.3b@college.edu", "adv_3b", "Prof. Manoj Tiwari"),
        (2, "CSE-E", "advisor.2e@college.edu", "adv_2e", "Prof. Karthik Iyer"),
        (3, "CSE-A", "advisor.3a@college.edu", "adv_3a", "Prof. Sneha Kulkarni"),  # Multi-role!
        (3, "CSE-B", "advisor.2d@college.edu", "adv_2d", "Prof. Priya Nair"),
        (3, "CSE-C", "advisor.3c@college.edu", "adv_3c", "Prof. Deepa Menon"),
        (3, "CSE-D", "advisor.3d@college.edu", "adv_3d", "Prof. Vikram Patel"),
        (4, "CSE-A", "advisor.4a@college.edu", "adv_4a", "Prof. Ananya Sen"),
        (4, "CSE-B", "advisor.4b@college.edu", "adv_4b", "Prof. Suresh Reddy"),
        (4, "CSE-C", "advisor.4c@college.edu", "adv_4c", "Prof. Kavita Joshi"),
        (4, "CSE-D", "advisor.4d@college.edu", "adv_4d", "Prof. Arvind Swamy"),
    ]

    for ynum, sname, email, uname, fname in advisor_specs:
        sec = sections_map[(ynum, sname)]
        roles = [RoleEnum.ADVISOR]
        if uname == "adv_3a":
            roles.append(RoleEnum.MENTOR)  # Enables multi-role switching verification
        adv_user = get_or_create_user(email, uname, fname, roles)
        
        # Ensure active advisor assignment
        adv_assign = db.query(AdvisorAssignment).filter_by(
            section_id=sec.id,
            academic_period_id=period.id,
            is_active=True
        ).first()
        if not adv_assign:
            adv_assign = AdvisorAssignment(
                user_id=adv_user.id,
                section_id=sec.id,
                academic_period_id=period.id,
                is_active=True,
                assigned_by_id=hod_user.id
            )
            db.add(adv_assign)
            db.flush()

    # 9. Seed Projects (Exactly 25 projects)
    now = datetime(2026, 10, 24, 12, 0, tzinfo=timezone.utc)
    base_start = datetime(2026, 8, 1, 9, 0, tzinfo=timezone.utc)
    base_end = datetime(2027, 4, 30, 17, 0, tzinfo=timezone.utc)

    def generate_domain_milestones(p_title: str, p_cat: str, p_idx: int, p_target_status: ProjectStatusEnum):
        s_idx = (p_idx - 1) % 25
        cat = (p_cat or "").lower()
        if "vision" in cat:
            m2_t = f"Phase 2: Vision Pipeline & Edge Sensor Calibration - {p_title}"
            m3_t = f"Phase 3: Real-Time Inference & Tracking Validation - {p_title}"
        elif "cybersecurity" in cat or "security" in cat or "crypto" in cat:
            m2_t = f"Phase 2: Cryptographic Engine & Security Protocol Alpha - {p_title}"
            m3_t = f"Phase 3: Threat Vector Audit & Penetration Hardening - {p_title}"
        elif "iot" in cat or "embedded" in cat or "telematics" in cat:
            m2_t = f"Phase 2: Hardware Telemetry Ingestion & Sensor Prototype - {p_title}"
            m3_t = f"Phase 3: Field Mesh Synchronization & Gateway Stress Test - {p_title}"
        elif "blockchain" in cat:
            m2_t = f"Phase 2: Smart Contract Architecture & Consensus Engine - {p_title}"
            m3_t = f"Phase 3: Testnet Deployment, Gas Audit & Consensus Verification - {p_title}"
        elif "nlp" in cat or "speech" in cat:
            m2_t = f"Phase 2: NLP Pipeline & Transformer Fine-Tuning Alpha - {p_title}"
            m3_t = f"Phase 3: Semantic Benchmarking & Accuracy Optimization - {p_title}"
        elif "ai" in cat or "ml" in cat or "analytics" in cat or "data" in cat:
            m2_t = f"Phase 2: Algorithmic Modeling & Predictive Engine Alpha - {p_title}"
            m3_t = f"Phase 3: Model Cross-Validation & Metric Tuning - {p_title}"
        elif "web" in cat or "mobile" in cat or "enterprise" in cat or "full-stack" in cat:
            m2_t = f"Phase 2: Microservices Backend & UI Interactive Prototype - {p_title}"
            m3_t = f"Phase 3: End-to-End API Integration & Usability Benchmark - {p_title}"
        else:
            m2_t = f"Phase 2: Alpha Architecture & Core Feature Implementation - {p_title}"
            m3_t = f"Phase 3: System Verification & Comprehensive Benchmarking - {p_title}"

        m1_t = f"Phase 1: Requirements Blueprint & Architecture Specification - {p_title}"
        m4_t = f"Phase 4: Production Deployment, Viva Voce & Final Archival - {p_title}"

        return [
            (m1_t, 15 + (s_idx * 2) % 15, MilestoneStatusEnum.APPROVED if p_target_status != ProjectStatusEnum.DRAFT else MilestoneStatusEnum.PENDING),
            (m2_t, 40 + s_idx * 2, MilestoneStatusEnum.APPROVED if p_target_status in [ProjectStatusEnum.COMPLETED, ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW] else (MilestoneStatusEnum.SUBMITTED if p_idx % 3 == 0 else MilestoneStatusEnum.IN_PROGRESS)),
            (m3_t, 90 + s_idx * 2, MilestoneStatusEnum.APPROVED if p_target_status == ProjectStatusEnum.COMPLETED else (MilestoneStatusEnum.REVISION_REQUESTED if p_idx % 5 == 0 else MilestoneStatusEnum.PENDING)),
            (m4_t, 135 + s_idx, MilestoneStatusEnum.COMPLETED if p_target_status == ProjectStatusEnum.COMPLETED else MilestoneStatusEnum.PENDING),
        ]

    def generate_domain_tasks(p_title: str, p_cat: str, p_idx: int):
        s_idx = (p_idx - 1) % 25
        cat = (p_cat or "").lower()

        t1_t = f"System Requirements & Architecture Blueprint for {p_title}"
        if "vision" in cat:
            t2_t = f"Video Stream Ingestion & Camera Calibration for {p_title}"
            t3_t = f"Neural Object Detection & Tracking Engine for {p_title}"
            t4_t = f"Edge Deployment, Alert Telemetry & Cloud Sync for {p_title}"
        elif "cybersecurity" in cat or "security" in cat:
            t2_t = f"Threat Modeling & Authentication Handshake Design for {p_title}"
            t3_t = f"Cryptographic Verification & Session Security Core for {p_title}"
            t4_t = f"Penetration Testing, Hardening & Audit Logs for {p_title}"
        elif "iot" in cat or "embedded" in cat:
            t2_t = f"Circuit Schematics & Microcontroller Sensor Protocol for {p_title}"
            t3_t = f"Firmware Logic & Telemetry Transmission Protocol for {p_title}"
            t4_t = f"Gateway Integration, Cloud Ingestion & Edge Controls for {p_title}"
        elif "blockchain" in cat:
            t2_t = f"Ledger Schema & State Machine Architecture for {p_title}"
            t3_t = f"Smart Contract Implementation & Consensus Logic for {p_title}"
            t4_t = f"Decentralized Oracle Integration & Gas Optimization for {p_title}"
        elif "nlp" in cat or "speech" in cat:
            t2_t = f"Corpus Tokenization, Annotation & Preprocessing for {p_title}"
            t3_t = f"Transformer Fine-Tuning & Embeddings Pipeline for {p_title}"
            t4_t = f"Inference API, Semantic Cache & User Interface for {p_title}"
        elif "ai" in cat or "ml" in cat or "analytics" in cat:
            t2_t = f"Dataset Feature Engineering & Schema Pipeline for {p_title}"
            t3_t = f"Model Training, Gradient Optimization & Validation for {p_title}"
            t4_t = f"Model Serving API & Real-Time Prediction View for {p_title}"
        else:
            t2_t = f"Relational Schema Design & Data Migration for {p_title}"
            t3_t = f"Core Backend Business Logic & REST Services for {p_title}"
            t4_t = f"Frontend Component Integration & State Management for {p_title}"

        t5_t = f"Quantitative Benchmarking, Validation & Technical Docs for {p_title}"

        return [
            (t1_t, 18.0 + (p_idx % 5) * 2, 10 + (s_idx * 2) % 10),
            (t2_t, 26.0 + (p_idx % 7) * 2, 25 + (s_idx * 2) % 14),
            (t3_t, 38.0 + (p_idx % 6) * 3, 46 + (s_idx * 2) % 18),
            (t4_t, 32.0 + (p_idx % 8) * 2, 70 + (s_idx * 2) % 20),
            (t5_t, 22.0 + (p_idx % 4) * 2, 95 + (s_idx * 2) % 22),
        ]

    # Varied status patterns for rich realism
    status_cycle = [
        ProjectStatusEnum.IN_PROGRESS,
        ProjectStatusEnum.APPROVED,
        ProjectStatusEnum.IN_PROGRESS,
        ProjectStatusEnum.SUBMITTED_FOR_FINAL_REVIEW,
        ProjectStatusEnum.IN_PROGRESS,
        ProjectStatusEnum.COMPLETED,
        ProjectStatusEnum.UNDER_REVIEW,
        ProjectStatusEnum.IN_PROGRESS,
    ]

    for idx, (title, desc, cat, ynum, sname) in enumerate(PROJECT_TITLES, start=1):
        pcode = f"PRJ-2026-{idx:03d}"
        project = db.query(Project).filter_by(code=pcode).first()
        sec = sections_map[(ynum, sname)]
        ay = years_map[ynum]
        assigned_mentor = mentors[(idx - 1) % len(mentors)]
        
        # Create team leader and member
        sec_letter = sname.lower().replace("cse-", "")
        lead_uname = f"student_lead_{idx}"
        lead_email = f"student.{ynum}{sec_letter}@college.edu" if idx in [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25] else f"lead{idx}.y{ynum}{sec_letter}@college.edu"
        lead_name = f"Student Lead {idx}"
        lead_user = get_or_create_user(lead_email, lead_uname, lead_name, [RoleEnum.STUDENT], sec.id)

        mem_uname = f"student_mem_{idx}"
        mem_email = f"member{idx}.y{ynum}{sec_letter}@college.edu"
        mem_name = f"Student Teammate {idx}"
        mem_user = get_or_create_user(mem_email, mem_uname, mem_name, [RoleEnum.STUDENT], sec.id)

        target_status = status_cycle[(idx - 1) % len(status_cycle)]
        priority = ProjectPriorityEnum.HIGH if idx % 3 == 0 else (ProjectPriorityEnum.CRITICAL if idx == 12 or idx == 25 else ProjectPriorityEnum.MEDIUM)

        if not project:
            project = Project(
                code=pcode,
                title=title,
                description=desc,
                objectives=f"1. Conduct exhaustive literature review and dataset aggregation.\n2. Design modular architecture and core evaluation algorithms.\n3. Implement end-to-end user application and security safeguards.\n4. Validate quantitative results with real-world department benchmark metrics.",
                category=cat,
                department_id=dept.id,
                academic_year_id=ay.id,
                academic_period_id=period.id,
                section_id=sec.id,
                team_lead_id=lead_user.id,
                mentor_id=assigned_mentor.id,
                start_date=base_start,
                planned_completion_date=base_end if target_status != ProjectStatusEnum.COMPLETED else (base_start + timedelta(days=60)),
                priority=priority,
                status=target_status,
                progress_percentage=0.0,
                health_status=ProjectHealthEnum.ON_TRACK
            )
            db.add(project)
            db.flush()

            # Members
            db.add(ProjectMember(project_id=project.id, user_id=lead_user.id, role_in_team="Leader"))
            db.add(ProjectMember(project_id=project.id, user_id=mem_user.id, role_in_team="Member"))
            
            # Mentor Assignment
            db.add(MentorAssignment(
                project_id=project.id,
                user_id=assigned_mentor.id,
                assigned_by_id=hod_user.id,
                is_active=True,
                notes=f"Assigned based on faculty research specialization in {cat}."
            ))
            db.flush()

            # Tasks (4-5 tasks per project)
            task_templates = generate_domain_tasks(title, cat, idx)
            
            created_tasks = []
            for t_idx, (t_title, t_effort, t_days) in enumerate(task_templates, start=1):
                t_due = base_start + timedelta(days=t_days)
                
                # Determine task status consistent with project status
                if target_status == ProjectStatusEnum.COMPLETED:
                    t_status = TaskStatusEnum.COMPLETED
                    c_frac = 1.0
                elif target_status in [ProjectStatusEnum.DRAFT, ProjectStatusEnum.SUBMITTED, ProjectStatusEnum.UNDER_REVIEW]:
                    t_status = TaskStatusEnum.TO_DO
                    c_frac = 0.0
                else:
                    if t_idx == 1:
                        t_status = TaskStatusEnum.COMPLETED
                        c_frac = 1.0
                    elif t_idx == 2:
                        t_status = TaskStatusEnum.COMPLETED if idx % 2 == 0 else TaskStatusEnum.IN_PROGRESS
                        c_frac = 1.0 if idx % 2 == 0 else 0.75
                    elif t_idx == 3:
                        if idx % 5 == 0:
                            t_status = TaskStatusEnum.BLOCKED
                            c_frac = 0.3
                        elif idx % 4 == 0:
                            t_status = TaskStatusEnum.SUBMITTED_FOR_REVIEW
                            c_frac = 0.9
                        else:
                            t_status = TaskStatusEnum.IN_PROGRESS
                            c_frac = 0.5
                    elif t_idx == 4:
                        t_status = TaskStatusEnum.CHANGES_REQUESTED if idx % 6 == 0 else TaskStatusEnum.TO_DO
                        c_frac = 0.35 if idx % 6 == 0 else 0.0
                    else:
                        t_status = TaskStatusEnum.TO_DO
                        c_frac = 0.0

                task = Task(
                    project_id=project.id,
                    title=t_title,
                    description=f"Standard execution phase deliverable for {title}.",
                    assignee_id=lead_user.id if t_idx % 2 == 1 else mem_user.id,
                    priority=TaskPriorityEnum.HIGH if t_idx in [1, 3] else TaskPriorityEnum.MEDIUM,
                    start_date=base_start + timedelta(days=t_days - 14),
                    due_date=t_due,
                    estimated_effort=t_effort,
                    status=t_status,
                    completion_fraction=c_frac,
                    review_status="Approved" if t_status == TaskStatusEnum.COMPLETED else ("Pending" if t_status == TaskStatusEnum.SUBMITTED_FOR_REVIEW else None)
                )
                db.add(task)
                db.flush()
                created_tasks.append(task)

            # Milestones
            milestone_templates = generate_domain_milestones(title, cat, idx, target_status)
            
            created_milestones = []
            for m_title, m_days, m_status in milestone_templates:
                m_due = base_start + timedelta(days=m_days)
                ms = Milestone(
                    project_id=project.id,
                    title=m_title,
                    description=f"Evaluation checkpoint for {m_title}.",
                    planned_due_date=m_due,
                    completion_criteria="Full committee sign-off with validated test suite.",
                    status=m_status,
                    submission_status="Submitted" if m_status in [MilestoneStatusEnum.SUBMITTED, MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else "Pending",
                    review_status="Approved" if m_status in [MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else ("Revision Requested" if m_status == MilestoneStatusEnum.REVISION_REQUESTED else "Pending"),
                    reviewer_id=assigned_mentor.id if m_status != MilestoneStatusEnum.PENDING else None,
                    reviewer_comments="Well structured deliverable. Proceed to next phase." if m_status == MilestoneStatusEnum.APPROVED else None,
                    completed_at=m_due if m_status in [MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else None
                )
                db.add(ms)
                db.flush()
                created_milestones.append(ms)

            # Link milestone to first two tasks
            if len(created_tasks) >= 2:
                db.add(MilestoneTask(milestone_id=created_milestones[0].id, task_id=created_tasks[0].id))
                db.add(MilestoneTask(milestone_id=created_milestones[0].id, task_id=created_tasks[1].id))

            # Progress Reports & Reviews
            report1 = ProgressReport(
                project_id=project.id,
                submitted_by_id=lead_user.id,
                reporting_period="Month 1 / Initial Cycle",
                work_completed="Completed comprehensive background study, selected dataset schemas, and set up git repository.",
                current_challenges="Configuring high-throughput local hardware acceleration.",
                planned_next_steps="Finalize relational model schema and complete base API endpoints.",
                supporting_evidence="Git commit log hash: c8f4201, design doc draft uploaded.",
                version=1,
                status=ReportStatusEnum.APPROVED if target_status != ProjectStatusEnum.DRAFT else ReportStatusEnum.DRAFT,
                submitted_at=base_start + timedelta(days=25)
            )
            db.add(report1)
            db.flush()

            if report1.status == ReportStatusEnum.APPROVED:
                db.add(ReportReview(
                    report_id=report1.id,
                    reviewer_id=assigned_mentor.id,
                    status=ReportStatusEnum.APPROVED,
                    comments="Strong literature foundation. Keep milestone 2 timeline in focus.",
                    reviewed_at=base_start + timedelta(days=27)
                ))

            # Project Discussion Conversation
            conv = Conversation(
                title=f"{project.code} Technical Discussion",
                conversation_type=ConversationTypeEnum.PROJECT_DISCUSSION,
                project_id=project.id
            )
            db.add(conv)
            db.flush()

            # Add participants
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=lead_user.id))
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=mem_user.id))
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=assigned_mentor.id))
            
            # Initial messages
            db.add(Message(
                conversation_id=conv.id,
                sender_id=assigned_mentor.id,
                content=f"Welcome to the {project.title} workspace. Please review the milestone deadlines and upload the SRS document."
            ))
            db.add(Message(
                conversation_id=conv.id,
                sender_id=lead_user.id,
                content="Thank you Professor. The requirements specification has been submitted for review."
            ))

            # Notifications
            db.add(Notification(
                recipient_id=lead_user.id,
                event_type=NotificationEventTypeEnum.TASK_ASSIGNED,
                title="New Task Assignment",
                message=f"You have been assigned to task: '{created_tasks[0].title}'",
                resource_type="task",
                resource_id=created_tasks[0].id,
                is_read=True
            ))

            if target_status == ProjectStatusEnum.IN_PROGRESS and idx % 4 == 0:
                db.add(Notification(
                    recipient_id=lead_user.id,
                    event_type=NotificationEventTypeEnum.UPCOMING_DEADLINE,
                    title="Milestone Deadline Approaching",
                    message=f"Milestone '{created_milestones[1].title}' is due in 3 days.",
                    resource_type="milestone",
                    resource_id=created_milestones[1].id,
                    is_read=False
                ))

            # Activity
            db.add(ProjectActivity(
                project_id=project.id,
                user_id=lead_user.id,
                activity_type="PROJECT_INITIALIZED",
                description="Project registered and initial task matrix created."
            ))

            # Derived Progress & Health Calculation
            calculated_prog = calculate_project_progress(created_tasks)
            health, reason = evaluate_project_health(
                progress=calculated_prog,
                start_date=project.start_date,
                planned_completion_date=project.planned_completion_date,
                tasks=created_tasks,
                milestones=created_milestones,
                now=now
            )
    # 10. Seed Additional Catalog Projects (PRJ-2026-026 through PRJ-2026-325)
    # Ensures every section has at least 25 projects (total at least 325 projects)
    for cat_idx, (title, desc, prob_stmt, cat, ynum, sname) in enumerate(CATALOG_PROJECTS, start=1):
        idx = 25 + cat_idx
        pcode = f"PRJ-2026-{idx:03d}"
        project = db.query(Project).filter_by(code=pcode).first()
        sec = sections_map[(ynum, sname)]
        ay = years_map[ynum]
        assigned_mentor = mentors[(idx - 1) % len(mentors)]

        # Create student lead and teammate
        lead_uname = f"student_lead_{idx}"
        lead_email = f"lead{idx}.y{ynum}{sname.lower().replace('-', '')}@college.edu"
        lead_name = f"Student Lead {idx}"
        lead_user = get_or_create_user(lead_email, lead_uname, lead_name, [RoleEnum.STUDENT], sec.id)

        mem_uname = f"student_mem_{idx}"
        mem_email = f"member{idx}.y{ynum}{sname.lower().replace('-', '')}@college.edu"
        mem_name = f"Student Teammate {idx}"
        mem_user = get_or_create_user(mem_email, mem_uname, mem_name, [RoleEnum.STUDENT], sec.id)

        target_status = status_cycle[(idx - 1) % len(status_cycle)]
        priority = ProjectPriorityEnum.HIGH if idx % 3 == 0 else (ProjectPriorityEnum.CRITICAL if idx % 7 == 0 else ProjectPriorityEnum.MEDIUM)

        if not project:
            obj_text = (
                f"1. Conduct comprehensive domain literature review and dataset acquisition for {title}.\n"
                f"2. Formulate mathematical/architectural models addressing: {prob_stmt[:120]}...\n"
                f"3. Implement modular, verified software and telemetry pipelines with automated testing.\n"
                f"4. Perform empirical benchmarking against academic and industry baseline standards."
            )

            project = Project(
                code=pcode,
                title=title,
                description=f"{desc} Problem statement: {prob_stmt}",
                objectives=obj_text,
                category=cat,
                department_id=dept.id,
                academic_year_id=ay.id,
                academic_period_id=period.id,
                section_id=sec.id,
                team_lead_id=lead_user.id,
                mentor_id=assigned_mentor.id,
                start_date=base_start,
                planned_completion_date=base_end if target_status != ProjectStatusEnum.COMPLETED else (base_start + timedelta(days=60)),
                priority=priority,
                status=target_status,
                progress_percentage=0.0,
                health_status=ProjectHealthEnum.ON_TRACK
            )
            db.add(project)
            db.flush()

            # Members
            db.add(ProjectMember(project_id=project.id, user_id=lead_user.id, role_in_team="Leader"))
            db.add(ProjectMember(project_id=project.id, user_id=mem_user.id, role_in_team="Member"))

            # Mentor Assignment
            db.add(MentorAssignment(
                project_id=project.id,
                user_id=assigned_mentor.id,
                assigned_by_id=hod_user.id,
                is_active=True,
                notes=f"Supervising research track in {cat}."
            ))
            db.flush()

            # Tasks (4-5 tasks per project)
            task_templates = generate_domain_tasks(title, cat, idx)

            created_tasks = []
            for t_idx, (t_title, t_effort, t_days) in enumerate(task_templates, start=1):
                t_due = base_start + timedelta(days=t_days)
                if target_status == ProjectStatusEnum.COMPLETED:
                    t_status = TaskStatusEnum.COMPLETED
                    c_frac = 1.0
                elif target_status in [ProjectStatusEnum.DRAFT, ProjectStatusEnum.SUBMITTED, ProjectStatusEnum.UNDER_REVIEW]:
                    t_status = TaskStatusEnum.TO_DO
                    c_frac = 0.0
                else:
                    if t_idx == 1:
                        t_status = TaskStatusEnum.COMPLETED
                        c_frac = 1.0
                    elif t_idx == 2:
                        t_status = TaskStatusEnum.COMPLETED if idx % 2 == 0 else TaskStatusEnum.IN_PROGRESS
                        c_frac = 1.0 if idx % 2 == 0 else 0.75
                    elif t_idx == 3:
                        if idx % 5 == 0:
                            t_status = TaskStatusEnum.BLOCKED
                            c_frac = 0.3
                        elif idx % 4 == 0:
                            t_status = TaskStatusEnum.SUBMITTED_FOR_REVIEW
                            c_frac = 0.9
                        else:
                            t_status = TaskStatusEnum.IN_PROGRESS
                            c_frac = 0.5
                    elif t_idx == 4:
                        t_status = TaskStatusEnum.CHANGES_REQUESTED if idx % 6 == 0 else TaskStatusEnum.TO_DO
                        c_frac = 0.35 if idx % 6 == 0 else 0.0
                    else:
                        t_status = TaskStatusEnum.TO_DO
                        c_frac = 0.0

                task = Task(
                    project_id=project.id,
                    title=t_title,
                    description=f"Standard execution phase deliverable for {title}.",
                    assignee_id=lead_user.id if t_idx % 2 == 1 else mem_user.id,
                    priority=TaskPriorityEnum.HIGH if t_idx in [1, 3] else TaskPriorityEnum.MEDIUM,
                    start_date=base_start + timedelta(days=t_days - 14),
                    due_date=t_due,
                    estimated_effort=t_effort,
                    status=t_status,
                    completion_fraction=c_frac,
                    review_status="Approved" if t_status == TaskStatusEnum.COMPLETED else ("Pending" if t_status == TaskStatusEnum.SUBMITTED_FOR_REVIEW else None)
                )
                db.add(task)
                db.flush()
                created_tasks.append(task)

            # Milestones
            milestone_templates = generate_domain_milestones(title, cat, idx, target_status)

            created_milestones = []
            for m_title, m_days, m_status in milestone_templates:
                m_due = base_start + timedelta(days=m_days)
                ms = Milestone(
                    project_id=project.id,
                    title=m_title,
                    description=f"Evaluation checkpoint for {m_title}.",
                    planned_due_date=m_due,
                    completion_criteria="Full committee sign-off with validated test suite.",
                    status=m_status,
                    submission_status="Submitted" if m_status in [MilestoneStatusEnum.SUBMITTED, MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else "Pending",
                    review_status="Approved" if m_status in [MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else ("Revision Requested" if m_status == MilestoneStatusEnum.REVISION_REQUESTED else "Pending"),
                    reviewer_id=assigned_mentor.id if m_status != MilestoneStatusEnum.PENDING else None,
                    reviewer_comments="Well structured deliverable." if m_status in [MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else None,
                    completed_at=m_due if m_status in [MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED] else None
                )
                db.add(ms)
                db.flush()
                created_milestones.append(ms)

            # Link milestone to first two tasks
            if len(created_tasks) >= 2:
                db.add(MilestoneTask(milestone_id=created_milestones[0].id, task_id=created_tasks[0].id))
                db.add(MilestoneTask(milestone_id=created_milestones[0].id, task_id=created_tasks[1].id))

            # Discussion Conversation
            conv = Conversation(
                title=f"{project.code} Technical Discussion",
                conversation_type=ConversationTypeEnum.PROJECT_DISCUSSION,
                project_id=project.id
            )
            db.add(conv)
            db.flush()

            db.add(ConversationParticipant(conversation_id=conv.id, user_id=lead_user.id))
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=mem_user.id))
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=assigned_mentor.id))

            db.add(Message(
                conversation_id=conv.id,
                sender_id=assigned_mentor.id,
                content=f"Welcome to the {project.title} workspace. Please review the milestone deadlines and upload the SRS document."
            ))

            # Derived Progress & Health Calculation
            calculated_prog = calculate_project_progress(created_tasks)
            health, reason = evaluate_project_health(
                progress=calculated_prog,
                start_date=project.start_date,
                planned_completion_date=project.planned_completion_date,
                tasks=created_tasks,
                milestones=created_milestones,
                now=now
            )
            project.progress_percentage = calculated_prog
            project.health_status = health

    # Audit Events for Department Operations
    db.add(AuditEvent(
        user_id=hod_user.id,
        action="INITIALIZE_CSE_DEPARTMENT_PORTAL",
        resource_type="system",
        resource_id=dept.id,
        details="Populated academic year 2026-2027 curriculum and 13 section monitoring boards."
    ))

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db, reset=False)
    finally:
        db.close()
