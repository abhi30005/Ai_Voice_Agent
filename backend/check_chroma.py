import chromadb
from app.services.rag.vector_store import vector_store

def check_chroma():
    try:
        user_id = "6a74a836be3af9d4f67ea66d"
        vs = vector_store.get_langchain_vectorstore(user_id)
        collection = vs._collection
        count = collection.count()
        print(f"Collection for user {user_id} has {count} documents.")
        if count > 0:
            print("Sample doc:", collection.peek(1))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_chroma()
