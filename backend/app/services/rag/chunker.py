from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_documents(documents):
    """Chunk a list of loaded documents into smaller pieces."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True,
    )
    return text_splitter.split_documents(documents)
