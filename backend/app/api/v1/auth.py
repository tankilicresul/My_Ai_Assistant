from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileUpdateRequest,
    UserPasswordChangeRequest,
    TokenResponse,
    UserResponse
)
from app.api.deps import get_current_user

from app.models.system_setting import SystemSetting

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.strip().lower()

    # Check if registration is open
    stmt_setting = select(SystemSetting)
    res_setting = await db.execute(stmt_setting)
    setting = res_setting.scalar_one_or_none()
    if setting and not setting.allow_registration:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yeni kullanıcı kaydı şu anda yönetici tarafından geçici olarak kapatılmıştır."
        )
    
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Şifre en az 6 karakter olmalıdır."
        )

    stmt = select(User).where(User.email == clean_email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut."
        )

    default_quota = setting.default_user_quota if setting else 100_000_000

    new_user = User(
        email=clean_email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip() if req.full_name else None,
        role="user",
        quota_tokens=default_quota,
        used_tokens=0,
        is_active=True,
        is_banned=False,
        can_chat=True,
        can_code_studio=True,
        can_deep_research=True,
        can_media_gen=True,
        can_voice=True,
        can_upload_files=True,
        can_create_agents=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(new_user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.strip().lower()
    stmt = select(User).where(User.email == clean_email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre."
        )

    if user.is_banned:
        reason = f" Sebep: {user.ban_reason}" if user.ban_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Hesabınız sistem yöneticisi tarafından erişime kapatılmıştır.{reason}"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu hesap devre dışı bırakılmıştır."
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name.strip()
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.put("/password")
async def change_password(
    req: UserPasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.hashed_password or not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifreniz hatalı."
        )
    
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yeni şifre en az 6 karakter olmalıdır."
        )

    current_user.hashed_password = get_password_hash(req.new_password)
    db.add(current_user)
    await db.commit()
    return {"message": "Şifreniz başarıyla güncellendi."}

