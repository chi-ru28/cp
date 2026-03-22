import os
import requests
from fastapi import APIRouter, HTTPException, Depends
from routes.chat_routes import get_current_user

router = APIRouter()

def get_farming_advice(data):
    main = data.get('main', {})
    weather = data.get('weather', [{}])
    wind = data.get('wind', {})
    
    advices = []
    if main.get('humidity', 0) > 85: advices.append('High humidity — risk of fungal diseases. Avoid spraying foliar fertilizers.')
    if main.get('humidity', 100) < 30: advices.append('Low humidity — increase irrigation frequency.')
    if wind.get('speed', 0) > 20: advices.append('High wind speed — avoid pesticide spraying today.')
    if main.get('temp', 0) > 38: advices.append('Very hot — irrigate in early morning or evening to reduce evaporation.')
    if main.get('temp', 100) < 10: advices.append('Cold temperature — delay transplanting of sensitive crops.')
    if weather[0].get('main') == 'Rain': advices.append('Rainfall expected — hold off fertilizer application to prevent run-off.')
    if not advices: advices.append('Good farming conditions today.')
    return advices

@router.get("/")
def get_weather(location: str = 'Ahmedabad', current_user=Depends(get_current_user)):
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Weather service not configured.")
    
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
        response = requests.get(url, timeout=6)
        response.raise_for_status()
        data = response.json()
        
        return {
            "location": data.get("name"),
            "country": data.get("sys", {}).get("country"),
            "temp": round(data["main"]["temp"]),
            "feelsLike": round(data["main"]["feels_like"]),
            "humidity": data["main"]["humidity"],
            "wind": data.get("wind", {}).get("speed"),
            "condition": data["weather"][0]["description"],
            "icon": data["weather"][0]["icon"],
            "farmingAdvice": get_farming_advice(data)
        }
    except Exception as err:
        print("Weather error:", err)
        raise HTTPException(status_code=502, detail="Weather service temporarily unavailable.")
