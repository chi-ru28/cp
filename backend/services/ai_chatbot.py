"""
AgriAssist AI Chatbot Engine

Central logic for Farmer & Shopkeeper conversational assistant.

System Architecture
Frontend: React.js
Backend: Node.js API + Python AI service
Database: PostgreSQL
Modules:
    - Intent detection
    - Agriculture knowledge engine
    - Inventory lookup
    - Image analysis
    - Audio transcription
    - Weather service
    - Chat history
    - Reminder engine
"""

import datetime
import requests
from langdetect import detect

# -----------------------------
# INTENT DETECTION
# -----------------------------

def detect_intent(message):

    message = message.lower()

    if "fertilizer" in message:
        return "fertilizer_advice"

    if "soil" in message:
        return "soil_issue"

    if "pesticide" in message:
        return "pesticide"

    if "tool" in message:
        return "tools"

    if "weather" in message:
        return "weather"

    if "inventory" in message:
        return "shop_inventory"

    if "reminder" in message:
        return "reminder"

    return "general"


# -----------------------------
# LANGUAGE DETECTION
# -----------------------------

def detect_language(message):

    try:
        lang = detect(message)

        if lang == "hi":
            return "Hindi"

        if lang == "gu":
            return "Gujarati"

        return "English"

    except:
        return "English"


# -----------------------------
# WEATHER SERVICE
# -----------------------------

def get_weather(city):

    try:

        url = f"https://wttr.in/{city}?format=3"
        response = requests.get(url)

        return response.text

    except:
        return "Weather information currently unavailable."


# -----------------------------
# FERTILIZER ADVISORY
# -----------------------------

def fertilizer_advice(crop):

    knowledge_base = {

        "wheat": {
            "fertilizer": "Urea + DAP",
            "warning": "Avoid over application of nitrogen fertilizer."
        },

        "rice": {
            "fertilizer": "NPK + Urea",
            "warning": "Apply fertilizer after irrigation."
        }

    }

    if crop in knowledge_base:

        data = knowledge_base[crop]

        return {
            "recommendation": data["fertilizer"],
            "warning": data["warning"]
        }

    return {"recommendation": "Consult local agriculture expert."}


# -----------------------------
# PESTICIDE ADVISORY
# -----------------------------

def pesticide_advice(crop):

    pesticides = {

        "tomato": {
            "organic": "Neem oil spray",
            "chemical": "Imidacloprid"
        }

    }

    return pesticides.get(crop, "No data available.")


# -----------------------------
# SHOPKEEPER INVENTORY SEARCH
# -----------------------------

def search_inventory(product, db):

    """
    Query PostgreSQL inventory table
    """

    query = f"""
    SELECT shop_name, product_name, quantity_available
    FROM shop_inventory
    WHERE product_name ILIKE '%{product}%'
    """

    result = db.execute(query)

    return result.fetchall()


# -----------------------------
# IMAGE ANALYSIS PLACEHOLDER
# -----------------------------

def analyze_image(image_path):

    """
    This module will connect to plant disease ML model
    Example: TensorFlow CNN model
    """

    report = {

        "disease": "Possible nitrogen deficiency",
        "solution": "Apply nitrogen fertilizer such as urea",
        "warning": "Avoid excessive fertilizer"

    }

    return report


# -----------------------------
# AUDIO PROCESSING PLACEHOLDER
# -----------------------------

def analyze_audio(audio_file):

    """
    Speech to text module
    """

    return "Transcribed farmer question"


# -----------------------------
# CHAT HISTORY
# -----------------------------

def save_chat_history(db, user_id, message, response):

    query = """
    INSERT INTO chat_history(user_id,message,response,created_at)
    VALUES(%s,%s,%s,%s)
    """

    db.execute(query, (user_id, message, response, datetime.datetime.now()))


def get_chat_history(db, user_id):

    query = """
    SELECT message,response,created_at
    FROM chat_history
    WHERE user_id=%s
    ORDER BY created_at DESC
    """

    return db.execute(query, (user_id,)).fetchall()


def delete_chat_history(db, user_id):

    query = "DELETE FROM chat_history WHERE user_id=%s"

    db.execute(query, (user_id,))


# -----------------------------
# REMINDER ENGINE
# -----------------------------

def create_reminder(db, user_id, message, reminder_date):

    query = """
    INSERT INTO reminders(user_id,message,reminder_date)
    VALUES(%s,%s,%s)
    """

    db.execute(query, (user_id, message, reminder_date))


# -----------------------------
# CHATBOT RESPONSE ENGINE
# -----------------------------

def chatbot_response(user_role, message, db):

    language = detect_language(message)

    intent = detect_intent(message)

    response = ""

    # Farmer logic

    if user_role == "farmer":

        if intent == "fertilizer_advice":

            response = fertilizer_advice("wheat")

        elif intent == "pesticide":

            response = pesticide_advice("tomato")

        elif intent == "tools":

            items = search_inventory("tool", db)

            response = f"Available farming tools from shopkeepers: {items}"

        elif intent == "weather":

            response = get_weather("India")

        else:

            response = "I can help with fertilizer, pesticide, tools, weather and crop issues."

    # Shopkeeper logic

    if user_role == "shopkeeper":

        if intent == "shop_inventory":

            response = "You can update inventory using inventory management panel."

        else:

            response = "I can help you manage fertilizer and pesticide inventory."

    return {

        "language": language,
        "intent": intent,
        "response": response
    }