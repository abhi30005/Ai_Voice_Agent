from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.core.logging import logger

class Database:
    client: AsyncIOMotorClient = None
    
    def get_db(self):
        if self.client is None:
            raise Exception("Database client is not initialized")
        return self.client[settings.MONGODB_DATABASE]

    def __getattr__(self, name):
        return getattr(self.get_db(), name)

db = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    logger.info("Connected to MongoDB.")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client:
        db.client.close()
    logger.info("MongoDB connection closed.")
