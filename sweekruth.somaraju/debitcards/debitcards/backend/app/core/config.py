from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Debit Card Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Azure Event Hub Settings (set via environment variables)
    EVENT_HUB_CONNECTION_STRING: str = ""  # Set EVENT_HUB_CONNECTION_STRING env var
    EVENT_HUB_NAME: str = "debitcards"

    # Demo Card Settings
    DEMO_CARD_NUMBER: str = "4242424242424242"
    DEMO_PIN: str = "1234"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
