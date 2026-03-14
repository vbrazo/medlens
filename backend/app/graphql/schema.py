"""
GraphQL schema — exposes the same data as the REST API.
Mounted at /graphql alongside REST routes.
Useful for the admin dashboard where a single query can fetch
patients + adherence + weekly trend in one round-trip.
"""
from typing import Annotated

import strawberry
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info

from app.core.deps import require_admin
from app.database import get_db
from app.graphql.types import (
    AdherenceType,
    DailyPointType,
    LogType,
    OverviewType,
    PatientType,
)
from app.models.medication_log import MedicationLog
from app.models.user import User
from app.routers.analytics import (
    _adherence_for,
    _weekly_points,
)
from app.routers.users import list_patients


@strawberry.type
class Query:
    @strawberry.field
    async def overview(self, info: Info) -> OverviewType:
        db: AsyncSession = info.context["db"]
        from app.routers.analytics import overview as _overview
        result = await _overview(db=db, _=info.context["admin"])
        return OverviewType(**result.model_dump())

    @strawberry.field
    async def patients(self, info: Info) -> list[PatientType]:
        db: AsyncSession = info.context["db"]
        admin = info.context["admin"]
        rows = await list_patients(db=db, _=admin)
        return [PatientType(**r.model_dump()) for r in rows]

    @strawberry.field
    async def adherence(self, info: Info, user_id: str | None = None) -> AdherenceType:
        db: AsyncSession = info.context["db"]
        result = await _adherence_for(db, user_id=user_id)
        return AdherenceType(**result.model_dump())

    @strawberry.field
    async def weekly(self, info: Info, user_id: str | None = None) -> list[DailyPointType]:
        db: AsyncSession = info.context["db"]
        points = await _weekly_points(db, user_id=user_id)
        return [DailyPointType(**p.model_dump()) for p in points]


schema = strawberry.Schema(query=Query)


async def get_graphql_context(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return {"db": db, "admin": admin}


graphql_router = GraphQLRouter(
    schema,
    context_getter=get_graphql_context,
)
