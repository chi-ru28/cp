import sqlalchemy
from sqlalchemy import text

engine = sqlalchemy.create_engine('postgresql://postgres:1234@localhost:5432/AgriAssist')

with engine.connect() as con:
    con.execute(text('DROP SCHEMA public CASCADE;'))
    con.execute(text('CREATE SCHEMA public;'))
    con.commit()
