import { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  height?: number;
}

export const SignaturePad = ({ value, onChange, label, height = 120 }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Restore from value on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHasStrokes(true);
    };
    img.src = value;
  }, []); // Only on mount

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }, []);

  const startDrawing = useCallback((x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [getCtx]);

  const draw = useCallback((x: number, y: number) => {
    if (!drawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStrokes(true);
  }, [getCtx]);

  const stopDrawing = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  }, [onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  }, [startDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  }, [draw]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  }, [startDrawing]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  }, [draw]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasStrokes(false);
    onChange(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="relative max-w-[400px]">
        <canvas
          ref={canvasRef}
          width={400}
          height={height}
          className="w-full border-dashed border-2 border-gray-300 rounded-lg bg-white cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm">Signez ici</span>
          </div>
        )}
      </div>
      {hasStrokes && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="text-gray-500">
          <Eraser className="h-3.5 w-3.5 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  );
};
