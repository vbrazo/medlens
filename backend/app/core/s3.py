"""
AWS S3 helper for storing medication scan images.
Uses boto3 — same AWS SDK used across ECS/Lambda/EventBridge integrations.
"""
import uuid
from typing import IO

import boto3
from botocore.exceptions import ClientError

from app.config import settings

_s3 = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id or None,
    aws_secret_access_key=settings.aws_secret_access_key or None,
)


def upload_image(file: IO[bytes], content_type: str = "image/jpeg") -> str:
    """Upload a file-like object to S3 and return its public URL."""
    key = f"scans/{uuid.uuid4()}.jpg"
    _s3.upload_fileobj(
        file,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    return f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a pre-signed URL for secure, time-limited access."""
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
