"""Anonymous feedback store for admin review.

Privacy by design: only the rating and a few non-identifying fields are stored
(helpful flag, a preset reason, an optional short note, document type, analysis
mode). **The document text is never accepted or stored here.**

Storage is a simple append-only JSONL file (no extra dependency). The path is
configurable via ``FEEDBACK_STORE_PATH``; on ephemeral hosts (e.g. a free
container) mount a persistent disk and point this at it, otherwise the file
resets on redeploy.
"""

from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

_DEFAULT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "feedback_data.jsonl"
)
_lock = threading.Lock()


def _store_path() -> str:
    return os.getenv("FEEDBACK_STORE_PATH", _DEFAULT_PATH)


def add_feedback(record: dict[str, Any]) -> dict[str, Any]:
    """Append one anonymous feedback record. Only safe fields are persisted."""
    safe = {
        "id": uuid.uuid4().hex,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "helpful": bool(record.get("helpful")),
        "reason": str(record.get("reason", ""))[:200],
        "note": str(record.get("note", ""))[:500],
        "document_type": str(record.get("document_type", ""))[:40],
        "analysis_mode": str(record.get("analysis_mode", ""))[:40],
    }
    path = _store_path()
    with _lock:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(safe, ensure_ascii=False) + "\n")
    return safe


def load_all() -> list[dict[str, Any]]:
    """Read every stored feedback record (oldest first)."""
    path = _store_path()
    if not os.path.exists(path):
        return []
    items: list[dict[str, Any]] = []
    with _lock:
        with open(path, encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    items.append(json.loads(line))
                except ValueError:
                    continue
    return items


def _count_by(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for item in items:
        value = (item.get(key) or "").strip() or "(미지정)"
        out[value] = out.get(value, 0) + 1
    return out


def summarize(items: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate feedback for the admin dashboard."""
    total = len(items)
    helpful = sum(1 for item in items if item.get("helpful"))
    not_helpful = total - helpful

    # Reasons only apply to negative feedback.
    reason_counts = _count_by(
        [item for item in items if not item.get("helpful") and item.get("reason")],
        "reason",
    )
    top_reasons = sorted(reason_counts.items(), key=lambda kv: kv[1], reverse=True)

    return {
        "total": total,
        "helpful": helpful,
        "not_helpful": not_helpful,
        "helpful_rate": round(helpful / total * 100, 1) if total else 0.0,
        "by_document_type": _count_by(items, "document_type"),
        "by_analysis_mode": _count_by(items, "analysis_mode"),
        "top_reasons": [{"reason": r, "count": c} for r, c in top_reasons],
    }
