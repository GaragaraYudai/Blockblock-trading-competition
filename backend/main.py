# ==============================================================================
# 파일 경로: backend/main.py
# 설명: FastAPI 백엔드 - 인증 시스템 + 관리자 승인 + 리더보드 API
# ==============================================================================

import os
import re
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

# Hyperliquid API
from hyperliquid.info import Info
from hyperliquid.utils.constants import MAINNET_API_URL

# 데이터베이스
from database import get_db
from models import User

# 인증
from auth import (
    hash_password, 
    verify_password, 
    create_access_token, 
    get_current_user,
    get_current_admin
)

# Cloudinary (이미지 업로드)
import cloudinary
import cloudinary.uploader

import asyncio

# ==============================================================================
# 환경변수 설정
# ==============================================================================

# Cloudinary 설정
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# ==============================================================================
# FastAPI 앱
# ==============================================================================

app = FastAPI(
    title="Blockblock Trading Competition API",
    description="Hyperliquid 트레이딩 대회 API with Authentication",
    version="3.0.0",
    redirect_slashes=False  # Prevent 405 errors from trailing slashes
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

class UserRegister(BaseModel):
    """회원가입 요청"""
    username: str
    password: str
    wallet_address: str
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 50:
            raise ValueError('사용자 이름은 2~50자여야 합니다')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.match(r'^\d{4}$', v):
            raise ValueError('비밀번호는 4자리 숫자여야 합니다')
        return v
    
    @field_validator('wallet_address')
    @classmethod
    def validate_wallet(cls, v: str) -> str:
        v = v.lower().strip()
        if not re.match(r'^0x[a-f0-9]{40}$', v):
            raise ValueError('올바른 지갑 주소 형식이 아닙니다 (0x로 시작하는 42자리)')
        return v


class UserLogin(BaseModel):
    """로그인 요청"""
    username: str
    password: str


class UserUpdate(BaseModel):
    """사용자 정보 수정"""
    username: Optional[str] = None
    wallet_address: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: int
    username: str
    wallet_address: str
    profile_image_url: Optional[str]
    role: str
    is_approved: bool
    is_active: bool
    initial_balance: Optional[float]
    current_balance: Optional[float]
    profit_rate: Optional[float]
    rank: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    token_type: str
    user: UserResponse


# ==============================================================================
# API 엔드포인트
# ==============================================================================

@app.get("/")
async def root():
    """헬스체크"""
    return {"status": "online", "message": "Blockblock Trading Competition API v3.0"}


@app.get("/health")
async def health():
    """상세 헬스체크"""
    return {
        "status": "healthy",
        "database": "connected",
        "cloudinary": "configured" if os.getenv("CLOUDINARY_CLOUD_NAME") else "not configured"
    }


# ==============================================================================
# 인증 엔드포인트
# ==============================================================================

@app.post("/api/auth/register", response_model=dict)
async def register(
    username: str = Form(...),
    password: str = Form(...),
    wallet_address: str = Form(...),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    회원가입 (관리자 승인 대기 상태로 등록)
    """
    try:
        # 입력값 검증
        user_data = UserRegister(
            username=username,
            password=password,
            wallet_address=wallet_address
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # 중복 체크
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | 
        (User.wallet_address == user_data.wallet_address)
    ).first()
    
    if existing_user:
        if existing_user.username == user_data.username:
            raise HTTPException(status_code=409, detail="이미 사용 중인 사용자 이름입니다")
        else:
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
                public_id=f"user_{user_data.username}",
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
    
    # DB 저장 (is_approved=False로 설정)
    new_user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        wallet_address=user_data.wallet_address,
        profile_image_url=profile_image_url,
        role="user",
        is_approved=False,  # 관리자 승인 대기
        is_active=True,
        initial_balance=initial_balance,
        current_balance=initial_balance,
        profit_rate=0.0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": f"{new_user.username}님, 가입 신청이 완료되었습니다! 관리자 승인을 기다려주세요.",
        "user_id": new_user.id
    }


@app.options("/api/auth/login")
async def login_options():
    """Handle CORS preflight for login"""
    return {"message": "OK"}


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    로그인
    """
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자 이름 또는 비밀번호가 잘못되었습니다"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자 이름 또는 비밀번호가 잘못되었습니다"
        )
    
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 승인 대기 중입니다"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다"
        )
    
    # JWT 토큰 생성
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 조회
    """
    return UserResponse.from_orm(current_user)


# ==============================================================================
# 관리자 엔드포인트
# ==============================================================================

@app.get("/api/admin/users", response_model=List[UserResponse])
async def get_all_users(
    status_filter: Optional[str] = None,  # 'pending', 'approved', 'all'
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    모든 사용자 목록 조회 (관리자 전용)
    """
    query = db.query(User).filter(User.role != "admin")
    
    if status_filter == "pending":
        query = query.filter(User.is_approved == False)
    elif status_filter == "approved":
        query = query.filter(User.is_approved == True)
    
    users = query.order_by(User.created_at.desc()).all()
    return [UserResponse.from_orm(u) for u in users]


@app.post("/api/admin/approve/{user_id}")
async def approve_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    사용자 승인 (관리자 전용)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="관리자 계정은 승인할 수 없습니다")
    
    user.is_approved = True
    db.commit()
    
    return {
        "success": True,
        "message": f"{user.username}님이 승인되었습니다",
        "user": UserResponse.from_orm(user)
    }


@app.delete("/api/admin/reject/{user_id}")
async def reject_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    사용자 거절/삭제 (관리자 전용)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="관리자 계정은 삭제할 수 없습니다")
    
    username = user.username
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": f"{username}님이 거절/삭제되었습니다"
    }


@app.put("/api/admin/update/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    username: Optional[str] = Form(None),
    wallet_address: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    사용자 정보 수정 (관리자 전용)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    # 사용자 이름 수정
    if username:
        existing = db.query(User).filter(
            User.username == username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="이미 사용 중인 사용자 이름입니다")
        user.username = username
    
    # 지갑 주소 수정
    if wallet_address:
        existing = db.query(User).filter(
            User.wallet_address == wallet_address,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="이미 등록된 지갑 주소입니다")
        user.wallet_address = wallet_address
    
    # 프로필 이미지 수정
    if profile_image:
        try:
            result = cloudinary.uploader.upload(
                profile_image.file,
                folder="blockblock-profiles",
                public_id=f"user_{user.username}",
                overwrite=True,
                transformation=[
                    {"width": 200, "height": 200, "crop": "fill"},
                    {"quality": "auto"},
                    {"format": "webp"}
                ]
            )
            user.profile_image_url = result.get("secure_url")
        except Exception as e:
            print(f"이미지 업로드 실패: {e}")
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)


# ==============================================================================
# 리더보드 API (인증 필요)
# ==============================================================================

def fetch_address_state_sync(address: str, username: str, profile_image_url: str, initial_balance: float):
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
            "username": username,
            "profile_image_url": profile_image_url,
            "accountValue": current_balance,
            "initial_balance": initial_balance,
            "profit_rate": profit_rate,
            "error": None
        }
    except Exception as e:
        return {
            "address": address,
            "username": username,
            "profile_image_url": profile_image_url,
            "accountValue": 0,
            "initial_balance": initial_balance,
            "profit_rate": 0,
            "error": str(e)
        }


@app.get("/leaderboard")
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    리더보드 조회 (인증 필요)
    """
    users = db.query(User).filter(
        User.is_active == True,
        User.is_approved == True,
        User.role == "user"
    ).all()
    
    if not users:
        return []
    
    loop = asyncio.get_running_loop()
    
    tasks = [
        loop.run_in_executor(
            None, 
            fetch_address_state_sync, 
            user.wallet_address,
            user.username,
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
            "name": res["username"],
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
    
    # DB 업데이트
    for item in leaderboard_data:
        user = db.query(User).filter(User.wallet_address == item["address"]).first()
        if user:
            user.current_balance = item["accountValue"]
            user.profit_rate = item["profit_rate"]
            user.rank = item["rank"]
    db.commit()
    
    return leaderboard_data


@app.get("/api/users")
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """등록된 참가자 목록 (인증 필요)"""
    users = db.query(User).filter(
        User.is_active == True,
        User.is_approved == True,
        User.role == "user"
    ).order_by(User.profit_rate.desc()).all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "wallet_address": u.wallet_address,
            "profile_image_url": u.profile_image_url,
            "profit_rate": u.profit_rate,
            "rank": u.rank
        }
        for u in users
    ]
