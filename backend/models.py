from sqlalchemy import Column, String, Boolean, ForeignKey, Enum, Text, DateTime, Numeric, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="farmer")
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Crop(Base):
    __tablename__ = "crops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(255))
    growing_season = Column(String(255))
    soil_type = Column(Text)

class FertilizerKnowledge(Base):
    __tablename__ = "fertilizer_knowledge"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fertilizer_name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(255)) # organic / chemical
    plant_name = Column(String(100), index=True)
    plant_type = Column(String(50))
    issue = Column(String(255))
    recommended_quantity = Column(String(100))
    application_stage = Column(String(255))
    application_method = Column(Text)
    precaution = Column(Text)
    main_nutrients = Column(String(255))
    description = Column(Text)
    usage_warning = Column(Text)

class CropFertilizerMapping(Base):
    __tablename__ = "crop_fertilizer_mapping"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_id = Column(UUID(as_uuid=True), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    fertilizer_id = Column(UUID(as_uuid=True), ForeignKey("fertilizer_knowledge.id", ondelete="CASCADE"), nullable=False)
    recommended_quantity = Column(String(100))
    application_stage = Column(String(255))
    application_method = Column(Text)

class SoilIssue(Base):
    __tablename__ = "soil_issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deficiency_name = Column(String(255), nullable=False, index=True)
    symptoms = Column(Text)
    recommended_fertilizer = Column(Text)
    organic_solution = Column(Text)
    chemical_solution = Column(Text)
    precautions = Column(Text)
    reference_link = Column(String(500))

class PesticideKnowledge(Base):
    __tablename__ = "pesticide_knowledge"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), index=True)
    pest_name = Column(String(255))
    organic_pesticide = Column(String(255))
    chemical_pesticide = Column(String(255))
    application_method = Column(Text)
    safety_warning = Column(Text)

class Tool(Base):
    __tablename__ = "tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tool_name = Column(String(255), nullable=False, index=True)
    tool_category = Column(String(100))
    recommended_crop = Column(Text)
    description = Column(Text)
    purchase_link = Column(String(500))
    image_url = Column(Text, nullable=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shopkeeper_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    type = Column(String(20), nullable=False)
    quantity_available = Column(Numeric, default=0)
    price = Column(Numeric(10, 2), nullable=False)
    availability = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Chat")
    role = Column(String(20), nullable=False, default="farmer")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(10), nullable=False) # 'user' or 'ai'
    message = Column(Text, nullable=False)
    context_used = Column(JSON, nullable=True) # To store DB context from RAG
    intent = Column(String(100), nullable=True)
    language = Column(String(10), default="en")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_type = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    reminder_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CropImage(Base):
    __tablename__ = "crop_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    description = Column(JSON, nullable=True) # JSON results of analysis
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shopkeeper_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    target_crop = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FertilizerDosage(Base):
    __tablename__ = "fertilizer_dosage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop = Column(String(100), nullable=False, index=True)
    fertilizer = Column(String(100), nullable=False, index=True)
    min_dose = Column(Numeric(10, 2), nullable=False)   # kg per acre
    max_dose = Column(Numeric(10, 2), nullable=False)   # kg per acre
    unit = Column(String(20), nullable=False, default="kg")

class FertilizerCompatibility(Base):
    __tablename__ = "fertilizer_compatibility"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fertilizer_1 = Column(String(100), nullable=False, index=True)
    fertilizer_2 = Column(String(100), nullable=False, index=True)
    compatible = Column(Boolean, nullable=False, default=True)
    warning = Column(Text, nullable=True)

class AppTranslation(Base):
    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    language = Column(String(10), index=True)
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
