from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from exsize.database import get_db
from exsize.deps import get_current_user, has_sizepass
from exsize.models import Task, Transaction, User

router = APIRouter(prefix="/api", tags=["dashboard"])

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class ChildStats(BaseModel):
    id: int
    email: str
    tasks_completed_percent: int
    streak: int
    exbucks_earned: int
    exbucks_spent: int


class DayChild(BaseModel):
    child_id: int
    email: str
    total: int
    approved: int


class AdvancedChildStats(BaseModel):
    id: int
    email: str
    total_tasks: int
    approved_tasks: int
    xp: int
    level: int


class AdvancedStats(BaseModel):
    total_xp_earned: int
    best_streak: int
    children: list[AdvancedChildStats]


class DashboardResponse(BaseModel):
    children: list[ChildStats]
    weekly_overview: dict[str, list[DayChild]]
    advanced_stats: AdvancedStats | None = None


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view the dashboard")
    if user.family_id is None:
        raise HTTPException(status_code=400, detail="Must be in a family")

    children = db.query(User).filter(
        User.family_id == user.family_id,
        User.role == "child",
    ).all()

    tasks = db.query(Task).filter(Task.family_id == user.family_id).all()

    child_stats = []
    for child in children:
        child_tasks = [t for t in tasks if t.assigned_to == child.id]
        total = len(child_tasks)
        approved = sum(1 for t in child_tasks if t.status == "approved")
        pct = int(approved * 100 / total) if total > 0 else 0

        txns = db.query(Transaction).filter(Transaction.user_id == child.id).all()
        earned = sum(t.amount for t in txns if t.type == "earned")
        spent = sum(t.amount for t in txns if t.type == "spent")

        child_stats.append(ChildStats(
            id=child.id,
            email=child.email,
            tasks_completed_percent=pct,
            streak=child.streak,
            exbucks_earned=earned,
            exbucks_spent=spent,
        ))

    weekly_overview: dict[str, list[DayChild]] = {day: [] for day in DAYS}
    for child in children:
        for day in DAYS:
            day_tasks = [t for t in tasks if t.assigned_to == child.id and t.day_of_week == day]
            if day_tasks:
                weekly_overview[day].append(DayChild(
                    child_id=child.id,
                    email=child.email,
                    total=len(day_tasks),
                    approved=sum(1 for t in day_tasks if t.status == "approved"),
                ))

    advanced_stats = None
    if has_sizepass(user.family_id, db):
        total_xp = sum(c.xp for c in children)
        best_streak = max((c.streak for c in children), default=0)
        adv_children = []
        for child in children:
            child_tasks = [t for t in tasks if t.assigned_to == child.id]
            adv_children.append(AdvancedChildStats(
                id=child.id,
                email=child.email,
                total_tasks=len(child_tasks),
                approved_tasks=sum(1 for t in child_tasks if t.status == "approved"),
                xp=child.xp,
                level=child.level,
            ))
        advanced_stats = AdvancedStats(
            total_xp_earned=total_xp,
            best_streak=best_streak,
            children=adv_children,
        )

    return DashboardResponse(
        children=child_stats,
        weekly_overview=weekly_overview,
        advanced_stats=advanced_stats,
    )
