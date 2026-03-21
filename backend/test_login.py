import requests

url = "http://localhost:8000/api/auth/login"
payload = {
    "email": "testregister3@example.com",
    "password": "Password123!"
}

try:
    response = requests.post(url, json=payload)
    print("Status:", response.status_code)
    print("Body:", response.text)
except Exception as e:
    print("Error:", e)
