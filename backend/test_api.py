import requests
import json

# Login First
res = requests.post("http://localhost:8000/api/auth/login", json={"email": "e2etest@email.com", "password": "SuperSecret123!"})
token = res.json()["access_token"]
print(f"Token: {token}")

# Call Chat
headers = {"Authorization": f"Bearer {token}"}
data = {"message": "remind me to check soil tomorrow"}
res2 = requests.post("http://localhost:8000/api/chat", json=data, headers=headers)
print(res2.text)
