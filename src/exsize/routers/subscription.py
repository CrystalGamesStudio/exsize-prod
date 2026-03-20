from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from exsize.database import get_db
from exsize.deps import get_current_user
from exsize.models import Subscription, User

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


class SubscriptionResponse(BaseModel):
    plan: str
    status: str

    model_config = {"from_attributes": True}


@router.post("/checkout")
def checkout(user: User = Depends(get_current_user)):
    raise HTTPException(status_code=503, detail="SizePass is not yet available")


@router.get("", response_model=SubscriptionResponse)
def get_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.family_id is None:
        return SubscriptionResponse(plan="free", status="free")
    sub = db.query(Subscription).filter(Subscription.family_id == user.family_id).first()
    if not sub:
        return SubscriptionResponse(plan="free", status="free")
    return SubscriptionResponse(plan=sub.plan, status=sub.status)
