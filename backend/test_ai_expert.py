import requests
import json

def test_ai_expert():
    # Login as farmer
    login_res = requests.post("http://localhost:8000/api/auth/login", json={
        "email": "farmer@gmail.com",
        "password": "farmer123"
    })
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test Case 1: In-Database Query
    print("\nTest 1: In-Database Query (Wheat yellow leaves)")
    res1 = requests.post("http://localhost:8000/api/chat", json={
        "message": "My wheat leaves are turning yellow"
    }, headers=headers)
    print(json.dumps(res1.json(), indent=2))
    
    # Test Case 2: AI Fallback/Reasoning (General soil health)
    print("\nTest 2: AI Reasoning Fallback (How to improve soil health?)")
    res2 = requests.post("http://localhost:8000/api/chat", json={
        "message": "How can I improve soil health for a new tomato farm?"
    }, headers=headers)
    print(json.dumps(res2.json(), indent=2))

if __name__ == "__main__":
    test_ai_expert()
