import chromadb
from chromadb.config import Settings
from langchain_community.vectorstores import Chroma
from app.config import settings
from app.services.rag.embeddings import embeddings_provider

class VectorStore:
    def __init__(self):
        import os
        # Use a local persistent directory instead of requiring a Docker container
        chroma_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "chroma_data")
        os.makedirs(chroma_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=chroma_dir)
        self.embedding_function = embeddings_provider.get_embeddings()
        
    def get_collection(self, user_id: str):
        collection_name = f"user_{user_id}"
        return self.client.get_or_create_collection(name=collection_name)
        
    def get_langchain_vectorstore(self, user_id: str) -> Chroma:
        """Get the LangChain compatible Chroma vector store for a user."""
        collection_name = f"user_{user_id}"
        return Chroma(
            client=self.client,
            collection_name=collection_name,
            embedding_function=self.embedding_function
        )
        
    def add_documents(self, user_id: str, documents: list):
        """Add chunked documents to the user's vector store."""
        vectorstore = self.get_langchain_vectorstore(user_id)
        vectorstore.add_documents(documents)

vector_store = VectorStore()
