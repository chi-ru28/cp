from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, Text, DateTime, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    farmer = "farmer"
    shopkeeper = "shopkeeper"

class ProductTypeEnum(str, enum.Enum):
    fertilizer = "fertilizer"
    pesticide = "pesticide"
    tool = "tool"

class CategoryEnum(str, enum.Enum):
    organic = "organic"
    chemical = "chemical"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.farmer)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    shop_inventory = relationship("ShopInventory", back_populates="shopkeeper", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False) # 'user' or 'ai'
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_history")

class ShopInventory(Base):
    __tablename__ = "shop_inventory"

    id = Column(Integer, primary_key=True, index=True)
    shopkeeper_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    product_type = Column(Enum(ProductTypeEnum), nullable=False)
    category = Column(Enum(CategoryEnum), nullable=False)
    quantity_available = Column(Integer, nullable=False, default=0)
    price = Column(Numeric(10, 2), nullable=False)
    availability = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shopkeeper = relationship("User", back_populates="shop_inventory")

class CropAdvisory(Base):
    __tablename__ = "crop_advisory"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(255), nullable=False, index=True)
    fertilizer_recommendation = Column(Text, nullable=True)
    pesticide_recommendation = Column(Text, nullable=True)
    irrigation_advice = Column(Text, nullable=True)
    weather_advice = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_type = Column(String(50), nullable=False) # 'fertilizer' / 'irrigation' / 'pesticide'
    message = Column(Text, nullable=False)
    reminder_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reminders")
