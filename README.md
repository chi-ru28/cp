# AgriAssist: Smart Fertilizer, Soil and Farm Tool Recommendation Platform

## Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js v18+
- MongoDB installed and running on `localhost:27017`

### 2. Configuration
Open `backend/.env` and configure your API Keys:
```env
MONGO_URI=mongodb://127.0.0.1:27017/agriassist
SECRET_KEY=agriassist_super_secret_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
PORT=5000
```

### 3. Quick Start (Windows)
Double-click `start.bat` from the root directory `c:\cp\`. Let the scripts install all dependencies for both node and python environments, and it will spawn three instances (FastAPI on 8000, Node on 5000, Vite React on 5173).

### 4. Quick Start (Manual)
If you prefer running them manually in separate powershell windows:

**Terminal 1 (Python FastAPI):**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Node Backend):**
```bash
cd backend
npm install
npm start
```

**Terminal 3 (React Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Visit the App at `http://localhost:5173`
