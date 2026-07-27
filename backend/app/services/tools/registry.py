from .calculator import calculator
from .datetime_tool import get_current_datetime
from .web_search import web_search

def get_agent_tools():
    return [
        calculator,
        get_current_datetime,
        web_search
    ]
