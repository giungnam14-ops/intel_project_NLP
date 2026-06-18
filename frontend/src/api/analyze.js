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
