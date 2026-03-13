import requests

url = "http://localhost:8000/api/auth/login"
data = {"email": "farmer@gmail.com", "password": "farmer123"}

try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error:", e)
