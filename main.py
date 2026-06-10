from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.analyzer import analyze_document
from backend.schemas import AnalyzeRequest, AnalyzeResponse, AnalyzeCard

app = FastAPI(title="5초 문서체크 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

    result = analyze_document(request.text)

    return AnalyzeResponse(
        document_type=result["document_type"],
        document_type_label=result["document_type_label"],
        risk_level=result["risk_level"],
        summary=result["summary"],
        cards=[AnalyzeCard(**card) for card in result.get("cards", [])],
        checklist=result.get("checklist", []),
    )
