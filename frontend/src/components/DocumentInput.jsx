import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';
import Tesseract from 'tesseract.js';

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
  onAutoTriggerHandled
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const disabled = loading || busy;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Allow the Home screen to deep-link straight into a file / camera picker.
  // This only opens the existing native input; it does not alter extraction logic.
  useEffect(() => {
    if (!autoTrigger) return;
    if (autoTrigger === 'file') {
      fileInputRef.current?.click();
    } else if (autoTrigger === 'camera') {
      cameraInputRef.current?.click();
    }
    onAutoTriggerHandled?.();
  }, [autoTrigger, onAutoTriggerHandled]);

  const processFile = async (file) => {
    const extension = getExtension(file);
    const imageByMime = isImageFile(file, extension);

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
        setText(extracted);
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
        setText(extracted);
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
        // Put OCR text into the textarea for review regardless of quality (do not block analysis).
        setText(recognized);
        if (isLowQualityOcr(recognized)) {
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
      setText(content);
      setImportMessage('');
    } catch {
      setImportMessage('파일을 읽는 중 문제가 발생했습니다.');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    // Reset the input value so selecting the same file again still triggers change.
    event.target.value = '';
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      await processFile(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card input-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">문서 입력</p>
          <h2 className="panel-title">분석할 문서를 넣어 주세요</h2>
        </div>
      </div>

      <span className="group-label">예시로 빠르게 시작</span>
      <div className="chip-row">
        <button type="button" className="chip" onClick={() => onExample('terms')}>약관 예시</button>
        <button type="button" className="chip" onClick={() => onExample('notice')}>공지문 예시</button>
        <button type="button" className="chip" onClick={() => onExample('paper')}>논문 예시</button>
      </div>

      <div className="import-row">
        <button type="button" className="import-button" onClick={handleImportClick} disabled={disabled}>
          <span className="import-icon" aria-hidden="true">📁</span>
          <span>파일 가져오기</span>
        </button>
        <button type="button" className="import-button" onClick={handleCameraClick} disabled={disabled}>
          <span className="import-icon" aria-hidden="true">📷</span>
          <span>사진 찍어 분석하기</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      <label className="sr-only" htmlFor="document-input">문서 입력</label>
      <div className="textarea-wrap">
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

      {importMessage && <p className="helper-text helper-strong">{importMessage}</p>}
      <p className="helper-text">.txt · .md · .pdf · .docx · 이미지 파일을 지원해요. 사진 문서는 OCR로 텍스트를 추출하니, 인식 결과를 확인한 뒤 분석해 주세요.</p>
    </section>
  );
}

export default DocumentInput;
