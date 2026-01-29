"""
Database setup script to create the first admin account
Run this once after deployment: python create_admin.py
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Base
from auth import hash_password
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in environment variables")
    print("Please set DATABASE_URL in your .env file")
    exit(1)

# Create engine and session
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_admin():
    """Create the first admin account"""
    
    # Create all tables
    print("📦 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")
    
    db = SessionLocal()
    try:
        # Delete old admin accounts
        old_admin = db.query(User).filter(User.username == "admin").first()
        if old_admin:
            db.delete(old_admin)
            db.commit()
            print("🗑️  Deleted old 'admin' account")
        
        # Check if Water admin already exists
        existing_admin = db.query(User).filter(User.username == "Water").first()
        if existing_admin:
            print("⚠️  Admin account 'Water' already exists!")
            print(f"   Username: {existing_admin.username}")
            print(f"   Role: {existing_admin.role}")
            print(f"   Approved: {existing_admin.is_approved}")
            return
        
        # Create admin account
        admin_user = User(
            username="Water",
            password_hash=hash_password("8888"),
            wallet_address="0x0000000000000000000000000000000000000000",  # Placeholder
            profile_image_url=None,
            role="admin",
            is_approved=True,
            is_active=True,
            initial_balance=0.0,
            current_balance=0.0,
            profit_rate=0.0
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n✅ Admin account created successfully!")
        print("=" * 50)
        print("🔑 Admin Credentials:")
        print("   Username: Water")
        print("   Password: 8888")
        print("=" * 50)
        print("⚠️  IMPORTANT: Change this password after first login!")
        print("\n✨ You can now start the server and login as admin")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin account: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Blockblock Admin Setup")
    print("=" * 50)
    create_admin()
