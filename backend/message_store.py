"""User-submitted messages: reviews (후기) and inquiries (문의).

Free-form text the user volunteers for the admin to read. Separate from the
per-result 👍/👎 feedback. Stored append-only as JSONL (no extra dependency);
path configurable via ``MESSAGE_STORE_PATH``. Contact is optional and only used
so the admin can reply to an inquiry.
"""

from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

_DEFAULT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "messages_data.jsonl"
)
_lock = threading.Lock()

VALID_KINDS = ("review", "inquiry")


def _store_path() -> str:
    return os.getenv("MESSAGE_STORE_PATH", _DEFAULT_PATH)


def add_message(record: dict[str, Any]) -> dict[str, Any]:
    """Append one user message (review or inquiry)."""
    kind = record.get("kind")
    if kind not in VALID_KINDS:
        kind = "inquiry"

    try:
        rating = int(record.get("rating") or 0)
    except (ValueError, TypeError):
        rating = 0
    rating = max(0, min(5, rating))

    safe = {
        "id": uuid.uuid4().hex,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "kind": kind,
        "rating": rating,
        "message": str(record.get("message", ""))[:2000],
        "contact": str(record.get("contact", ""))[:200],
    }
    path = _store_path()
    with _lock:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(safe, ensure_ascii=False) + "\n")
    return safe


def load_messages() -> list[dict[str, Any]]:
    """Read every stored message (oldest first)."""
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
