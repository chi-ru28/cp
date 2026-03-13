-- AgriAssist Database Schema - Refined Fertilizer Knowledge System
-- Target: PostgreSQL

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY ,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('farmer', 'shopkeeper', 'admin')) DEFAULT 'farmer',
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CROPS TABLE
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY ,
    crop_name VARCHAR(100) UNIQUE NOT NULL,
    crop_category VARCHAR(50), -- grain, vegetable, fruit, tree, plant
    growing_season VARCHAR(50),
    soil_type TEXT
);

-- FERTILIZER_TYPES TABLE
CREATE TABLE IF NOT EXISTS fertilizer_types (
    id UUID PRIMARY KEY ,
    fertilizer_name VARCHAR(255) UNIQUE NOT NULL,
    fertilizer_category VARCHAR(20), -- organic / chemical
    main_nutrients VARCHAR(100), -- nitrogen, phosphorus, potassium
    description TEXT,
    usage_warning TEXT
);

-- CROP_FERTILIZER_MAPPING TABLE
CREATE TABLE IF NOT EXISTS crop_fertilizer_mapping (
    id UUID PRIMARY KEY ,
    crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
    fertilizer_id UUID REFERENCES fertilizer_types(id) ON DELETE CASCADE,
    recommended_quantity_per_acre VARCHAR(100),
    application_stage VARCHAR(50), -- sowing / growth / flowering / fruiting
    application_method TEXT
);

-- SOIL_DEFICIENCY TABLE
CREATE TABLE IF NOT EXISTS soil_deficiency (
    id UUID PRIMARY KEY ,
    deficiency_name VARCHAR(100) NOT NULL,
    symptoms TEXT,
    recommended_fertilizer TEXT,
    organic_solution TEXT,
    chemical_solution TEXT,
    precautions TEXT
);

-- PESTICIDE_SOLUTIONS TABLE
CREATE TABLE IF NOT EXISTS pesticide_solutions (
    id UUID PRIMARY KEY ,
    crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
    pest_name VARCHAR(255) NOT NULL,
    organic_pesticide VARCHAR(255),
    chemical_pesticide VARCHAR(255),
    application_method TEXT,
    safety_warning TEXT
);

-- FARMING_TOOLS TABLE
CREATE TABLE IF NOT EXISTS farming_tools (
    id UUID PRIMARY KEY ,
    tool_name VARCHAR(255) NOT NULL,
    tool_category VARCHAR(100),
    recommended_crop TEXT,
    description TEXT,
    purchase_link VARCHAR(500)
);

-- CROP_ISSUE_REPORTS TABLE
CREATE TABLE IF NOT EXISTS crop_issue_reports (
    id UUID PRIMARY KEY ,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crop_name VARCHAR(100),
    issue_description TEXT,
    detected_problem TEXT,
    recommended_fertilizer TEXT,
    organic_solution TEXT,
    chemical_solution TEXT,
    reference_link VARCHAR(500),
    report_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SHOP_INVENTORY TABLE (For purchase recommendations)
CREATE TABLE IF NOT EXISTS shop_inventory (
    id UUID PRIMARY KEY ,
    shopkeeper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('fertilizer', 'pesticide', 'tool')),
    type VARCHAR(20) CHECK (type IN ('organic', 'chemical')),
    quantity_available INT DEFAULT 0,
    price DECIMAL(10, 2),
    availability BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CHAT_HISTORY TABLE
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY ,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    intent VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY ,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50),
    message TEXT NOT NULL,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FERTILIZER_KNOWLEDGE TABLE (Global Expert Database)
CREATE TABLE IF NOT EXISTS fertilizer_knowledge (
    id SERIAL PRIMARY KEY,
    plant_name VARCHAR(100),
    plant_type VARCHAR(50),
    issue VARCHAR(255),
    recommended_fertilizer VARCHAR(255),
    organic_alternative VARCHAR(255),
    application_stage VARCHAR(255),
    precaution TEXT
);

-- INDEXES
CREATE INDEX idx_crops_name ON crops(crop_name);
CREATE INDEX idx_fertilizer_name ON fertilizer_types(fertilizer_name);
CREATE INDEX idx_soil_deficiency_name ON soil_deficiency(deficiency_name);
CREATE INDEX idx_crop_issue_reports_farmer ON crop_issue_reports(farmer_id);
CREATE INDEX idx_fert_knowledge_crop ON fertilizer_knowledge(plant_name);
