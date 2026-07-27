from pydantic import BaseModel
from typing import List, Dict, Any

class AnalyticsOverview(BaseModel):
    avg_latency_ms: int
    latency_trend: float
    total_tokens: int
    tokens_trend: float
    api_hit_time_ms: int
    api_trend: float
    active_sessions: int
    sessions_trend: float

class ProviderPerformance(BaseModel):
    name: str
    avg_latency: int
    color: str

class AnalyticsResponse(BaseModel):
    overview: AnalyticsOverview
    latency_chart_data: List[int]
    providers: List[ProviderPerformance]
