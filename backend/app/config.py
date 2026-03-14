from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database (PostgreSQL / AWS RDS)
    database_url: str = "postgresql+asyncpg://medlens:medlens@localhost:5432/medlens"

    # JWT
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    # AWS
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    s3_bucket: str = "medlens-images"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
