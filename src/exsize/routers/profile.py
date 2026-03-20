from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from exsize.database import get_db
from exsize.deps import get_current_user
from exsize.models import Transaction, User
from exsize.routers.gamification import LEVEL_NAMES, progress_percent, xp_for_next_level

router = APIRouter(prefix="/api/profile", tags=["profile"])


class TransactionItem(BaseModel):
    id: int
    type: str
    amount: int
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    xp: int
    level: int
    level_name: str
    progress_percent: int
    xp_for_next_level: int
    streak: int
    exbucks_balance: int
    badges: list[str]
    transactions: list[TransactionItem]


def _build_profile(child: User, db: Session) -> ProfileResponse:
    txns = db.query(Transaction).filter(
        Transaction.user_id == child.id,
    ).order_by(Transaction.created_at.desc()).all()

    badges = ["Freemium"]

    return ProfileResponse(
        xp=child.xp,
        level=child.level,
        level_name=LEVEL_NAMES[child.level - 1],
        progress_percent=progress_percent(child.xp, child.level),
        xp_for_next_level=xp_for_next_level(child.level),
        streak=child.streak,
        exbucks_balance=child.exbucks_balance,
        badges=badges,
        transactions=txns,
    )


@router.get("", response_model=ProfileResponse)
def get_own_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "child":
        raise HTTPException(status_code=403, detail="Only children have profiles")
    return _build_profile(user, db)


@router.get("/{child_id}", response_model=ProfileResponse)
def get_child_profile(child_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view child profiles")
    child = db.query(User).filter(
        User.id == child_id,
        User.family_id == user.family_id,
        User.role == "child",
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found in your family")
    return _build_profile(child, db)
