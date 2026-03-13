import random
import uuid

# Base data sets for procedural generation
CROP_CATEGORIES = ["grain", "vegetable", "fruit", "tree", "plant"]
SEASONS = ["Kharif", "Rabi", "Zaid", "Perennial", "Summer", "Winter"]
SOIL_TYPES = ["Alluvial", "Black", "Red", "Laterite", "Desert", "Loamy", "Clay", "Sandy"]

FERTILIZER_CATEGORIES = ["organic", "chemical"]
NUTRIENT_PROFILES = [
    "Nitrogen (N) High", "Phosphorus (P) High", "Potassium (K) High",
    "Balanced NPK (19:19:19)", "Balanced NPK (20:20:20)", "Zinc Enriched",
    "Sulphur Enriched", "Calcium Enriched"
]

APPLICATION_STAGES = ["sowing", "growth", "flowering", "fruiting", "harvest"]
APPLICATION_METHODS = ["Broadcasting", "Foliar Spray", "Band Placement", "Fertigation", "Basal Application"]

SYMPTOMS = [
    "Yellowing of older leaves", "Stunted growth", "Purple discoloration on stems",
    "Brown edges on leaves", "Curling leaves", "White spots on leaves", "Premature fruit drop"
]

def generate_sql():
    sql = "-- Auto-generated Fertilizer and Crop Dataset (500+ items)\n\n"
    
    # Generate 500 Crops
    crops = []
    base_crops = ["Wheat", "Rice", "Maize", "Tomato", "Potato", "Onion", "Mango", "Banana", "Apple", "Orange", "Guava", 
                  "Cotton", "Sugarcane", "Tea", "Coffee", "Rubber", "Jute", "Soybean", "Groundnut", "Mustard"]
    
    # We will expand the base list logically to reach 500
    prefixes = ["Red ", "Green ", "Sweet ", "Hybrid ", "Dwarf ", "Giant ", "Wild ", "Mountain ", "Desert ", "Tropical "]
    
    crop_id_map = {} # Name to UUID mapping for foreign keys
    fertilizer_id_map = {}
    
    sql += "-- 1. Insert 500+ Crops\n"
    for i in range(1, 510):
        base_name = random.choice(base_crops)
        prefix = random.choice(prefixes) if i > len(base_crops) else ""
        unique_suffix = f" Var. {i}" if i > len(base_crops) else ""
        
        crop_name = f"{prefix}{base_name}{unique_suffix}".strip()
        crop_id = str(uuid.uuid4())
        crop_id_map[crop_name] = crop_id
        
        cat = random.choice(CROP_CATEGORIES)
        season = random.choice(SEASONS)
        soil = random.choice(SOIL_TYPES)
        
        sql += f"INSERT INTO crops (id, crop_name, crop_category, growing_season, soil_type) VALUES ('{crop_id}', '{crop_name}', '{cat}', '{season}', '{soil}');\n"

    # Generate 50 Fertilizers
    sql += "\n-- 2. Insert Fertilizer Types\n"
    base_fertilizers = ["Urea", "DAP", "MOP", "SSP", "Compost", "Vermicompost", "Neem Cake", "Bone Meal", "Blood Meal", "Fish Emulsion"]
    
    for i in range(1, 55):
        base_name = random.choice(base_fertilizers)
        fert_name = f"{base_name} Type {i}"
        fert_id = str(uuid.uuid4())
        fertilizer_id_map[fert_name] = fert_id
        
        cat = "organic" if "Compost" in base_name or "Meal" in base_name or "Cake" in base_name else "chemical"
        nutrients = random.choice(NUTRIENT_PROFILES)
        desc = f"A high-quality {cat} fertilizer suitable for various soils."
        warning = "Use sparingly near water sources." if cat == "chemical" else "Safe for all standard uses."
        
        sql += f"INSERT INTO fertilizer_types (id, fertilizer_name, fertilizer_category, main_nutrients, description, usage_warning) VALUES ('{fert_id}', '{fert_name}', '{cat}', '{nutrients}', '{desc}', '{warning}');\n"

    # Generate Mappings
    sql += "\n-- 3. Insert Crop-Fertilizer Mappings\n"
    fert_keys = list(fertilizer_id_map.keys())
    for crop_name, crop_id in crop_id_map.items():
        # Map 1-3 fertilizers per crop
        for _ in range(random.randint(1, 3)):
            fert_id = fertilizer_id_map[random.choice(fert_keys)]
            qty = f"{random.randint(10, 100)} kg"
            stage = random.choice(APPLICATION_STAGES)
            method = random.choice(APPLICATION_METHODS)
            
            sql += f"INSERT INTO crop_fertilizer_mapping (id, crop_id, fertilizer_id, recommended_quantity_per_acre, application_stage, application_method) VALUES ('{str(uuid.uuid4())}', '{crop_id}', '{fert_id}', '{qty}', '{stage}', '{method}');\n"

    # Soil Deficiencies
    sql += "\n-- 4. Insert Soil Deficiencies\n"
    deficiencies = ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)", "Calcium (Ca)", "Magnesium (Mg)", "Sulphur (S)", "Iron (Fe)", "Zinc (Zn)", "Manganese (Mn)", "Copper (Cu)", "Boron (B)", "Molybdenum (Mo)"]
    for def_name in deficiencies:
        symp = random.choice(SYMPTOMS)
        chem_sol = f"Apply {def_name} rich chemical fertilizer."
        org_sol = f"Apply organic compost enriched with {def_name}."
        sql += f"INSERT INTO soil_deficiency (id, deficiency_name, symptoms, recommended_fertilizer, organic_solution, chemical_solution, precautions) VALUES ('{str(uuid.uuid4())}', '{def_name} Deficiency', '{symp}', '{def_name} Supplement', '{org_sol}', '{chem_sol}', 'Do not over-apply.');\n"

    # Save to file
    with open('seed_500_crops.sql', 'w') as f:
        f.write(sql)
    
    print(f"✅ Generated seed_500_crops.sql with {len(crop_id_map)} crops, {len(fertilizer_id_map)} fertilizers, and mappings.")

if __name__ == "__main__":
    generate_sql()
