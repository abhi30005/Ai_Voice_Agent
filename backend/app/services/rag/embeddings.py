from langchain_openai import OpenAIEmbeddings
from app.config import settings

class EmbeddingsProvider:
    def __init__(self):
        # Using OpenAI embeddings to save RAM and avoid OOM on Render
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
            model="text-embedding-3-small" # Fast and cheap model
        )
        
    def get_embeddings(self):
        return self.embeddings

# Singleton instance
embeddings_provider = EmbeddingsProvider()
