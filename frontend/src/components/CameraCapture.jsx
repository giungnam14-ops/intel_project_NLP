import { useEffect, useRef, useState } from 'react';

// In-app camera using getUserMedia. Captures a JPEG File and hands it to
// onCapture (which feeds the existing image OCR pipeline). The stream is always
// stopped on close / capture / unmount so the camera never stays on.
function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blobRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | live | captured | error
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const start = async () => {
    setStatus('loading');
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('이 브라우저는 카메라를 지원하지 않아요. 사진 파일로 가져와 주세요.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('live');
    } catch {
      setStatus('error');
      setError('카메라 권한을 허용하지 않았거나 사용할 수 있는 카메라가 없어요. 사진 파일로 가져와 주세요.');
    }
  };

  // Start on mount; always stop the stream on unmount.
  useEffect(() => {
    start();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke the captured preview URL when it changes / unmounts.
  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const handleShoot = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        blobRef.current = blob;
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoUrl(URL.createObjectURL(blob));
        setStatus('captured');
        stopStream(); // freeze + turn camera off while reviewing
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    blobRef.current = null;
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl('');
    }
    start();
  };

  const handleUse = () => {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    stopStream();
    onCapture(file);
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="camera-modal" role="dialog" aria-modal="true" aria-label="사진 찍어 분석">
      <div className="camera-sheet">
        <div className="camera-head">
          <span className="camera-title">사진 찍어 분석</span>
          <button type="button" className="camera-close" onClick={handleClose} aria-label="닫기">✕</button>
        </div>

        <p className="camera-note">
          휴대폰에서는 후면 카메라를 우선 사용해요. 카메라 권한을 허용해야 촬영할 수 있어요.
          PC에서는 웹캠이 열릴 수 있어요.
        </p>

        <div className="camera-stage">
          {status === 'error' ? (
            <p className="camera-error">{error}</p>
          ) : status === 'captured' ? (
            <img className="camera-preview" src={photoUrl} alt="촬영한 사진 미리보기" />
          ) : (
            <video ref={videoRef} className="camera-video" playsInline muted />
          )}
          {status === 'loading' && <p className="camera-loading">카메라를 여는 중…</p>}
        </div>

        <div className="camera-actions">
          {status === 'live' && (
            <button type="button" className="primary-button" onClick={handleShoot}>촬영하기</button>
          )}
          {status === 'captured' && (
            <>
              <button type="button" className="secondary-button" onClick={handleRetake}>다시 찍기</button>
              <button type="button" className="primary-button" onClick={handleUse}>이 사진 사용하기</button>
            </>
          )}
          {status === 'error' && (
            <button type="button" className="secondary-button" onClick={handleClose}>닫기</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;
