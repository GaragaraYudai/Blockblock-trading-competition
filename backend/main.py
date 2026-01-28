# ==============================================================================
# 파일 경로: backend/main.py
# 설명: FastAPI 백엔드 - 참가 신청 API + 리더보드 API (DB 연동)
# ==============================================================================

import os
import re
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# Hyperliquid API
from hyperliquid.info import Info
from hyperliquid.utils.constants import MAINNET_API_URL

# 데이터베이스
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func

# Cloudinary (이미지 업로드)
import cloudinary
import cloudinary.uploader

import asyncio

# ==============================================================================
# 환경변수 설정
# ==============================================================================

# 데이터베이스 URL (Railway에서 자동 설정)
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Cloudinary 설정
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# ==============================================================================
# 데이터베이스 설정
# ==============================================================================

if DATABASE_URL:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    SessionLocal = None

Base = declarative_base()


# ==============================================================================
# 데이터베이스 모델
# ==============================================================================

class User(Base):
    """참가자 테이블"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), nullable=False, index=True)
    wallet_address = Column(String(42), unique=True, nullable=False, index=True)
    profile_image_url = Column(String(500), nullable=True)
    initial_balance = Column(Float, nullable=True)
    current_balance = Column(Float, nullable=True)
    profit_rate = Column(Float, nullable=True, default=0.0)
    rank = Column(Integer, nullable=True)
    twitter_handle = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# 테이블 생성
if engine:
    Base.metadata.create_all(bind=engine)


# ==============================================================================
# FastAPI 앱
# ==============================================================================

app = FastAPI(
    title="Blockblock Trading Competition API",
    description="Hyperliquid 트레이딩 대회 API",
    version="2.0.0"
)

# CORS 설정 (프론트엔드 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hyperliquid API
info = Info(MAINNET_API_URL, skip_ws=True)


# ==============================================================================
# Pydantic 모델 (요청/응답)
# ==============================================================================

class UserCreate(BaseModel):
    """참가 신청 요청"""
    nickname: str
    wallet_address: str
    twitter_handle: Optional[str] = None
    
    @field_validator('wallet_address')
    @classmethod
    def validate_wallet(cls, v: str) -> str:
        v = v.lower().strip()
        if not re.match(r'^0x[a-f0-9]{40}$', v):
            raise ValueError('올바른 지갑 주소 형식이 아닙니다 (0x로 시작하는 42자리)')
        return v
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 50:
            raise ValueError('닉네임은 2~50자여야 합니다')
        return v


# ==============================================================================
# API 엔드포인트
# ==============================================================================

@app.get("/")
async def root():
    """헬스체크"""
    return {"status": "online", "message": "Blockblock Trading Competition API v2.0"}


@app.get("/health")
async def health():
    """상세 헬스체크"""
    return {
        "status": "healthy",
        "database": "connected" if DATABASE_URL else "not configured",
        "cloudinary": "configured" if os.getenv("CLOUDINARY_CLOUD_NAME") else "not configured"
    }


# ------------------------------------------------------------------------------
# 참가 신청 API
# ------------------------------------------------------------------------------

@app.post("/api/register")
async def register_user(
    nickname: str = Form(...),
    wallet_address: str = Form(...),
    twitter_handle: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None)
):
    """트레이딩 대회 참가 신청"""
    
    if not SessionLocal:
        raise HTTPException(status_code=500, detail="데이터베이스가 연결되지 않았습니다")
    
    # 입력값 검증
    try:
        user_data = UserCreate(
            nickname=nickname,
            wallet_address=wallet_address,
            twitter_handle=twitter_handle
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    db = SessionLocal()
    try:
        # 중복 체크
        existing = db.query(User).filter(User.wallet_address == user_data.wallet_address).first()
        if existing:
            raise HTTPException(status_code=409, detail="이미 등록된 지갑 주소입니다")
        
        # 이미지 업로드 (Cloudinary)
        profile_image_url = None
        if profile_image:
            try:
                allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
                if profile_image.content_type not in allowed:
                    raise HTTPException(status_code=400, detail="JPG, PNG, GIF, WebP 이미지만 가능합니다")
                
                result = cloudinary.uploader.upload(
                    profile_image.file,
                    folder="blockblock-profiles",
                    public_id=f"user_{user_data.wallet_address[:10]}",
                    overwrite=True,
                    transformation=[
                        {"width": 200, "height": 200, "crop": "fill"},
                        {"quality": "auto"},
                        {"format": "webp"}
                    ]
                )
                profile_image_url = result.get("secure_url")
            except Exception as e:
                print(f"이미지 업로드 실패: {e}")
        
        # 초기 자산 조회
        initial_balance = None
        try:
            user_state = info.user_state(user_data.wallet_address)
            margin_summary = user_state.get("marginSummary", {})
            initial_balance = float(margin_summary.get("accountValue", 0))
        except Exception as e:
            print(f"초기 자산 조회 실패: {e}")
        
        # DB 저장
        new_user = User(
            nickname=user_data.nickname,
            wallet_address=user_data.wallet_address,
            profile_image_url=profile_image_url,
            twitter_handle=user_data.twitter_handle,
            initial_balance=initial_balance,
            current_balance=initial_balance,
            profit_rate=0.0,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": f"{new_user.nickname}님, 참가 신청이 완료되었습니다!",
            "user": {
                "id": new_user.id,
                "nickname": new_user.nickname,
                "wallet_address": new_user.wallet_address,
                "profile_image_url": new_user.profile_image_url,
                "initial_balance": new_user.initial_balance
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"등록 실패: {str(e)}")
    finally:
        db.close()


# ------------------------------------------------------------------------------
# 리더보드 API
# ------------------------------------------------------------------------------

def fetch_address_state_sync(address: str, nickname: str, profile_image_url: str, initial_balance: float):
    """유저 자산 조회 (동기)"""
    try:
        user_state = info.user_state(address)
        margin_summary = user_state.get("marginSummary", {})
        current_balance = float(margin_summary.get("accountValue", 0))
        
        profit_rate = 0.0
        if initial_balance and initial_balance > 0:
            profit_rate = ((current_balance - initial_balance) / initial_balance) * 100
        
        return {
            "address": address,
            "nickname": nickname,
            "profile_image_url": profile_image_url,
            "accountValue": current_balance,
            "initial_balance": initial_balance,
            "profit_rate": profit_rate,
            "error": None
        }
    except Exception as e:
        return {
            "address": address,
            "nickname": nickname,
            "profile_image_url": profile_image_url,
            "accountValue": 0,
            "initial_balance": initial_balance,
            "profit_rate": 0,
            "error": str(e)
        }


@app.get("/leaderboard")
async def get_leaderboard():
    """리더보드 조회"""
    
    if not SessionLocal:
        return await get_leaderboard_legacy()
    
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        
        if not users:
            return await get_leaderboard_legacy()
        
        loop = asyncio.get_running_loop()
        
        tasks = [
            loop.run_in_executor(
                None, 
                fetch_address_state_sync, 
                user.wallet_address,
                user.nickname,
                user.profile_image_url,
                user.initial_balance or 0
            )
            for user in users
        ]
        
        results = await asyncio.gather(*tasks)
        
        leaderboard_data = []
        for res in results:
            leaderboard_data.append({
                "address": res["address"],
                "name": res["nickname"],
                "avatar": res["profile_image_url"] or "/images/avatars/default.jpg",
                "accountValue": res["accountValue"],
                "equity": res["accountValue"],
                "roi24h": res["profit_rate"],
                "profit_rate": res["profit_rate"],
                "initial_balance": res["initial_balance"]
            })
        
        leaderboard_data.sort(key=lambda x: x["profit_rate"], reverse=True)
        
        for i, item in enumerate(leaderboard_data):
            item["rank"] = i + 1
        
        for item in leaderboard_data:
            user = db.query(User).filter(User.wallet_address == item["address"]).first()
            if user:
                user.current_balance = item["accountValue"]
                user.profit_rate = item["profit_rate"]
                user.rank = item["rank"]
        db.commit()
        
        return leaderboard_data
        
    except Exception as e:
        print(f"리더보드 조회 오류: {e}")
        return await get_leaderboard_legacy()
    finally:
        db.close()


# ------------------------------------------------------------------------------
# 기존 하드코딩 방식 (하위 호환용)
# ------------------------------------------------------------------------------

TEST_ADDRESSES = [
    "0xdfc7da625a62372c050cf649392c6d482270d4d8", 
    "0x010461c14e146305d262fc7b8f949823ce2ebdf3", 
    "0x5db96973c0515152cb520b73c4eb826880026e49", 
]

def fetch_address_state_sync_legacy(address: str):
    try:
        user_state = info.user_state(address)
        return {"address": address, "data": user_state, "error": None}
    except Exception as e:
        return {"address": address, "data": None, "error": str(e)}


async def get_leaderboard_legacy():
    loop = asyncio.get_running_loop()
    
    tasks = [
        loop.run_in_executor(None, fetch_address_state_sync_legacy, address)
        for address in TEST_ADDRESSES
    ]
    
    results = await asyncio.gather(*tasks)
    
    leaderboard_data = []
    for res in results:
        if res["error"]:
            continue
        
        data = res["data"]
        margin_summary = data.get("marginSummary", {})
        account_value = float(margin_summary.get("accountValue", 0))
        
        leaderboard_data.append({
            "address": res["address"],
            "accountValue": account_value,
            "equity": account_value,
            "roi24h": 0
        })
    
    leaderboard_data.sort(key=lambda x: x["accountValue"], reverse=True)
    
    for i, item in enumerate(leaderboard_data):
        item["rank"] = i + 1
    
    return leaderboard_data


@app.get("/api/users")
async def get_users():
    """등록된 참가자 목록"""
    if not SessionLocal:
        return []
    
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).order_by(desc(User.profit_rate)).all()
        return [
            {
                "id": u.id,
                "nickname": u.nickname,
                "wallet_address": u.wallet_address,
                "profile_image_url": u.profile_image_url,
                "profit_rate": u.profit_rate,
                "rank": u.rank
            }
            for u in users
        ]
    finally:
        db.close()
