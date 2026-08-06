import asyncio
from app.services.rag.vector_store import vector_store
from app.database.mongodb import db, connect_to_mongo

async def test_retrieval():
    await connect_to_mongo()
    # Get the user ID (assuming there's only one user for testing)
    user = await db.users.find_one()
    if not user:
        print("No users found in db.")
        return
        
    user_id = str(user["_id"])
    print(f"User ID: {user_id}")
    
    vs = vector_store.get_langchain_vectorstore(user_id)
    # Search for something that would likely be in the resume
    docs = vs.similarity_search("abhijit", k=3)
    
    print(f"Found {len(docs)} docs.")
    for i, doc in enumerate(docs):
        print(f"--- Doc {i} ---")
        print(doc.page_content[:200])

if __name__ == "__main__":
    asyncio.run(test_retrieval())
