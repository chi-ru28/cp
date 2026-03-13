from database import SessionLocal
from ai_chatbot import extract_entities, query_agriculture_knowledge

def run_tests():
    db = SessionLocal()
    try:
        msg = "My wheat leaves are turning yellow"
        entities = extract_entities(db, msg)
        print("Extracted Entities:", entities)
        
        # Test Query
        res = query_agriculture_knowledge(db, entities['crop'], entities['symptom'], entities['intent'])
        with open("test_output2.txt", "w") as f:
            f.write(f"Entities: {entities}\n")
            for k,v in res.items() if res else {}:
                f.write(f"{k}: {v}\n")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
