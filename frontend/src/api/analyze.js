const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function analyzeDocument(text, ocrLowQuality = false, filename = '') {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      document_type: 'auto',
      ocr_low_quality: Boolean(ocrLowQuality),
      filename: filename || ''
    })
  });

  if (!response.ok) {
    let message = '분석 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해 주세요.';

    try {
      const errorBody = await response.json();
      if (errorBody?.detail) {
        message = typeof errorBody.detail === 'string'
          ? errorBody.detail
          : '분석 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해 주세요.';
      }
    } catch {
      // Ignore JSON parsing errors and fall back to the default message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function submitFeedback(payload) {
  // Best-effort: send anonymous feedback to the server for admin review.
  // Never throws — the result screen must not depend on this succeeding.
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        helpful: Boolean(payload?.helpful),
        reason: payload?.reason || '',
        note: payload?.note || '',
        document_type: payload?.document_type || '',
        analysis_mode: payload?.analysis_mode || 'quick'
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function submitMessage(payload) {
  // User-written review/inquiry. Throws on failure so the form can show an error.
  const response = await fetch(`${API_BASE_URL}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: payload?.kind === 'review' ? 'review' : 'inquiry',
      rating: Number(payload?.rating) || 0,
      message: payload?.message || '',
      contact: payload?.contact || ''
    })
  });
  if (!response.ok) {
    let message = '전송하지 못했어요. 잠시 후 다시 시도해 주세요.';
    try {
      const errorBody = await response.json();
      if (errorBody?.detail && typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export async function fetchAdminFeedback(token) {
  const response = await fetch(`${API_BASE_URL}/admin/feedback`, {
    headers: { 'x-admin-token': token || '' }
  });
  if (!response.ok) {
    let message = '평가를 불러오지 못했어요.';
    if (response.status === 401) message = '관리자 토큰이 올바르지 않아요.';
    else if (response.status === 503) message = '서버에 관리자 기능(ADMIN_TOKEN)이 설정되지 않았어요.';
    throw new Error(message);
  }
  return response.json();
}

export async function aiStatus() {
  // Cheap check (no LLM call) used to hide the opt-in AI feature until a key is
  // configured. Any failure → treat as unavailable so the free flow stays clean.
  try {
    const response = await fetch(`${API_BASE_URL}/ai-status`);
    if (!response.ok) return { available: false };
    return await response.json();
  } catch {
    return { available: false };
  }
}

export async function aiAnalyzeDocument(text, filename = '') {
  const response = await fetch(`${API_BASE_URL}/ai-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, filename: filename || '' })
  });

  if (!response.ok) {
    // Treat transport/server errors as "unavailable" so the UI shows a friendly
    // note instead of breaking the rule-based result screen.
    let message = 'AI 정밀 분석을 불러오지 못했어요.';
    try {
      const errorBody = await response.json();
      if (errorBody?.detail && typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // ignore
    }
    return { available: false, error: message };
  }

  return response.json();
}

export async function askDocument(text, question) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, question })
  });

  if (!response.ok) {
    let message = '질문에 답변하는 중 문제가 발생했습니다.';

    try {
      const errorBody = await response.json();
      if (errorBody?.detail && typeof errorBody.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to the default message.
    }

    throw new Error(message);
  }

  return response.json();
}
