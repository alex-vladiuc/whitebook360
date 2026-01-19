import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  title: string;
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CameraCapture({
  title,
  onCapture,
  onCancel,
  isLoading,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedImage(URL.createObjectURL(blob));
          stopCamera();
        }
      },
      'image/jpeg',
      0.8
    );
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="bg-card rounded-2xl shadow-modal p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera / Preview */}
        <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden mb-4">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-center p-4">
              <p>{error}</p>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Actions */}
        <div className="flex gap-3">
          {capturedImage ? (
            <>
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={confirmPhoto}
                className="flex-1"
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Uploading...' : 'Confirm'}
              </Button>
            </>
          ) : (
            <Button
              onClick={capturePhoto}
              className="flex-1"
              disabled={!stream || !!error}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
