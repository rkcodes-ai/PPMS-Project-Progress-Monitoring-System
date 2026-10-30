# PPMS Phase 8 — Comprehensive Zero-Cost & Dependency Audit

## 1. Executive Summary & Policy Compliance

The Project Progress Monitoring System (PPMS) operates under an absolute, non-negotiable **₹0.00 Mandatory Service Cost Policy**. The entire application—including relational persistence, authentication, role-based authorization, discussions, document uploads, deadline reminders, notifications, and analytics—operates 100% locally on standard workstation infrastructure without paid APIs, paid databases, paid cloud hosting, paid object storage, or recurring software subscriptions.

| Compliance Vector | Policy Requirement | Current Status | Audit Finding |
| --- | --- | --- | --- |
| **Mandatory Cost** | ₹0.00 / $0.00 | **₹0.00** | **PASSED**: Zero paid APIs or external licenses required |
| **Relational Database** | Local Zero-Cost | **SQLite 3.x** | **PASSED**: Embedded ACID relational DB (`ppms.db`) |
| **Document Storage** | Local Zero-Cost | **Local Filesystem** | **PASSED**: Stored in `./uploads/documents` |
| **Authentication** | Self-Hosted / Local | **Local JWT + bcrypt** | **PASSED**: Built-in cryptographic tokens |
| **Messaging / Chat** | Self-Hosted / Local | **Relational SQLite** | **PASSED**: Discussion threads stored in SQLite |
| **Notifications** | Self-Hosted / Local | **In-App + SQLite** | **PASSED**: Real-time polling and persistent badges |
| **External Email** | Optional Only | **Modular SMTP / Fallback** | **PASSED**: Operates seamlessly when disabled |
| **Offline Execution** | Fully Offline Capable | **100% Offline** | **PASSED**: No cloud CDNs or external fonts required |

---

## 2. Dependency Audit & Manifest Verification

### 2.1 Backend Dependencies (`backend/requirements.txt`)

Every backend component utilizes permissive, open-source licenses (MIT, BSD-3, Apache-2.0, LGPL):

| Package | Version | License | Primary Purpose | Cost & Licensing Considerations |
| --- | --- | --- | --- | --- |
| `fastapi` | `>=0.110.0` | MIT | High-performance ASGI REST API framework | Permissive open source; zero cost |
| `uvicorn[standard]` | `>=0.28.0` | BSD-3-Clause | Production-grade ASGI web server | Permissive open source; zero cost |
| `sqlalchemy` | `>=2.0.28` | MIT | Object Relational Mapper (ORM) | Permissive open source; zero cost |
| `alembic` | `>=1.13.1` | MIT | Database schema migration engine | Permissive open source; zero cost |
| `pydantic` | `>=2.6.4` | MIT | Strict data validation and schema serialization | Permissive open source; zero cost |
| `pydantic-settings` | `>=2.2.1` | MIT | Environment variable and `.env` parsing | Permissive open source; zero cost |
| `bcrypt` | `>=4.1.2` | Apache-2.0 | Cryptographic password hashing (12 salt rounds) | Open source cryptographic standard; zero cost |
| `pyjwt` | `>=2.8.0` | MIT | JSON Web Token (JWT) encoding and verification | Open source; zero cost |
| `python-multipart` | `>=0.0.9` | Apache-2.0 | Streaming form data and multipart file uploads | Open source; zero cost |
| `psycopg2-binary` | `>=2.9.9` | LGPL / BSD | Optional PostgreSQL driver (if scaled) | Included for optional PostgreSQL; unused in local mode |
| `reportlab` | `>=5.0.0` | BSD | Local programmatic PDF certificate rendering | Open source engine; zero external PDF service cost |
| `httpx` | `>=0.27.0` | BSD-3-Clause | Asynchronous HTTP client for test suite | Open source test client; zero cost |
| `pytest` | `>=8.1.1` | MIT | Automated test framework | Open source; zero cost |
| `pytest-asyncio` | `>=0.23.5` | Apache-2.0 | Asynchronous test execution for pytest | Open source; zero cost |

### 2.2 Frontend Dependencies (`frontend/package.json`)

All client-side packages are MIT/ISC licensed with zero commercial restrictions:

| Package | Version | License | Primary Purpose | Cost & Licensing Considerations |
| --- | --- | --- | --- | --- |
| `react` | `^19.3.1` | MIT | Core UI component library | Permissive open source; zero cost |
| `react-dom` | `^19.3.1` | MIT | DOM rendering target for React | Permissive open source; zero cost |
| `react-router-dom` | `^7.18.4` | MIT | Client-side routing and navigation | Permissive open source; zero cost |
| `@tanstack/react-query` | `^5.104.5` | MIT | Server-state caching and synchronization | Open source; zero cost |
| `axios` | `^1.20.0` | MIT | HTTP client for REST API communication | Open source; zero cost |
| `lucide-react` | `^1.61.0` | ISC | Modern SVG iconography | Permissive open source; bundled locally |
| `recharts` | `^3.10.1` | MIT | Responsive SVG data visualization charts | Permissive open source; zero cost |
| `tailwindcss` | `^3.4.19` | MIT | Utility-first CSS styling engine | Open source compile-time utility |
| `vite` | `^8.3.4` | MIT | Frontend build tool and development server | Open source build engine |
| `vitest` | `^5.0.5` | MIT | Unit and component testing framework | Open source; zero cost |
| `@playwright/test` | `^1.64.1` | Apache-2.0 | Cross-browser End-to-End integration testing | Open source automation engine |

---

## 3. External Network Connections & Services

### 3.1 Network Communication Matrix

| Source | Destination | Protocol | Trigger | Mandatory? | Fallback Behavior |
| --- | --- | --- | --- | --- | --- |
| Browser Client | `127.0.0.1:8000` | HTTP/REST | UI Interactions & data fetching | Yes (Local) | Standard error notification |
| Backend Server | SQLite file | In-Process C API | All database CRUD operations | Yes (Local) | Transaction rollback |
| Backend Server | Local Filesystem | OS File I/O | Document upload, preview, download | Yes (Local) | HTTP 404 / 500 controlled |
| Backend Server | SMTP Relay | SMTP / SMTPS | Academic deadline reminders (if enabled) | **NO (Optional)** | **Safe local logging; 0 workflow disruption** |

### 3.2 Optional vs. Mandatory Services

1. **Mandatory Services (Cost: ₹0.00)**:
   * **Local Python 3.12 Runtime & FastAPI**: Runs on developer/institution workstation.
   * **Local Node.js 20+ Runtime & Vite**: Compiles and serves React application.
   * **Local SQLite Engine**: File-based ACID storage (`ppms.db`).
   * **Local Filesystem**: Directory-based document storage (`./uploads`).

2. **Optional Services (Cost: ₹0.00)**:
   * **Institutional SMTP Gateway**: Can be configured via `.env` (`EMAIL_ENABLED=true`) for colleges providing campus email relays (e.g. Postfix, Exim, Google Workspace Education).
   * **PostgreSQL (Optional Migration)**: PPMS supports switching `DATABASE_URL` to local PostgreSQL without modifying application logic.

---

## 4. Offline Capabilities & Local Operation

* **Full Air-Gap Capability**: Once npm and pip packages are installed, PPMS requires zero internet connectivity.
* **No External CDN Dependencies**: Lucide icons, fonts, CSS bundles, and JavaScript runtimes are compiled directly into the production distribution directory (`dist/`).
* **PDF Certificate Generation**: ReportLab compiles PDF certificates in-memory using pure Python primitives without external rendering engines or cloud APIs.

---

## 5. Cost Risk Analysis & Mitigation

| Potential Cost Risk | Risk Assessment | Mitigation Implemented |
| --- | --- | --- |
| **Cloud Database Fees** | High risk if migrated to managed DBaaS (AWS RDS, GCP Cloud SQL) | Default architecture strictly locks to local SQLite; documentation provides self-hosted PostgreSQL guide. |
| **SaaS Document Storage** | High risk if migrated to AWS S3, Azure Blob | Stored locally in `./uploads` with automated checksum verification and orphan file detection (`scripts/cleanup_orphans.py`). |
| **Third-Party Email APIs** | Moderate risk if SendGrid, Mailgun, or Resend are used | No third-party email SDKs are imported; pure Python `smtplib` is used with a safe local fallback. |
| **Paid Monitoring / APM** | Moderate risk if Datadog, Sentry, or New Relic are introduced | In-process SQLite `audit_events` table and structured logging handle system diagnostics without external APM services. |

**Audit Verdict**: PPMS fully complies with the ₹0 Mandatory Service Cost Policy.
