-- PostgreSQL Database Schema for AgriAssist
-- This script creates the core table structures required for the Fertilizer Knowledge & Crop Analysis System

-- Drop tables if they exist to prevent conflicts during fresh setup
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS crop_issue_reports CASCADE;
DROP TABLE IF EXISTS farming_tools CASCADE;
DROP TABLE IF EXISTS pesticide_solutions CASCADE;
DROP TABLE IF EXISTS soil_deficiency CASCADE;
DROP TABLE IF EXISTS crop_fertilizer_mapping CASCADE;
DROP TABLE IF EXISTS fertilizer_types CASCADE;
DROP TABLE IF EXISTS crops CASCADE;

-- 0. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY ,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'farmer',
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Crops Table
CREATE TABLE crops (
    id UUID PRIMARY KEY ,
    crop_name VARCHAR(100) UNIQUE NOT NULL,
    crop_category VARCHAR(50), -- grain, vegetable, fruit, tree, plant
    growing_season VARCHAR(50),
    soil_type TEXT
);

-- 2. Fertilizer Types Table
CREATE TABLE fertilizer_types (
    id UUID PRIMARY KEY ,
    fertilizer_name VARCHAR(255) UNIQUE NOT NULL,
    fertilizer_category VARCHAR(20), -- organic / chemical
    main_nutrients VARCHAR(100), -- nitrogen, phosphorus, potassium
    description TEXT,
    usage_warning TEXT
);

-- 3. Crop to Fertilizer Mapping Table
CREATE TABLE crop_fertilizer_mapping (
    id UUID PRIMARY KEY ,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    fertilizer_id UUID NOT NULL REFERENCES fertilizer_types(id) ON DELETE CASCADE,
    recommended_quantity_per_acre VARCHAR(100),
    application_stage VARCHAR(50), -- sowing / growth / flowering / fruiting
    application_method TEXT
);

-- 4. Soil Deficiency Table
CREATE TABLE soil_deficiency (
    id UUID PRIMARY KEY ,
    deficiency_name VARCHAR(100) NOT NULL,
    symptoms TEXT,
    recommended_fertilizer TEXT,
    organic_solution TEXT,
    chemical_solution TEXT,
    precautions TEXT
);

-- 5. Pesticide Solutions Table
CREATE TABLE pesticide_solutions (
    id UUID PRIMARY KEY ,
    crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
    pest_name VARCHAR(255) NOT NULL,
    organic_pesticide VARCHAR(255),
    chemical_pesticide VARCHAR(255),
    application_method TEXT,
    safety_warning TEXT
);

-- 6. Farming Tools Table
CREATE TABLE farming_tools (
    id UUID PRIMARY KEY ,
    tool_name VARCHAR(255) NOT NULL,
    tool_category VARCHAR(100),
    recommended_crop TEXT,
    description TEXT,
    purchase_link VARCHAR(500)
);

-- 7. Crop Issue Reports Table
CREATE TABLE crop_issue_reports (
    id UUID PRIMARY KEY ,
    farmer_id UUID, -- Usually references a users table
    crop_name VARCHAR(100),
    issue_description TEXT,
    detected_problem TEXT,
    recommended_fertilizer TEXT,
    organic_solution TEXT,
    chemical_solution TEXT,
    reference_link VARCHAR(500),
    report_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create Indexes for faster searching
CREATE INDEX idx_crops_name ON crops(crop_name);
CREATE INDEX idx_fertilizer_name ON fertilizer_types(fertilizer_name);
CREATE INDEX idx_soil_deficiency_name ON soil_deficiency(deficiency_name);
