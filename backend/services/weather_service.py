import requests
import os
from dotenv import load_dotenv

load_dotenv()

def get_weather(city: str):
    """
    Fetch real-time weather data from OpenWeatherMap.
    """
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return None
    api_key = api_key.strip()

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Weather API response for {city}: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Weather API error: {response.text}")
            return None

        data = response.json()
        print("Weather API data:", data)

        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"],
            "condition": data["weather"][0]["main"],
            "city": data["name"]
        }
    except Exception as e:
        print(f"Weather service Exception: {e}")
        return None
