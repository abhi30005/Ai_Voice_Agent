from langchain_core.tools import tool
from datetime import datetime

@tool
def get_current_datetime(timezone: str = "UTC") -> str:
    """Returns the current date and time."""
    now = datetime.now()
    return f"The current date and time is {now.strftime('%Y-%m-%d %H:%M:%S')} local server time."
