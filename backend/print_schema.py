from database import engine
from sqlalchemy import MetaData, Table
m = MetaData()
t = Table('chat_sessions', m, autoload_with=engine)
for c in t.columns:
    print(c.name, c.nullable, c.default)
