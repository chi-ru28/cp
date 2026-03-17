from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from auth import is_valid_password

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "farmer" # 'farmer' or 'shopkeeper'
    location: Optional[str] = None

    @validator('password')
    def password_must_be_valid(cls, v):
        if not is_valid_password(v):
            raise ValueError('Password must be at least 8 characters long, contain an uppercase letter, lowercase letter, number, and a special character (&, #, !, *, etc.)')
        return v
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
