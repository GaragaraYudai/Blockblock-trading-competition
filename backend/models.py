from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    wallet_address = Column(String(42), nullable=False, unique=True, index=True)
    profile_image_url = Column(String(500), nullable=True)
    role = Column(String(20), nullable=False, default="user")  # 'user' or 'admin'
    is_approved = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Trading competition fields (from main.py User model)
    initial_balance = Column(Float, nullable=True)
    current_balance = Column(Float, nullable=True)
    profit_rate = Column(Float, nullable=True, default=0.0)
    rank = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
