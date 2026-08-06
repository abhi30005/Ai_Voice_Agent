from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
from app.schemas.document import DocumentResponse
from app.api.dependencies import get_current_active_user
from app.database.mongodb import db
from bson import ObjectId
from datetime import datetime, timezone
import os
import shutil
import logging
from app.services.rag.document_loader import load_document
from app.services.rag.chunker import chunk_documents
from app.services.rag.vector_store import vector_store

async def process_and_index_document(doc_id: str, user_id: str, file_path: str):
    try:
        # Load and parse
        docs = load_document(file_path)
        # Chunk
        chunks = chunk_documents(docs)
        # Add metadata and insert into vector store
        for chunk in chunks:
            chunk.metadata["doc_id"] = str(doc_id)
            chunk.metadata["user_id"] = str(user_id)
            
        # The Chroma integration handles embedding the text automatically using the provided embedding function
        vector_store.add_documents(user_id, chunks)
        
        # Mark as indexed
        await db.documents.update_one({"_id": ObjectId(doc_id)}, {"$set": {"indexed": True}})
    except Exception as e:
        logging.error(f"Failed to index document {doc_id}: {e}", exc_info=True)

router = APIRouter(prefix="/api/documents", tags=["documents"])
UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_active_user)
):
    file_path = os.path.join(UPLOAD_DIR, f"{current_user['id']}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc_dict = {
        "user_id": ObjectId(current_user["id"]),
        "filename": file.filename,
        "file_path": file_path,
        "indexed": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.documents.insert_one(doc_dict)
    doc_id = str(result.inserted_id)
    doc_dict["id"] = doc_id
    doc_dict["user_id"] = str(doc_dict["user_id"])
    
    # Trigger background indexing
    background_tasks.add_task(
        process_and_index_document, 
        doc_id=doc_id, 
        user_id=str(current_user["id"]), 
        file_path=file_path
    )
    
    return doc_dict

@router.get("", response_model=List[DocumentResponse])
async def get_documents(current_user: dict = Depends(get_current_active_user)):
    cursor = db.documents.find({"user_id": ObjectId(current_user["id"])})
    docs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])
        docs.append(doc)
    return docs

@router.post("/{doc_id}/index")
async def index_document(doc_id: str, current_user: dict = Depends(get_current_active_user)):
    # Mock implementation of indexing
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Here you would:
    # 1. Load document (PDF, TXT)
    # 2. Chunk text
    # 3. Generate embeddings
    # 4. Store in vector_store.get_collection(current_user["id"])
    
    await db.documents.update_one({"_id": ObjectId(doc_id)}, {"$set": {"indexed": True}})
    return {"status": "indexed"}

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_active_user)):
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove from filesystem
    if os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
        
    # Remove from Chroma (mocked out in this stub)
    
    # Remove from DB
    await db.documents.delete_one({"_id": ObjectId(doc_id)})
    return {"status": "deleted"}
