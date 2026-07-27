from langchain_core.tools import tool

@tool
def web_search(query: str) -> str:
    """Perform a web search. Use this when you need current information from the internet."""
    # This is a stub for web search
    return f"Mock web search results for: '{query}'. Provide actual implementation using Tavily or Google Search API."
