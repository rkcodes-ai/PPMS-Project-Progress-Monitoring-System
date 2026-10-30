# PPMS ZERO-COST AND FREE STACK POLICY

## 1. Absolute Zero-Cost Guarantee

The **Project Progress Monitoring System (PPMS)** enforces a strict, permanent **₹0 Mandatory Cost Policy**:

* **No Paid APIs:** Zero dependencies on commercial LLM or AI APIs (OpenAI, Gemini, Anthropic, etc.).
* **No Paid Cloud Databases:** Zero dependencies on AWS RDS, DynamoDB, Supabase Paid, Neon, or PlanetScale.
* **No Paid Cloud Storage:** Zero dependencies on AWS S3, Google Cloud Storage, Cloudinary, or Azure Blob.
* **No Paid Email or Push Services:** Zero dependencies on SendGrid, Mailgun, Twilio, or Firebase.
* **No Paid Message Queues:** Zero dependencies on AWS SQS, Upstash Redis, or cloud Celery brokers.
* **No Subscription Software:** All tooling, libraries, testing suites, and runtimes are free and open-source.

The application is completely usable offline on Windows once dependencies are installed from local package managers (`pip` and `npm`).

---

## 2. Comprehensive Dependency Registry & Licensing

### Backend (Python / FastAPI)

| Dependency | Purpose | License / Terms | Account Req? | Internet Req? | Payment Req? | Local Replacement / Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| **FastAPI** | High-performance async web framework | MIT License | No | No (after install) | ₹0 Free | Standard library `http.server` |
| **Uvicorn** | ASGI web server runtime | BSD-3-Clause | No | No (after install) | ₹0 Free | Any ASGI/WSGI server |
| **SQLAlchemy** | Relational ORM and connection manager | MIT License | No | No (after install) | ₹0 Free | Standard library `sqlite3` |
| **SQLite** | Embedded zero-config relational database engine | Public Domain | No | No | ₹0 Free | Built into Python standard library |
| **PyJWT** | JWT cryptographic token generation and verification | MIT License | No | No (after install) | ₹0 Free | Standard library `hashlib` + `hmac` |
| **bcrypt** | Adaptive key-derivation password hashing | Apache-2.0 | No | No (after install) | ₹0 Free | Standard library `hashlib.pbkdf2_hmac` |
| **ReportLab** | Offline local PDF certificate generation | BSD-like (Open Source) | No | No (after install) | ₹0 Free | Plain HTML/CSS print or SVG |
| **Pydantic** | Schema validation and data parsing | MIT License | No | No (after install) | ₹0 Free | Standard library `dataclasses` |
| **Pytest** | Automated test runner and quality gate | MIT License | No | No (after install) | ₹0 Free | Standard library `unittest` |
| **smtplib / email** | Modular email communication adapter | Python Standard Library | No | No | ₹0 Free | Fully optional: logs to local stdout |

### Frontend (React / TypeScript / Vite)

| Dependency | Purpose | License / Terms | Account Req? | Internet Req? | Payment Req? | Local Replacement / Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| **React 19** | Declarative component UI library | MIT License | No | No (after install) | ₹0 Free | Vanilla JavaScript / DOM API |
| **TypeScript** | Type safety and static compile check | Apache-2.0 | No | No (after install) | ₹0 Free | JavaScript ES6+ |
| **Vite** | Fast local build tool and dev server | MIT License | No | No (after install) | ₹0 Free | Any static web server |
| **Tailwind CSS** | Utility-first responsive styling framework | MIT License | No | No (after install) | ₹0 Free | Vanilla CSS |
| **Axios** | HTTP client for backend API communication | MIT License | No | No (after install) | ₹0 Free | Standard `window.fetch` |
| **TanStack Query** | Client-side caching and mutation handling | MIT License | No | No (after install) | ₹0 Free | React `useEffect` + `useState` |
| **Lucide React** | Clean, accessible iconography | ISC License | No | No (after install) | ₹0 Free | Inline SVGs |
| **Vitest** | Frontend unit and component test runner | MIT License | No | No (after install) | ₹0 Free | Standard Jest or Node test runner |
| **Playwright** | Browser automation and E2E verification | Apache-2.0 | No | No (uses local Chrome) | ₹0 Free | Manual browser testing |

---

## 3. Disabling and Fallbacks for Optional Integrations

### Modular SMTP Email Adapter

* **Default State:** `EMAIL_ENABLED=false` (Disabled).
* **Behavior When Disabled:** When a notification or deadline alert occurs, the system logs the event locally to stdout via Python's standard logging module:

```text
[EmailService - Fallback Log] Email dispatch skipped (SMTP unconfigured or disabled).
Recipient: student1@college.edu | Subject: '[PPMS CSE] Milestone 1 Submitted'
```

* **Core Preservation:** Under no circumstances will email failure or lack of SMTP credentials block a user from logging in, submitting reports, uploading files, participating in discussions, or downloading certificates.
* **In-App Delivery:** In-app notifications are stored persistently in SQLite and accessible via the persistent notification bell in the UI.

---

## 4. Verification and Compliance Confirmation

1. **No External Network Calls During Execution:** With Vite and Uvicorn running locally, navigating between screens, submitting tasks, chatting in discussions, and downloading certificates makes zero external network requests to third parties.
2. **Local Storage Only:** All files reside in `backend/uploads/` on the local Windows disk.
3. **Database Portability:** SQLite stores the complete state in a single file (`ppms.db`), requiring no daemon processes, ports, or licenses.
