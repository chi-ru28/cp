from database import SessionLocal
import models
from schemas import UserLogin
from routes.auth_routes import login
import asyncio

async def test_login_internal():
    db = SessionLocal()
    try:
        user_in = UserLogin(email="farmer@gmail.com", password="farmer123")
        res = await login(user_in, db)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_login_internal())
