import secrets

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from exsize.database import get_db
from exsize.deps import get_current_user
from exsize.models import ApiToken, User
from exsize.security import hash_password, verify_password

router = APIRouter(prefix="/api/cryplo", tags=["cryplo"])


class TokenResponse(BaseModel):
    id: int
    token: str


@router.post("/tokens", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def generate_token(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    raw_token = f"exs_{secrets.token_hex(32)}"
    api_token = ApiToken(
        token_hash=hash_password(raw_token),
        user_id=user.id,
    )
    db.add(api_token)
    db.commit()
    db.refresh(api_token)
    return TokenResponse(id=api_token.id, token=raw_token)


class TokenListItem(BaseModel):
    id: int
    is_active: bool
    created_at: datetime | None


@router.get("/tokens", response_model=list[TokenListItem])
def list_tokens(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tokens = db.query(ApiToken).filter(ApiToken.user_id == user.id).all()
    return [
        TokenListItem(id=t.id, is_active=t.revoked_at is None, created_at=t.created_at)
        for t in tokens
    ]


@router.patch("/tokens/{token_id}/revoke", response_model=TokenListItem)
def revoke_token(token_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_token = db.query(ApiToken).filter(
        ApiToken.id == token_id, ApiToken.user_id == user.id,
    ).first()
    if not api_token:
        raise HTTPException(status_code=404, detail="Token not found")
    api_token.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return TokenListItem(id=api_token.id, is_active=False, created_at=api_token.created_at)


class VerifyRequest(BaseModel):
    token: str


class VerifyResponse(BaseModel):
    valid: bool
    user_id: int | None = None
    email: str | None = None
    username: str | None = None
    error: str | None = None


@router.post("/verify-token", response_model=VerifyResponse)
def verify_token(body: VerifyRequest, db: Session = Depends(get_db)):
    for api_token in db.query(ApiToken).filter(ApiToken.revoked_at.is_(None)).all():
        if verify_password(body.token, api_token.token_hash):
            user = db.query(User).filter(User.id == api_token.user_id).first()
            return VerifyResponse(
                valid=True,
                user_id=user.id,
                email=user.email,
                username=user.nickname,
            )
    return JSONResponse(status_code=401, content={"valid": False, "error": "invalid_token"})
