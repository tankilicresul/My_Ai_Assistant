from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    from app.models.user import User
    from app.models.system_setting import SystemSetting
    from app.core.security import get_password_hash
    from sqlalchemy import select

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed or ensure Superadmin user and default system settings
    async with AsyncSessionLocal() as session:
        try:
            admin_email = "resultankilic.business@gmail.com"
            stmt = select(User).where(User.email == admin_email)
            res = await session.execute(stmt)
            admin_user = res.scalar_one_or_none()

            admin_password_hash = get_password_hash("RTNKLC_3465")

            if not admin_user:
                admin_user = User(
                    email=admin_email,
                    hashed_password=admin_password_hash,
                    full_name="Resul Tan Kılıç (Superadmin)",
                    role="admin",
                    quota_tokens=999_999_999,
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
                session.add(admin_user)
                print(f"✨ Superadmin created: {admin_email}")
            else:
                # Ensure admin privileges & updated password
                admin_user.role = "admin"
                admin_user.hashed_password = admin_password_hash
                admin_user.is_active = True
                admin_user.is_banned = False
                admin_user.can_chat = True
                admin_user.can_code_studio = True
                admin_user.can_deep_research = True
                admin_user.can_media_gen = True
                admin_user.can_voice = True
                admin_user.can_upload_files = True
                admin_user.can_create_agents = True
                session.add(admin_user)
                print(f"✨ Superadmin refreshed & verified: {admin_email}")

            # Ensure default SystemSetting entry
            stmt_settings = select(SystemSetting)
            settings_res = await session.execute(stmt_settings)
            setting_row = settings_res.scalar_one_or_none()
            if not setting_row:
                setting_row = SystemSetting(
                    maintenance_mode=False,
                    allow_registration=True,
                    system_announcement_title="TanCoreLab Public v1.0",
                    system_announcement_message="Tüm yapay zeka servisleri ve otonom ajanlar genel kullanıma açılmıştır.",
                    system_announcement_type="info",
                    system_announcement_active=False,
                    default_user_quota=100_000_000,
                    default_ai_model="gpt-4o"
                )
                session.add(setting_row)

            await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"⚠️ Error seeding database: {e}")
