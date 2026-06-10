"""Lightweight domain-knowledge retriever for the RAG-like analysis path."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


_KNOWLEDGE_FILE = Path(__file__).with_name("domain_knowledge.json")


def _normalize(text: str) -> str:
    return re.sub(r"[^가-힣a-z0-9]+", "", (text or "").lower())


def load_domain_knowledge() -> dict[str, Any]:
    """Load the lightweight domain knowledge catalog."""
    if not _KNOWLEDGE_FILE.exists():
        return {}
    with _KNOWLEDGE_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def retrieve_domain_guide(document_type: str, category: str) -> dict[str, Any]:
    """Return the best matching domain guide for a document type and category."""
    knowledge = load_domain_knowledge()
    doc_type = (document_type or "other").lower()
    doc_entry = knowledge.get(doc_type, {})
    categories = doc_entry.get("categories", {})

    target = _normalize(category)
    for name, guidance in categories.items():
        if _normalize(name) == target or target in _normalize(name):
            return {"category": name, **guidance}

    for name, guidance in categories.items():
        if target in _normalize(name) or _normalize(name) in target:
            return {"category": name, **guidance}

    return {}


def enrich_card_with_domain_knowledge(card: dict[str, Any], document_type: str) -> dict[str, Any]:
    """Attach domain-specific guidance data to a single card."""
    enriched = dict(card)
    guide = retrieve_domain_guide(document_type, str(card.get("category", "")))
    if guide:
        enriched["domain_guide"] = guide.get("guide", "")
        enriched["domain_caution"] = guide.get("caution", "")
    return enriched


def enrich_result_with_domain_knowledge(result: dict[str, Any]) -> dict[str, Any]:
    """Add lightweight domain guidance and checklist hints to the analysis result."""
    enriched_result = dict(result)
    document_type = str(enriched_result.get("document_type", "other")).lower()
    cards = list(enriched_result.get("cards", []))
    checklist = list(enriched_result.get("checklist", []))

    guide_count = 0
    caution_count = 0
    checklist_added = 0

    enriched_cards = []
    for card in cards:
        enriched_card = enrich_card_with_domain_knowledge(card, document_type)
        guide = retrieve_domain_guide(document_type, str(card.get("category", "")))
        if guide:
            guide_count += 1
            if guide.get("caution"):
                caution_count += 1
            if guide.get("checklist") and guide["checklist"] not in checklist:
                checklist.append(guide["checklist"])
                checklist_added += 1

            existing_message = str(enriched_card.get("message", "")).strip()
            guidance_text = guide.get("guide", "")
            caution_text = guide.get("caution", "")
            parts = [existing_message] if existing_message else []
            if guidance_text:
                parts.append(f"도메인 가이드: {guidance_text}")
            if caution_text:
                parts.append(f"주의: {caution_text}")
            enriched_card["message"] = "\n\n".join(part for part in parts if part).strip()

        enriched_cards.append(enriched_card)

    enriched_result["cards"] = enriched_cards
    enriched_result["checklist"] = checklist
    enriched_result["_rag_metadata"] = {
        "document_type": document_type,
        "guide_cards": guide_count,
        "caution_cards": caution_count,
        "checklist_added": checklist_added,
    }

    return enriched_result
