from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def fix_spaced_text(text: str) -> str:
    lines = text.split('\n')
    fixed_lines = []
    for line in lines:
        words = line.split(' ')
        if not words:
            fixed_lines.append(line)
            continue
        one_char_words = sum(1 for w in words if len(w) == 1 and w.strip())
        total_words = len([w for w in words if w.strip()])
        if total_words > 0 and one_char_words / total_words > 0.4:
            line = line.replace('  ', '<D_SPACE>')
            line = line.replace(' ', '')
            line = line.replace('<D_SPACE>', ' ')
        fixed_lines.append(line)
    return '\n'.join(fixed_lines)

def chunk_documents(documents):
    """Chunk a list of loaded documents into smaller pieces."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True,
    )
    # Fix spaced-out text before chunking
    cleaned_docs = []
    for doc in documents:
        cleaned_content = fix_spaced_text(doc.page_content)
        cleaned_docs.append(Document(page_content=cleaned_content, metadata=doc.metadata))
        
    return text_splitter.split_documents(cleaned_docs)
