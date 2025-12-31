import React, { useRef, useEffect, useState, useCallback } from 'react';
// Sửa: SearchPlus -> ZoomIn, SearchMinus -> ZoomOut để đúng với phiên bản Lucide mới
import { Camera, RotateCcw, Check, X, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
// Sửa: Import Area trực tiếp từ 'react-easy-crop' thay vì /types
import { Point, Area } from 'react-easy-crop';

interface CameraScannerProps {
  onCapture: (base64Data: string) => void;
  onClose: () => void;
}

// Hàm trợ giúp để tạo ảnh từ URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context for canvas');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => resolve(reader.result as string);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.9);
  });
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(10);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States cho Cropper
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const startCamera = async () => {
    try {
      setCountdown(10);
      setCapturedImage(null);
      setError(null);
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Không thể truy cập camera. Vui lòng cấp quyền.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    let timer: number;
    if (countdown !== null && countdown > 0 && !capturedImage && !error) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !capturedImage && !error) {
      captureImage();
    }
    return () => clearTimeout(timer);
  }, [countdown, capturedImage, error]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState < 2) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(base64);
        setCountdown(null);
        stopCamera();
      }
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    startCamera();
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (capturedImage && croppedAreaPixels) {
      try {
        const croppedImageBase64 = await getCroppedImg(capturedImage, croppedAreaPixels);
        onCapture(croppedImageBase64);
      } catch (e) {
        console.error("Error getting cropped image:", e);
      }
    } else if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {!capturedImage ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[85%] h-[30%] md:w-[60%] md:h-[40%] border-[4px] border-emerald-400 rounded-[2rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
              {!error && (
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
              )}
            </div>
          </div>

          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[12rem] font-black text-white/90 animate-pulse">{countdown}</span>
            </div>
          )}

          {error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-[2rem] text-center max-w-xs shadow-2xl">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="font-bold text-slate-800 mb-6">{error}</p>
              <button onClick={startCamera} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Thử lại</button>
            </div>
          )}

          <div className="absolute bottom-12 left-0 right-0 px-10 flex justify-between items-center text-white">
            <button onClick={onClose} className="p-4 bg-white/10 backdrop-blur-md rounded-full"><X className="w-6 h-6" /></button>
            <button onClick={captureImage} className="p-6 bg-emerald-500 rounded-full border-4 border-white/20 shadow-lg"><Camera className="w-8 h-8 text-white" /></button>
            <div className="w-14 h-14" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col bg-slate-950 p-6 md:p-12">
          <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
            <div className="relative w-full h-full max-w-2xl max-h-[70vh] bg-black rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
              <Cropper
                image={capturedImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={true}
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full text-white shadow-lg">
                <ZoomOut className="w-5 h-5 opacity-70" />
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-40 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <ZoomIn className="w-5 h-5 opacity-70" />
            </div>

            <div className="text-center text-white mt-10">
              <h3 className="text-2xl font-black mb-2">Điều chỉnh đề bài</h3>
              <p className="text-slate-400 text-sm">Kéo và phóng to để chọn vùng chính xác</p>
            </div>
          </div>

          <div className="flex gap-4 max-w-md mx-auto w-full pb-10 mt-auto">
            <button onClick={handleRetry} className="flex-1 py-5 bg-white/10 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3">
              <RotateCcw className="w-5 h-5" /> Chụp lại
            </button>
            <button onClick={handleConfirm} className="flex-[1.5] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3">
              <Check className="w-6 h-6" /> Gửi AI
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        @keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }
      `}</style>
    </div>
  );
};

export default CameraScanner;
