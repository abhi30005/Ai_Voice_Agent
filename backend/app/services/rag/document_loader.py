import os
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader

def load_document(file_path: str):
    """Load a document and return its pages/text."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Document not found: {file_path}")
        
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        loader = PyMuPDFLoader(file_path)
    elif ext in [".txt", ".md", ".csv"]:
        loader = TextLoader(file_path, encoding='utf-8')
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    return loader.load()
