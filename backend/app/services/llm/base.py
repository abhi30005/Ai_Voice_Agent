from langchain_core.language_models.chat_models import BaseChatModel
from app.config import settings

def get_llm_provider() -> BaseChatModel:
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model_name=settings.LLM_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7
        )
    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.LLM_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.7
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
