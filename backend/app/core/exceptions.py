from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.logging import logger

class VoiceAgentError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

async def custom_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

async def voice_agent_exception_handler(request: Request, exc: VoiceAgentError):
    logger.warning(f"VoiceAgentError: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

def register_exception_handlers(app):
    app.add_exception_handler(Exception, custom_exception_handler)
    app.add_exception_handler(VoiceAgentError, voice_agent_exception_handler)
