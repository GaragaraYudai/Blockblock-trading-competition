from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    wallet_address = Column(String, nullable=False, unique=True)
    profile_image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
