import asyncio
from app.services.rag.vector_store import vector_store
from app.database.mongodb import db, connect_to_mongo

async def test_search():
    await connect_to_mongo()
    doc = await db.documents.find_one({"indexed": True})
    if not doc:
        print("No indexed documents found.")
        return
        
    user_id = str(doc["user_id"])
    print(f"User ID: {user_id}")
    
    vs = vector_store.get_langchain_vectorstore(user_id)
    # search
    query = "What is Abhijit's Class 12 school or board?"
    print(f"Searching for: {query}")
    docs = vs.similarity_search(query, k=5)
    
    print(f"Found {len(docs)} docs.")
    for i, doc in enumerate(docs):
        print(f"--- Doc {i} ---")
        print(doc.page_content)
        print("--- Metadata ---")
        print(doc.metadata)
        print()

if __name__ == "__main__":
    asyncio.run(test_search())
