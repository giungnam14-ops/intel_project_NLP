"""Pydantic models prepared for FastAPI integration."""

from pydantic import BaseModel, ConfigDict, Field


class AnalyzeRequest(BaseModel):
    text: str
    document_type: str = "auto"
    filename: str = ""
    # Hint from the client: text came from low-quality OCR, so soften security
    # detection (optional, backward compatible).
    ocr_low_quality: bool = False


class AskRequest(BaseModel):
    text: str
    question: str = ""


class AiAnalyzeRequest(BaseModel):
    text: str
    filename: str = ""


class FeedbackRequest(BaseModel):
    """Anonymous feedback for admin review.

    Intentionally has NO document-text field — only the rating and a few
    non-identifying fields are accepted, so no document content is ever stored.
    """

    helpful: bool = False
    reason: str = ""
    note: str = ""
    document_type: str = ""
    analysis_mode: str = ""


class MessageRequest(BaseModel):
    """A user-written review (후기) or inquiry (문의) for the admin to read."""

    kind: str = "inquiry"  # "review" | "inquiry"
    rating: int = 0  # 1-5 for reviews; 0 = unset
    message: str = ""
    contact: str = ""  # optional, only for inquiry replies


class AiKeyPoint(BaseModel):
    title: str
    detail: str
    quote: str = ""
    level: str = "medium"


class AiAnalyzeResponse(BaseModel):
    """Optional AI deep-analysis result. ``available`` is False when the feature
    is not configured (no key / SDK) or the call failed; the UI then shows a
    friendly note instead of an error."""

    model_config = ConfigDict(extra="allow")

    available: bool = False
    error: str | None = None
    summary: str = ""
    key_points: list[AiKeyPoint] = []
    watch_outs: list[str] = []
    plain_explanation: str = ""
    model: str | None = None
    truncated: bool = False


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


class ActionItem(BaseModel):
    """A concrete to-do extracted from the document (obligation + optional deadline)."""

    task: str
    deadline: str = ""
    source_text: str = ""
    level: str = "normal"


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
    # Concrete to-dos the user must act on (obligations + deadlines).
    action_items: list[ActionItem] = []
    # True when the document contained AI-instruction-manipulating text that was
    # surfaced as a '보안 주의' highlight instead of hard-blocking the analysis.
    security_notice: bool = False
    # True when the document was long enough to be analyzed in "long document"
    # mode (key-sentence focused). processing_note explains it to the user.
    long_document: bool = False
    processing_note: str | None = None
    # True when scam/fraud red-flag phrasing was detected (shown as a banner).
    fraud_suspected: bool = False
