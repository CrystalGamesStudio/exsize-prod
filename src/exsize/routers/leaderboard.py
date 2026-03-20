from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from exsize.database import get_db
from exsize.deps import get_current_user, has_sizepass
from exsize.models import User

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    id: int
    email: str
    xp: int
    level: int


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]


@router.get("", response_model=LeaderboardResponse)
def get_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.family_id is None:
        raise HTTPException(status_code=400, detail="Must be in a family")
    if not has_sizepass(user.family_id, db):
        raise HTTPException(status_code=403, detail="Sibling leaderboard requires SizePass. Upgrade to access.")
    children = db.query(User).filter(
        User.family_id == user.family_id,
        User.role == "child",
    ).order_by(User.xp.desc()).all()
    entries = [
        LeaderboardEntry(id=c.id, email=c.email, xp=c.xp, level=c.level)
        for c in children
    ]
    return LeaderboardResponse(entries=entries)
