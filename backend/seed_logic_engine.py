from database import SessionLocal
from models import FertilizerDosage, FertilizerCompatibility

def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Fertilizer Dosage
        dosages = [
            {"crop": "wheat", "fertilizer": "urea", "min_dose": 90, "max_dose": 100, "unit": "kg"},
            {"crop": "wheat", "fertilizer": "dap", "min_dose": 50, "max_dose": 60, "unit": "kg"},
            {"crop": "rice", "fertilizer": "urea", "min_dose": 100, "max_dose": 120, "unit": "kg"},
            {"crop": "rice", "fertilizer": "mop", "min_dose": 30, "max_dose": 40, "unit": "kg"},
            {"crop": "cotton", "fertilizer": "npk", "min_dose": 50, "max_dose": 70, "unit": "kg"},
            {"crop": "cotton", "fertilizer": "urea", "min_dose": 80, "max_dose": 90, "unit": "kg"},
            {"crop": "sugarcane", "fertilizer": "urea", "min_dose": 120, "max_dose": 150, "unit": "kg"},
            {"crop": "sugarcane", "fertilizer": "dap", "min_dose": 80, "max_dose": 100, "unit": "kg"},
            {"crop": "maize", "fertilizer": "urea", "min_dose": 80, "max_dose": 100, "unit": "kg"},
            {"crop": "maize", "fertilizer": "dap", "min_dose": 40, "max_dose": 50, "unit": "kg"}
        ]

        print("Seeding Fertilizer Dosage...")
        for data in dosages:
            exists = db.query(FertilizerDosage).filter_by(
                crop=data["crop"], fertilizer=data["fertilizer"]
            ).first()
            if not exists:
                db.add(FertilizerDosage(**data))

        # 2. Seed Fertilizer Compatibility
        compatibilities = [
            {"fertilizer_1": "urea", "fertilizer_2": "dap", "compatible": True, "warning": None},
            {"fertilizer_1": "urea", "fertilizer_2": "mop", "compatible": True, "warning": None},
            {"fertilizer_1": "dap", "fertilizer_2": "mop", "compatible": True, "warning": None},
            {"fertilizer_1": "urea", "fertilizer_2": "calcium ammonium nitrate", "compatible": False, "warning": "Forms a wet paste; highly deliquescent."},
            {"fertilizer_1": "dap", "fertilizer_2": "lime", "compatible": False, "warning": "Causes ammonia loss and reverts phosphorus to unavailable forms."},
            {"fertilizer_1": "potash", "fertilizer_2": "calcium nitrate", "compatible": False, "warning": "Can form insoluble precipitates."},
            {"fertilizer_1": "urea", "fertilizer_2": "superphosphate", "compatible": False, "warning": "Mixture becomes damp quickly; mix only immediately before application."},
        ]

        print("Seeding Fertilizer Compatibility...")
        for data in compatibilities:
            exists = db.query(FertilizerCompatibility).filter_by(
                fertilizer_1=data["fertilizer_1"], fertilizer_2=data["fertilizer_2"]
            ).first()
            # Also check the reverse pair
            reverse_exists = db.query(FertilizerCompatibility).filter_by(
                fertilizer_1=data["fertilizer_2"], fertilizer_2=data["fertilizer_1"]
            ).first()
            if not exists and not reverse_exists:
                db.add(FertilizerCompatibility(**data))

        db.commit()
        print("Database seeded successfully with fundamental logic engine data.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
