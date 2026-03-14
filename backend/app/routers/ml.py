"""
Optional server-side ML reprocessing endpoint.
Accepts an image upload and returns classification + OCR results.
In production this could be an AWS Lambda invocation.
"""
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel

router = APIRouter(prefix="/ml", tags=["ml"])


class MLResult(BaseModel):
    medication: str
    confidence: float
    verified: bool
    ocr_text: str


@router.post("/analyze", response_model=MLResult)
async def analyze(file: UploadFile = File(...)):
    """
    Stub endpoint — wire to a real model or invoke an AWS Lambda function.

    Example Lambda integration:
        import boto3
        lambda_client = boto3.client("lambda", region_name=settings.aws_region)
        response = lambda_client.invoke(
            FunctionName="medlens-classifier",
            Payload=image_bytes,
        )
    """
    # TODO: replace with real inference or Lambda invocation
    return MLResult(
        medication="Unknown",
        confidence=0.0,
        verified=False,
        ocr_text="",
    )
