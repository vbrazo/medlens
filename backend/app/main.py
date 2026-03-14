from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.graphql.schema import graphql_router
from app.routers import analytics, auth, logs, ml, users

app = FastAPI(
    title="MedLens API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — dashboard origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(logs.router)
app.include_router(analytics.router)
app.include_router(ml.router)

# GraphQL — single endpoint for dashboard queries
app.include_router(graphql_router, prefix="/graphql")


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
