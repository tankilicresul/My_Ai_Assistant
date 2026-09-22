from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Devam etmek için lütfen giriş yapınız veya kayıt olunuz.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(auth.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş oturum anahtarı. Lütfen tekrar giriş yapınız.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı hesabı bulunamadı veya devre dışı bırakılmış.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if user.is_banned:
        reason = f" Sebep: {user.ban_reason}" if user.ban_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Hesabınız sistem yöneticisi tarafından askıya alınmıştır.{reason}"
        )

    return user

async def get_current_admin_user(
    user: User = Depends(get_current_user)
) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gereklidir."
        )
    return user
