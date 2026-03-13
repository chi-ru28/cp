from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

router = APIRouter()

@router.get("/tables")
def get_tables(db: Session = Depends(get_db)):
    """Return all PostgreSQL tables in the public schema."""
    try:
        query = text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public';
        """)
        result = db.execute(query).fetchall()
        tables = [row[0] for row in result]
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table/{name}")
def get_table_data(name: str, db: Session = Depends(get_db)):
    """Return all rows from the requested table."""
    try:
        # Note: We use textual SQL but should be careful about table names
        # In a real app, we'd whitelist allowed tables.
        query = text(f"SELECT * FROM {name}")
        result = db.execute(query).fetchall()
        
        # Convert rows to dictionaries
        # db.execute(query).keys() gives column names
        res_proxy = db.execute(query)
        keys = res_proxy.keys()
        data = [dict(zip(keys, row)) for row in res_proxy.fetchall()]
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
