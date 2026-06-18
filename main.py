import os

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.ai_refine import ai_available, ai_refine
from backend.analyzer import analyze_document
from backend.document_qa import answer_question
from backend.feedback_store import add_feedback, load_all, summarize
from backend.message_store import add_message, load_messages
from backend.schemas import (
    AiAnalyzeRequest,
    AiAnalyzeResponse,
    AiKeyPoint,
    AnalyzeRequest,
    AnalyzeResponse,
    AnalyzeCard,
    AskRequest,
    AskResponse,
    EvidenceItem,
    FeedbackRequest,
    KeyFacts,
    MessageRequest,
)
from guardrails import apply_guardrails

app = FastAPI(title="5초 문서체크 API", version="1.0.0")

# Allowed CORS origins are read from the BACKEND_ALLOWED_ORIGINS env variable
# (comma-separated). When unset, fall back to the local dev frontend origins so
# local development keeps working without any configuration.
_DEFAULT_ORIGINS = "http://127.0.0.1:5173,http://localhost:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("BACKEND_ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Simple health-check endpoint for the FastAPI server."""
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze a document using the NLP analysis engine."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    result = apply_guardrails(
        request.text,
        lambda document_text: analyze_document(document_text, filename=request.filename or ""),
        ocr_low_quality=request.ocr_low_quality,
    )

    return AnalyzeResponse(
        document_type=result["document_type"],
        document_type_label=result["document_type_label"],
        risk_level=result["risk_level"],
        summary=result["summary"],
        cards=[AnalyzeCard(**card) for card in result.get("cards", [])],
        checklist=result.get("checklist", []),
        warnings=result.get("warnings", []),
        guardrail_applied=result.get("guardrail_applied", True),
        blocked=result.get("blocked", False),
        blocked_reason=result.get("blocked_reason", None),
        highlights=result.get("highlights", []),
        key_facts=result.get("key_facts", None) or KeyFacts(),
        security_notice=result.get("security_notice", False),
        long_document=result.get("long_document", False),
        processing_note=result.get("processing_note", None),
    )


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    """Answer a question grounded in the provided document text (no external LLM)."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    result = answer_question(request.text, request.question)

    return AskResponse(
        answer=result.get("answer", ""),
        confidence=result.get("confidence", "low"),
        evidence=[EvidenceItem(**item) for item in result.get("evidence", [])],
        suggested_followups=result.get("suggested_followups", []),
    )


@app.post("/feedback")
def feedback(request: FeedbackRequest) -> dict:
    """Store one anonymous feedback record (no document text). Best-effort:
    failures here must never break the user's result screen."""
    add_feedback(request.model_dump())
    return {"ok": True}


@app.post("/message")
def message(request: MessageRequest) -> dict:
    """Store one user-written review or inquiry for the admin to read."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="내용을 입력해 주세요.")
    add_message(request.model_dump())
    return {"ok": True}


@app.get("/admin/feedback")
def admin_feedback(x_admin_token: str | None = Header(default=None)) -> dict:
    """Admin-only: aggregated feedback + user reviews/inquiries. Protected by the
    ADMIN_TOKEN env var (simple token, no account system)."""
    token = os.getenv("ADMIN_TOKEN", "").strip()
    if not token:
        raise HTTPException(
            status_code=503,
            detail="관리자 기능이 설정되지 않았습니다. (서버에 ADMIN_TOKEN 필요)",
        )
    if not x_admin_token or x_admin_token != token:
        raise HTTPException(status_code=401, detail="관리자 인증에 실패했습니다.")

    items = load_all()
    messages = load_messages()
    # Newest first, capped.
    recent = list(reversed(items))[:500]
    reviews = list(reversed([m for m in messages if m.get("kind") == "review"]))[:300]
    inquiries = list(reversed([m for m in messages if m.get("kind") == "inquiry"]))[:300]
    return {
        "summary": summarize(items),
        "items": recent,
        "reviews": reviews,
        "inquiries": inquiries,
    }


@app.get("/ai-status")
def ai_status() -> dict:
    """Lightweight check (no LLM call) so the UI can hide the opt-in AI feature
    until an operator configures a key."""
    return {"available": ai_available()}


@app.post("/ai-analyze", response_model=AiAnalyzeResponse)
def ai_analyze(request: AiAnalyzeRequest) -> AiAnalyzeResponse:
    """Optional AI deep-analysis (hybrid mode).

    Additive and isolated: when the feature is not configured (no SDK / key) the
    response carries ``available=False`` with a friendly message instead of an
    error, so the rule-based flow is never affected.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    result = ai_refine(request.text)

    return AiAnalyzeResponse(
        available=bool(result.get("available")),
        error=result.get("error"),
        summary=result.get("summary", ""),
        key_points=[AiKeyPoint(**point) for point in result.get("key_points", [])],
        watch_outs=result.get("watch_outs", []),
        plain_explanation=result.get("plain_explanation", ""),
        model=result.get("model"),
        truncated=bool(result.get("truncated", False)),
    )
