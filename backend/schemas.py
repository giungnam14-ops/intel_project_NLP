"""Pydantic models prepared for FastAPI integration."""

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    text: str
    document_type: str = "auto"


class AnalyzeCard(BaseModel):
    category: str
    title: str
    original_sentence: str
    level: str
    message: str


class AnalyzeResponse(BaseModel):
    document_type: str
    document_type_label: str
    risk_level: str
    summary: str
    cards: list[AnalyzeCard]
    checklist: list[str]
