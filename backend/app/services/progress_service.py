from datetime import datetime, timezone
from typing import Sequence, Tuple
from app.models.task import Task, TaskStatusEnum
from app.models.milestone import Milestone, MilestoneStatusEnum
from app.models.project import ProjectHealthEnum

def calculate_project_progress(tasks: Sequence[Task]) -> float:
    """
    Implements task-based weighted progress:
    P = 100 * Σ(wᵢ × cᵢ) / Σwᵢ
    
    Where:
    - wᵢ: task weight (estimated_effort, defaults to 1.0 if <= 0)
    - cᵢ: task completion fraction [0.0, 1.0]
    """
    if not tasks:
        return 0.0

    total_weight = 0.0
    weighted_completion = 0.0

    for task in tasks:
        weight = float(task.estimated_effort) if task.estimated_effort and task.estimated_effort > 0 else 1.0
        
        # Calculate completion fraction c_i
        if task.status == TaskStatusEnum.COMPLETED:
            fraction = 1.0
        elif task.status == TaskStatusEnum.TO_DO:
            fraction = 0.0
        elif task.status == TaskStatusEnum.SUBMITTED_FOR_REVIEW:
            fraction = max(0.85, min(1.0, float(task.completion_fraction or 0.85)))
        elif task.status == TaskStatusEnum.CHANGES_REQUESTED:
            fraction = min(0.6, max(0.2, float(task.completion_fraction or 0.4)))
        elif task.status == TaskStatusEnum.BLOCKED:
            fraction = min(0.4, float(task.completion_fraction or 0.0))
        else:  # IN_PROGRESS
            raw = float(task.completion_fraction or 0.5)
            fraction = max(0.0, min(1.0, raw))

        total_weight += weight
        weighted_completion += (weight * fraction)

    if total_weight <= 0.0:
        return 0.0

    progress = (weighted_completion / total_weight) * 100.0
    return round(min(100.0, max(0.0, progress)), 2)

def evaluate_project_health(
    progress: float,
    start_date: datetime,
    planned_completion_date: datetime,
    tasks: Sequence[Task],
    milestones: Sequence[Milestone],
    now: datetime = None
) -> Tuple[ProjectHealthEnum, str]:
    """
    Evaluates project health based on schedule variance, overdue critical milestones,
    blocked tasks, and task statuses.
    Returns: (ProjectHealthEnum, reason_string)
    """
    if progress >= 100.0:
        return ProjectHealthEnum.COMPLETED, "Project successfully completed all deliverables."

    if now is None:
        now = datetime.now(timezone.utc)
    
    # Strip timezone for naive comparison if needed
    if planned_completion_date.tzinfo is None and now.tzinfo is not None:
        now_cmp = now.replace(tzinfo=None)
    elif planned_completion_date.tzinfo is not None and now.tzinfo is None:
        now_cmp = now.replace(tzinfo=timezone.utc)
    else:
        now_cmp = now

    # Check for delayed overall schedule
    if now_cmp > planned_completion_date and progress < 99.0:
        return ProjectHealthEnum.DELAYED, f"Project has passed its planned completion date ({planned_completion_date.strftime('%Y-%m-%d')}) with {progress}% completion."

    # Check for overdue milestones
    overdue_milestones = []
    for m in milestones:
        m_due = m.planned_due_date
        if m_due.tzinfo is None and now.tzinfo is not None:
            m_due_cmp = m_due
        elif m_due.tzinfo is not None and now.tzinfo is None:
            m_due_cmp = m_due.replace(tzinfo=None)
        else:
            m_due_cmp = m_due

        if now_cmp > m_due_cmp and m.status not in [MilestoneStatusEnum.APPROVED, MilestoneStatusEnum.COMPLETED]:
            overdue_milestones.append(m)

    if len(overdue_milestones) >= 2:
        return ProjectHealthEnum.DELAYED, f"{len(overdue_milestones)} critical milestones are overdue."
    elif len(overdue_milestones) == 1:
        return ProjectHealthEnum.AT_RISK, f"Milestone '{overdue_milestones[0].title}' is overdue."

    # Check for blocked tasks
    blocked_tasks = [t for t in tasks if t.status == TaskStatusEnum.BLOCKED]
    if blocked_tasks:
        return ProjectHealthEnum.AT_RISK, f"{len(blocked_tasks)} task(s) currently marked as blocked."

    # Schedule variance calculation
    total_duration = (planned_completion_date - start_date).total_seconds()
    if total_duration > 0:
        elapsed = (now_cmp - (start_date.replace(tzinfo=None) if start_date.tzinfo is None and now_cmp.tzinfo is not None else start_date)).total_seconds()
        elapsed_fraction = max(0.0, min(1.0, elapsed / total_duration))
        expected_progress = elapsed_fraction * 100.0
        
        # If actual progress is more than 20% behind expected elapsed progress
        if (expected_progress - progress) > 25.0:
            return ProjectHealthEnum.AT_RISK, f"Progress is lagging expected timeline by {round(expected_progress - progress, 1)}%."

    return ProjectHealthEnum.ON_TRACK, "Project is progressing on schedule."
