from fastapi import APIRouter, HTTPException, Depends, status
from models import UserCreate, UserLogin, Token
from database import get_database
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import datetime

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "createdAt": datetime.datetime.utcnow()
    }
    
    result = await db["users"].insert_one(user_dict)
    
    # Depending on role, create an entry in farmers or shops collection
    if user.role == "farmer":
        await db["farmers"].insert_one({
            "user": result.inserted_id,
            "createdAt": datetime.datetime.utcnow(),
            "preferredLanguage": "English"
        })
    elif user.role == "shopkeeper":
        await db["shops"].insert_one({
            "user": result.inserted_id,
            "shopName": f"{user.name}'s Shop",
            "createdAt": datetime.datetime.utcnow()
        })
        
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": str(result.inserted_id)}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(
        data={"sub": user.email, "role": db_user["role"], "id": str(db_user["_id"])},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}
