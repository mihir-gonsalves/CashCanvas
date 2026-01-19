# app/config.py - sets up CORS functionality
import os

class Settings:
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        if self.environment == "production":
            raw_origins = os.getenv("ALLOWED_ORIGINS", "")
            self.allowed_origins = [
                origin.strip()
                for origin in raw_origins.split(",")
                if origin.strip()
            ]
        else:
            # Allow cross-origin requests (for React frontend)
            self.allowed_origins = [
                "http://localhost:5173",  # Vite dev server
                "http://127.0.0.1:5173",  # Sometimes Vite uses this
            ]
        
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./transactions.db")

settings = Settings()
