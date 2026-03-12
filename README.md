# AgriAssist: Smart Fertilizer, Soil and Farm Tool Recommendation Platform

## Architecture
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Express/Node.js + PostgreSQL (Sequelize)
- **AI Integration**: Python FastAPI + Gemini AI

## Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js v18+
- PostgreSQL v14+ installed and running on `localhost:5432`

### 2. Local Configuration
1. Create a `backend/.env` file:
```env
DATABASE_URL=postgresql://postgres:user@localhost:5432/AgriAssist
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
PORT=5000
```

### 3. Quick Start (Windows)
Double-click `start.bat` from the root directory. It will install dependencies and launch the servers.

### 4. Deployment (Vercel)
The backend is configured for Vercel. Ensure you set the following **Environment Variables** in the Vercel Dashboard:
- `DATABASE_URL`: A hosted PostgreSQL URL (from Supabase, Neon, etc.)
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `WEATHER_API_KEY`

Visit the App at `http://localhost:5173`

