import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';
import Tesseract from 'tesseract.js';
import CameraCapture from './CameraCapture';
import DocumentPreview from './DocumentPreview';
import ImportedDocumentCard from './ImportedDocumentCard';

// Bundle the pdf.js worker locally (works on static hosting without a CDN).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const TEXT_EXTENSIONS = ['.txt', '.md'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const SUPPORTED_EXTENSIONS = [...TEXT_EXTENSIONS, '.pdf', '.docx', ...IMAGE_EXTENSIONS];

function getExtension(file) {
  const name = (file?.name || '').toLowerCase();
  return SUPPORTED_EXTENSIONS.find((ext) => name.endsWith(ext)) || '';
}

function isImageFile(file, extension) {
  if (extension && IMAGE_EXTENSIONS.includes(extension)) {
    return true;
  }
  // Camera captures may not carry a recognizable extension; fall back to MIME type.
  return (file?.type || '').startsWith('image/');
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('read error'));
    reader.readAsText(file);
  });
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    pages.push(pageText);
  }
  return pages.join('\n\n').trim();
}

async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return (value || '').trim();
}

// Load a file into an HTMLImageElement.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load error'));
    };
    img.src = url;
  });
}

// Preprocess an image to improve OCR: upscale small images 2x, grayscale, and
// apply a simple contrast stretch. Returns a canvas; falls back to the raw file
// if anything goes wrong so OCR can still be attempted.
async function preprocessImage(file) {
  try {
    const img = await loadImage(file);
    const scale = Math.min(img.width, img.height) < 1000 ? 2 : 1;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const px = imageData.data;
    const contrast = 1.3; // mild contrast boost
    for (let i = 0; i < px.length; i += 4) {
      // grayscale (luminance)
      const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      // contrast stretch around mid-gray
      let value = (gray - 128) * contrast + 128;
      value = Math.max(0, Math.min(255, value));
      px[i] = value;
      px[i + 1] = value;
      px[i + 2] = value;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch {
    return file;
  }
}

async function extractImageText(file) {
  // Korean + English recognition with document-oriented page segmentation.
  // OCR accuracy varies with photo quality; preprocessing improves it but is not perfect.
  const input = await preprocessImage(file);
  const { data } = await Tesseract.recognize(input, 'kor+eng', {
    tessedit_pageseg_mode: '6', // assume a single uniform block of text
  });
  return (data?.text || '').trim();
}

// Heuristic for low-quality OCR. Does NOT block analysis — only warns.
function isLowQualityOcr(textValue) {
  const value = (textValue || '').trim();
  if (value.length < 30) return true;

  const koreanCount = (value.match(/[가-힣]/g) || []).length;
  const lettersAndKorean = (value.match(/[가-힣a-zA-Z]/g) || []).length;
  // For a Korean document, very low Korean ratio usually means garbled OCR.
  if (lettersAndKorean > 0 && koreanCount / lettersAndKorean < 0.15) return true;

  // Too many isolated symbols / fragments relative to meaningful characters.
  const symbolCount = (value.match(/[^가-힣a-zA-Z0-9\s]/g) || []).length;
  if (value.length > 0 && symbolCount / value.length > 0.4) return true;

  return false;
}

function DocumentInput({
  text,
  setText,
  loading,
  onAnalyze,
  onReset,
  onExample,
  confirmOcr = true,
  autoTrigger = null,
  onAutoTriggerHandled,
  onDocMeta
}) {
  const fileInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  // mode: 'choose' (pick how to start) | 'direct' (paste/type) | 'imported' (file card)
  const [mode, setMode] = useState(text ? 'direct' : 'choose');
  const [docMeta, setDocMeta] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const lastSourceRef = useRef('file');

  const disabled = loading || busy;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    setCameraOpen(true);
  };

  const handleReimport = () => {
    if (lastSourceRef.current === 'camera') {
      setCameraOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleSelectDirect = () => {
    setMode('direct');
    setDocMeta(null);
    onDocMeta?.(null);
    setImportMessage('');
  };

  const handleExampleClick = (type) => {
    onExample(type);
    setMode('direct');
    setDocMeta(null);
    onDocMeta?.(null);
    setShowEditor(false);
    setImportMessage('');
  };

  // Allow the Home screen to deep-link straight into a file / camera picker.
  // This only opens the existing native input; it does not alter extraction logic.
  useEffect(() => {
    if (!autoTrigger) return undefined;
    if (autoTrigger === 'camera') {
      setCameraOpen(true);
      onAutoTriggerHandled?.();
      return undefined;
    }
    // Defer slightly so the analyze screen is mounted before the picker opens.
    const timer = setTimeout(() => fileInputRef.current?.click(), 0);
    onAutoTriggerHandled?.();
    return () => clearTimeout(timer);
  }, [autoTrigger, onAutoTriggerHandled]);

  // Show the imported-document card (and the preview) for an extracted file.
  const applyImported = (content, meta, openEditor) => {
    const fullMeta = { ...meta, charCount: content.length };
    setText(content);
    setDocMeta(fullMeta);
    onDocMeta?.(fullMeta);
    setMode('imported');
    setShowEditor(Boolean(openEditor));
  };

  const processFile = async (file, source = 'file') => {
    lastSourceRef.current = source;
    const extension = getExtension(file);
    const imageByMime = isImageFile(file, extension);
    const fileName = file?.name || (source === 'camera' ? '촬영한 문서' : '가져온 문서');

    if (!extension && !imageByMime) {
      setImportMessage('현재 MVP에서는 .txt, .md, .pdf, .docx, 이미지 파일만 지원합니다.');
      return;
    }

    try {
      if (extension === '.pdf') {
        setImportMessage('PDF에서 텍스트를 읽는 중입니다.');
        let extracted = '';
        try {
          extracted = await extractPdfText(file);
        } catch {
          setImportMessage('PDF에서 텍스트를 읽지 못했습니다. 스캔본 PDF는 사진으로 촬영해 OCR 기능을 사용해 주세요.');
          return;
        }
        if (!extracted) {
          setImportMessage('PDF에서 텍스트를 읽지 못했습니다. 스캔본 PDF는 사진으로 촬영해 OCR 기능을 사용해 주세요.');
          return;
        }
        applyImported(
          extracted,
          { name: fileName, kind: 'PDF', status: 'extracted', previewUrl: URL.createObjectURL(file), previewKind: 'pdf' },
          false
        );
        setImportMessage('');
        return;
      }

      if (extension === '.docx') {
        setImportMessage('DOCX 문서에서 텍스트를 읽는 중입니다.');
        let extracted = '';
        try {
          extracted = await extractDocxText(file);
        } catch {
          setImportMessage('DOCX 문서에서 텍스트를 읽지 못했습니다.');
          return;
        }
        if (!extracted) {
          setImportMessage('DOCX 문서에서 텍스트를 읽지 못했습니다.');
          return;
        }
        applyImported(
          extracted,
          { name: fileName, kind: 'DOCX', status: 'extracted', previewUrl: null, previewKind: 'docx' },
          false
        );
        setImportMessage('');
        return;
      }

      if (imageByMime) {
        setImportMessage('사진에서 텍스트를 인식하는 중입니다. 잠시만 기다려 주세요.');
        let recognized = '';
        try {
          recognized = await extractImageText(file);
        } catch {
          setImportMessage('사진에서 텍스트를 충분히 인식하지 못했습니다. 밝은 곳에서 문서가 화면에 꽉 차게 다시 촬영해 주세요.');
          return;
        }
        if (!recognized) {
          setImportMessage('사진에서 텍스트를 충분히 인식하지 못했습니다. 밝은 곳에서 문서가 화면에 꽉 차게 다시 촬영해 주세요.');
          return;
        }
        // Keep OCR text available for review regardless of quality (never block analysis).
        const lowQuality = isLowQualityOcr(recognized);
        // When OCR confirmation is on (or quality is low) open the editor for review.
        applyImported(
          recognized,
          {
            name: fileName,
            kind: '이미지',
            status: lowQuality ? 'review' : 'ocr',
            previewUrl: URL.createObjectURL(file),
            previewKind: 'image'
          },
          lowQuality || confirmOcr
        );
        if (lowQuality) {
          setImportMessage('OCR 인식 품질이 낮습니다. 문서가 화면에 꽉 차도록 다시 촬영하거나 인식된 문장을 직접 수정해 주세요.');
        } else if (confirmOcr) {
          setImportMessage('사진에서 텍스트를 추출했습니다. 내용을 확인한 뒤 분석하기를 눌러 주세요.');
        } else {
          setImportMessage('사진에서 텍스트를 추출했습니다.');
        }
        return;
      }

      // .txt / .md
      const content = await readAsText(file);
      applyImported(
        content,
        { name: fileName, kind: '텍스트', status: 'extracted', previewUrl: null, previewKind: 'text' },
        false
      );
      setImportMessage('');
    } catch {
      setImportMessage('파일을 읽는 중 문제가 발생했습니다.');
    }
  };

  const handleFileChange = async (event, source = 'file') => {
    const file = event.target.files?.[0];
    // Reset the input value so selecting the same file again still triggers change.
    event.target.value = '';
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      await processFile(file, source);
    } finally {
      setBusy(false);
    }
  };

  // In-app camera photo → reuse the existing image OCR pipeline.
  const handleCapturedPhoto = async (file) => {
    setCameraOpen(false);
    if (!file) return;
    setBusy(true);
    try {
      await processFile(file, 'camera');
    } finally {
      setBusy(false);
    }
  };

  const titleByMode = mode === 'imported'
    ? '가져온 문서'
    : mode === 'direct'
      ? '분석할 문서를 입력하세요'
      : '어떻게 분석할까요?';

  const showActionBar = mode === 'direct' || mode === 'imported';

  const editor = (
    <div className="textarea-wrap">
      <label className="sr-only" htmlFor="document-input">문서 입력</label>
      <textarea
        id="document-input"
        className="input-box"
        placeholder="분석할 문서를 붙여넣어 주세요."
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={12}
        disabled={disabled}
      />
      <span className="char-count">{text.length}자</span>
    </div>
  );

  return (
    <section className="card input-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">문서 입력</p>
          <h2 className="panel-title">{titleByMode}</h2>
        </div>
      </div>

      {/* Hidden native input for file import (camera uses the in-app modal). */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx,image/*"
        className="sr-only"
        onChange={(event) => handleFileChange(event, 'file')}
      />

      {cameraOpen && (
        <CameraCapture onCapture={handleCapturedPhoto} onClose={() => setCameraOpen(false)} />
      )}

      {mode === 'choose' && (
        <>
          <p className="input-guide">
            문서를 직접 입력하거나 파일/사진을 가져오면 분석을 시작할 수 있어요.
          </p>
          <div className="import-options">
            <button type="button" className="option-button" onClick={handleSelectDirect} disabled={disabled}>
              <span className="option-icon" aria-hidden="true">✍️</span>
              <span className="option-text">
                <strong>직접 입력</strong>
                <small>문서를 붙여넣어 분석</small>
              </span>
            </button>
            <button type="button" className="option-button" onClick={handleImportClick} disabled={disabled}>
              <span className="option-icon" aria-hidden="true">📁</span>
              <span className="option-text">
                <strong>파일 가져오기</strong>
                <small>PDF · DOCX · 텍스트 · 이미지</small>
              </span>
            </button>
            <button type="button" className="option-button" onClick={handleCameraClick} disabled={disabled}>
              <span className="option-icon" aria-hidden="true">📷</span>
              <span className="option-text">
                <strong>사진 찍어 분석하기</strong>
                <small>휴대폰은 카메라가 열려요 · PC는 사진 선택</small>
              </span>
            </button>
          </div>

          <p className="helper-text input-cam-note">
            사진 찍어 분석하기를 누르면 앱 안에서 카메라가 열려요. 카메라 권한을 허용해 주세요.
            카메라를 쓸 수 없으면 파일 가져오기로 사진을 선택할 수 있어요.
          </p>

          <span className="group-label">또는 예시로 빠르게 시작</span>
          <div className="chip-row">
            <button type="button" className="chip" onClick={() => handleExampleClick('terms')}>약관 예시</button>
            <button type="button" className="chip" onClick={() => handleExampleClick('notice')}>공지문 예시</button>
            <button type="button" className="chip" onClick={() => handleExampleClick('paper')}>논문 예시</button>
          </div>
        </>
      )}

      {mode === 'imported' && (
        <>
          <ImportedDocumentCard
            meta={docMeta}
            editorOpen={showEditor}
            onToggleEditor={() => setShowEditor((prev) => !prev)}
            onReimport={handleReimport}
          />
          {!showEditor && <DocumentPreview meta={docMeta} text={text} onViewFull={() => setShowEditor(true)} />}
          {showEditor && editor}
        </>
      )}

      {mode === 'direct' && (
        <>
          <div className="chip-row">
            <button type="button" className="chip" onClick={() => handleExampleClick('terms')}>약관 예시</button>
            <button type="button" className="chip" onClick={() => handleExampleClick('notice')}>공지문 예시</button>
            <button type="button" className="chip" onClick={() => handleExampleClick('paper')}>논문 예시</button>
          </div>
          {editor}
        </>
      )}

      {showActionBar && (
        <div className="action-bar">
          <button type="button" className="primary-button" onClick={onAnalyze} disabled={disabled}>
            {loading ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                분석 중입니다…
              </>
            ) : (
              '분석하기'
            )}
          </button>
          <button type="button" className="secondary-button" onClick={onReset} disabled={disabled}>
            초기화
          </button>
        </div>
      )}

      {importMessage && <p className="helper-text helper-strong">{importMessage}</p>}
      {mode === 'choose' && (
        <p className="helper-text">.txt · .md · .pdf · .docx · 이미지 파일을 지원해요. 사진 문서는 OCR로 텍스트를 추출합니다.</p>
      )}
    </section>
  );
}

export default DocumentInput;
