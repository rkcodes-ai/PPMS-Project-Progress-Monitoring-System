import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger("ppms.email")

class EmailService:
    """
    Zero-Cost Modular SMTP Email Service.
    Operates strictly locally by default without requiring any paid email APIs or subscriptions.
    If SMTP is not configured or disabled, calls gracefully fall back to local logging
    and return an accurate diagnostic status without failing any core workflows.
    """

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """
        Returns diagnostic status of the email service.
        """
        is_configured = bool(settings.EMAIL_ENABLED and settings.SMTP_HOST)
        return {
            "enabled": settings.EMAIL_ENABLED,
            "configured": is_configured,
            "host": settings.SMTP_HOST or "none",
            "port": settings.SMTP_PORT,
            "from_email": settings.SMTP_FROM_EMAIL,
            "mode": "live_smtp" if is_configured else "local_fallback",
            "tls": settings.SMTP_TLS,
            "ssl": settings.SMTP_SSL,
            "zero_cost_compliant": True
        }

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends an email if configured, or logs safely if unconfigured/disabled.
        Never throws unhandled exceptions that could block user transactions.
        """
        if not settings.EMAIL_ENABLED or not settings.SMTP_HOST:
            logger.info(
                f"[EmailService - Fallback Log] Email dispatch skipped (SMTP unconfigured or disabled). "
                f"Recipient: {to_email} | Subject: '{subject}'"
            )
            return {
                "delivered": False,
                "status": "skipped",
                "recipient": to_email,
                "reason": "SMTP is disabled or not configured in environment (Local Zero-Cost Mode active)."
            }

        try:
            # Build multipart message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            part_text = MIMEText(body_text, "plain", "utf-8")
            msg.attach(part_text)

            if body_html:
                part_html = MIMEText(body_html, "html", "utf-8")
                msg.attach(part_html)

            # Establish connection
            if settings.SMTP_SSL:
                server = smtplib.SMTP_SSL(
                    settings.SMTP_HOST,
                    settings.SMTP_PORT,
                    timeout=settings.SMTP_TIMEOUT_SECONDS
                )
            else:
                server = smtplib.SMTP(
                    settings.SMTP_HOST,
                    settings.SMTP_PORT,
                    timeout=settings.SMTP_TIMEOUT_SECONDS
                )
                if settings.SMTP_TLS:
                    server.starttls()

            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            server.quit()

            logger.info(f"[EmailService] Email successfully delivered to {to_email}. Subject: '{subject}'")
            return {
                "delivered": True,
                "status": "sent",
                "recipient": to_email,
                "subject": subject
            }

        except Exception as exc:
            logger.warning(
                f"[EmailService] Failed to deliver email to {to_email}: {type(exc).__name__}. "
                f"Core operation continues safely without email."
            )
            return {
                "delivered": False,
                "status": "failed",
                "recipient": to_email,
                "error": str(exc)
            }

    @classmethod
    def send_notification_email(
        cls,
        recipient_email: str,
        recipient_name: str,
        title: str,
        message: str,
        event_type: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Dispatches a formatted notification email for academic events.
        """
        subject = f"[PPMS CSE] {title}"
        body_text = (
            f"Dear {recipient_name},\n\n"
            f"Notification Event: {event_type}\n\n"
            f"{message}\n\n"
            f"Resource: {resource_type or 'General'} #{resource_id or ''}\n"
            f"---\n"
            f"Department of Computer Science & Engineering\n"
            f"Project Progress Monitoring System (PPMS 2026-2027)\n"
            f"Local Portal: {settings.FRONTEND_ORIGIN}\n"
        )
        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 16px;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px;">
                    <h2 style="color: #4f46e5; margin: 0; font-size: 18px;">PPMS Academic Notification</h2>
                    <p style="color: #64748b; margin: 4px 0 0; font-size: 12px;">Department of Computer Science & Engineering</p>
                </div>
                <p>Dear <strong>{recipient_name}</strong>,</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 16px 0;">
                    <h3 style="margin: 0 0 8px; font-size: 14px; color: #0f172a;">{title}</h3>
                    <p style="margin: 0; font-size: 13px; color: #334155;">{message}</p>
                </div>
                <p style="font-size: 12px; color: #64748b;">
                    Event Type: <code>{event_type}</code> | Resource: <code>{resource_type} #{resource_id}</code>
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                    This is an automated notification from the PPMS Zero-Cost Local Engine.<br />
                    Portal: <a href="{settings.FRONTEND_ORIGIN}" style="color: #4f46e5;">{settings.FRONTEND_ORIGIN}</a>
                </p>
            </div>
        </body>
        </html>
        """
        return cls.send_email(recipient_email, subject, body_text, body_html)
