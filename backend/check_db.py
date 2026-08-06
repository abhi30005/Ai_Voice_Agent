import asyncio
from app.database.mongodb import db, connect_to_mongo

async def check():
    await connect_to_mongo()
    cursor = db.documents.find()
    docs = await cursor.to_list(length=100)
    for doc in docs:
        print(f"Doc: {doc['filename']}, Indexed: {doc.get('indexed')}, User: {doc.get('user_id')}")

if __name__ == "__main__":
    asyncio.run(check())
