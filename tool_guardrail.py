"""Simple tool-usage guardrails for safe mock tool calls."""

from __future__ import annotations

ALLOWED_TOOLS = {
    "document_loader",
    "domain_knowledge_lookup",
    "policy_mock_check",
}

FORBIDDEN_TOOLS = {
    "file_delete",
    "shell_exec",
    "network_scan",
    "credential_access",
    "external_payment",
}


def is_tool_allowed(tool_name: str) -> bool:
    """Return True when the named tool is explicitly allowed."""
    return tool_name in ALLOWED_TOOLS


def validate_tool_call(tool_name: str, payload: dict) -> dict:
    """Validate the requested tool usage and return a safe result dict."""
    name = (tool_name or "").strip().lower()
    if name in FORBIDDEN_TOOLS or name not in ALLOWED_TOOLS:
        return {"allowed": False, "reason": "허용되지 않은 도구입니다."}

    if not isinstance(payload, dict):
        return {"allowed": False, "reason": "payload는 객체 형태여야 합니다."}

    return {"allowed": True, "reason": "허용된 도구입니다."}


def safe_mock_tool_call(tool_name: str, payload: dict) -> dict:
    """Return a deterministic mock response without executing external tools."""
    validation = validate_tool_call(tool_name, payload)
    if not validation["allowed"]:
        return {"tool": tool_name, "status": "blocked", "message": validation["reason"]}

    return {
        "tool": tool_name,
        "status": "ok",
        "message": "mock tool call accepted",
        "payload": payload,
    }
