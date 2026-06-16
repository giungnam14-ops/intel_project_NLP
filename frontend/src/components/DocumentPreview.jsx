import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Reuse the locally-bundled pdf.js worker (same as DocumentInput). Idempotent.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PREVIEW_THRESHOLD = 180;

// Render the first page of a PDF (by object URL) onto a canvas. This avoids the
// blank <object>/<iframe> behavior some browsers show for blob: PDFs.
function PdfCanvasPreview({ url }) {
  const canvasRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | done | error

  useEffect(() => {
    if (!url) {
      setState('error');
      return undefined;
    }

    let cancelled = false;
    let task;
    setState('loading');

    (async () => {
      try {
        task = pdfjsLib.getDocument(url);
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const base = page.getViewport({ scale: 1 });
        const targetWidth = canvas.parentElement?.clientWidth || 320;
        const scale = Math.min(2, Math.max(0.5, targetWidth / base.width));
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setState('done');
      } catch {
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
      try {
        task?.destroy?.();
      } catch {
        // ignore teardown errors
      }
    };
  }, [url]);

  return (
    <div className="doc-preview-pdfwrap">
      <canvas
        ref={canvasRef}
        className="doc-preview-canvas"
        style={{ display: state === 'done' ? 'block' : 'none' }}
      />
      {state === 'loading' && <p className="doc-preview-status">PDF 미리보기를 불러오는 중…</p>}
      {state === 'error' && (
        <p className="doc-preview-status">
          이 브라우저에서는 PDF 미리보기를 바로 표시하기 어려워요. 새 탭에서 원본을 열어 확인해 주세요.
        </p>
      )}
    </div>
  );
}

const TITLES = {
  pdf: 'PDF 원본 미리보기',
  image: '촬영/이미지 원본 미리보기',
  text: '텍스트 문서 미리보기',
  docx: 'DOCX 문서 파일',
  unknown: '문서 미리보기'
};

function PrivacyNote() {
  return (
    <p className="doc-preview-privacy">
      원본 파일은 서버에 저장하지 않고, 브라우저에서만 미리봅니다. 분석에는 추출된 텍스트만 사용돼요.
    </p>
  );
}

function DocumentPreview({ meta, text, onViewFull, readOnly = false }) {
  const kind = meta?.previewKind || (meta ? 'unknown' : 'text');
  const url = meta?.previewUrl || '';
  const value = (text || '').trim();
  const isLong = value.length > PREVIEW_THRESHOLD;

  // PDF — render the first page to a canvas (object/iframe can render blank).
  if (kind === 'pdf' && url) {
    return (
      <section className="doc-preview">
        <p className="doc-preview-title">{TITLES.pdf}</p>
        <PdfCanvasPreview url={url} />
        <a className="text-link-button" href={url} target="_blank" rel="noreferrer">새 탭에서 원본 열기</a>
        <PrivacyNote />
      </section>
    );
  }

  // Image — show the original picture.
  if (kind === 'image' && url) {
    return (
      <section className="doc-preview">
        <p className="doc-preview-title">{TITLES.image}</p>
        <div className="doc-preview-imagewrap">
          <img className="doc-preview-image" src={url} alt="문서 원본 미리보기" />
        </div>
        <a className="text-link-button" href={url} target="_blank" rel="noreferrer">새 탭에서 원본 열기</a>
        <PrivacyNote />
      </section>
    );
  }

  // DOCX — file card + extracted text snippet (browser can't render docx natively).
  if (kind === 'docx') {
    return (
      <section className="doc-preview">
        <p className="doc-preview-title">{TITLES.docx}</p>
        <div className="doc-preview-filecard">
          <span className="doc-preview-fileicon" aria-hidden="true">📘</span>
          <div>
            <p className="doc-preview-filename">{meta?.name || 'DOCX 문서'}</p>
            <p className="doc-preview-filenote">DOCX는 분석용 텍스트로 변환해 미리 보여줍니다.</p>
          </div>
        </div>
        {value && (
          <div className="doc-preview-paper is-clamped">
            <p className="doc-preview-text">{value}</p>
          </div>
        )}
        {!readOnly && onViewFull && (
          <button type="button" className="text-link-button" onClick={onViewFull}>추출 텍스트 보기/수정</button>
        )}
        <PrivacyNote />
      </section>
    );
  }

  // Unsupported preview type.
  if (kind === 'unknown') {
    return (
      <section className="doc-preview">
        <p className="doc-preview-title">{TITLES.unknown}</p>
        <p className="doc-preview-empty">
          미리보기를 지원하지 않는 형식입니다.{' '}
          {readOnly ? '분석 탭에서 추출 텍스트를 확인해 주세요.' : '추출 텍스트 보기/수정에서 내용을 확인해 주세요.'}
        </p>
        <PrivacyNote />
      </section>
    );
  }

  // TXT / MD / direct input — paper-style text preview.
  if (!value) return null;
  return (
    <section className="doc-preview">
      <p className="doc-preview-title">{TITLES.text}</p>
      <div className={`doc-preview-paper${isLong ? ' is-clamped' : ''}`}>
        <p className="doc-preview-text">{value}</p>
      </div>
      {isLong && !readOnly && onViewFull && (
        <button type="button" className="text-link-button" onClick={onViewFull}>전체 텍스트 보기</button>
      )}
      <PrivacyNote />
    </section>
  );
}

export default DocumentPreview;
