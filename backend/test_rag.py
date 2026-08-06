import asyncio
from app.services.rag.vector_store import vector_store
from app.database.mongodb import db, connect_to_mongo
from app.core.logging import logger

async def test():
    await connect_to_mongo()
    user = await db.users.find_one()
    if not user:
        print("No user found")
        return
    user_id = str(user["_id"])
    print(f"User ID: {user_id}")
    query = "What is Abhijit's experience with Python?"
    print(f"Query: {query}")
    
    vs = vector_store.get_langchain_vectorstore(user_id)
    docs = vs.similarity_search(query, k=3)
    
    print(f"Retrieved {len(docs)} docs")
    for i, doc in enumerate(docs):
        print(f"--- Doc {i} ---")
        print(doc.page_content)

if __name__ == "__main__":
    asyncio.run(test())
