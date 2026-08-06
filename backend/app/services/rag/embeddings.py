from langchain_huggingface import HuggingFaceEmbeddings

class EmbeddingsProvider:
    def __init__(self):
        # Initialize a lightweight, free local embedding model
        # all-MiniLM-L6-v2 is fast and works well for general RAG tasks
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )
        
    def get_embeddings(self):
        return self.embeddings

# Singleton instance
embeddings_provider = EmbeddingsProvider()
