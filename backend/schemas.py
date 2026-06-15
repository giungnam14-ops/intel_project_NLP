"""Pydantic models prepared for FastAPI integration."""

from pydantic import BaseModel, ConfigDict, Field


class AnalyzeRequest(BaseModel):
    text: str
    document_type: str = "auto"
    # Hint from the client: text came from low-quality OCR, so soften security
    # detection (optional, backward compatible).
    ocr_low_quality: bool = False


class AskRequest(BaseModel):
    text: str
    question: str = ""


class EvidenceItem(BaseModel):
    source_text: str
    label: str


class AskResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    answer: str
    confidence: str
    evidence: list[EvidenceItem] = []
    suggested_followups: list[str] = []


class AnalyzeCard(BaseModel):
    category: str
    title: str
    original_sentence: str
    level: str
    message: str


class KeyFactItem(BaseModel):
    """A single auto-extracted fact (money / date / action / warning)."""

    value: str
    source_text: str
    label: str


class KeyFacts(BaseModel):
    """Auto-extracted facts grouped by category. All optional / default empty."""

    money: list[KeyFactItem] = []
    dates: list[KeyFactItem] = []
    actions: list[KeyFactItem] = []
    warnings: list[KeyFactItem] = []


class Highlight(BaseModel):
    """A source sentence flagged as important, with severity and reason."""

    id: str
    label: str
    severity: str
    source_text: str
    reason: str


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    document_type: str
    document_type_label: str
    risk_level: str
    summary: str
    cards: list[AnalyzeCard]
    checklist: list[str]
    warnings: list[str] = []
    guardrail_applied: bool = False
    blocked: bool = False
    blocked_reason: str | None = None
    # Optional, additive fields (Stage 1: highlights & key facts).
    highlights: list[Highlight] = []
    key_facts: KeyFacts = Field(default_factory=KeyFacts)
    # True when the document contained AI-instruction-manipulating text that was
    # surfaced as a '보안 주의' highlight instead of hard-blocking the analysis.
    security_notice: bool = False
