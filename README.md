# AgriAssist - AI Agricultural Assistant

AgriAssist is a production-ready AI chatbot designed to help farmers with pricing, location, reminders, and farming techniques.

## 🚀 Quick Setup Guide

Follow these steps to get the project running on your system:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AgriAssist
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment Variables
1. Copy the template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your `OPENAI_API_KEY`, `DATABASE_URL`, and `WEATHER_API_KEY`.

### 4. Run the Server
```bash
uvicorn api.main:app --reload
```
The API will be available at `http://localhost:8000`.

## 🎯 Key Features
- **Price Extraction**: "cost of urea for 10kg"
- **Location Finder**: "where is the nearest shop?"
- **Reminders**: "remind me to water crops tomorrow"
- **Farming Guides**: "how to grow wheat?"
- **Tool Recommendation**: "show me tractors"

## 🛠 Troubleshooting
- **Missing Env**: If the app fails to start, check your `.env` file for missing keys.
- **DB Connection**: Ensure your PostgreSQL database is accessible and the URL is correct.
- **AI Failure**: If the AI API is down, the system will automatically fall back to manual logic.
