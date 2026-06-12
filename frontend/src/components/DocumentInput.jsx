import { useRef, useState } from 'react';
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

async function extractImageText(file) {
  // Korean + English recognition. OCR accuracy varies with photo quality.
  const { data } = await Tesseract.recognize(file, 'kor+eng');
  return (data?.text || '').trim();
}

function DocumentInput({ text, setText, loading, onAnalyze, onReset, onExample }) {
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
        setText(recognized);
        setImportMessage('');
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
    <section className="panel input-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">문서 입력</p>
          <h2>분석할 문서를 붙여넣으세요</h2>
        </div>
        <span className="sub-badge">FastAPI 연결</span>
      </div>

      <div className="example-row">
        <button type="button" className="ghost-button" onClick={() => onExample('terms')}>약관 예시</button>
        <button type="button" className="ghost-button" onClick={() => onExample('notice')}>공지문 예시</button>
        <button type="button" className="ghost-button" onClick={() => onExample('paper')}>논문 예시</button>
        <button type="button" className="ghost-button" onClick={handleImportClick} disabled={disabled}>파일 가져오기</button>
        <button type="button" className="ghost-button" onClick={handleCameraClick} disabled={disabled}>사진 찍어 분석하기</button>
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
      <textarea
        id="document-input"
        className="input-box"
        placeholder="분석할 문서를 붙여넣어 주세요."
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={12}
        disabled={disabled}
      />

      <div className="button-row">
        <button type="button" className="primary-button" onClick={onAnalyze} disabled={disabled}>
          {loading ? '분석 중입니다...' : '분석하기'}
        </button>
        <button type="button" className="secondary-button" onClick={onReset} disabled={disabled}>
          초기화
        </button>
      </div>

      {importMessage && <p className="helper-text">{importMessage}</p>}
      <p className="helper-text">.txt, .md, .pdf, .docx, 이미지 파일을 지원합니다. 사진 문서는 OCR로 텍스트를 추출합니다.</p>
      <p className="helper-text">입력값은 FastAPI의 /analyze로 전송됩니다.</p>
    </section>
  );
}

export default DocumentInput;
