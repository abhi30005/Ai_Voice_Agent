import chromadb
from chromadb.config import Settings
from app.config import settings

class VectorStore:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=Settings(allow_reset=True)
        )
        
    def get_collection(self, user_id: str):
        collection_name = f"user_{user_id}"
        return self.client.get_or_create_collection(name=collection_name)

vector_store = VectorStore()
