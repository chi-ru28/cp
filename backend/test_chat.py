import requests

# 1. Login to get token
login_url = "http://localhost:8000/api/auth/login"
login_data = {"email": "farmer@gmail.com", "password": "farmer123"}
login_res = requests.post(login_url, json=login_data)
token = login_res.json().get("access_token")

if not token:
    print("Failed to get token")
    exit()

# 2. Test Chat
chat_url = "http://localhost:8000/api/chat"
chat_data = {"message": "My wheat leaves are turning yellow"}
headers = {"Authorization": f"Bearer {token}"}

try:
    response = requests.post(chat_url, json=chat_data, headers=headers)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Error:", e)
