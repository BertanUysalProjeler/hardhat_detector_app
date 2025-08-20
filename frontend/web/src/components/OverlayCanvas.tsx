import React, { useEffect, useRef } from "react";
import { DetectionBox } from "../types/detection";

interface OverlayCanvasProps {
  imageSrc: string | null;
  boxes: DetectionBox[];
}

export function OverlayCanvas({ imageSrc, boxes }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;

    const draw = () => {
      if (!canvas || !ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;

      // draw frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // draw boxes + labels
      ctx.lineWidth = 2;
      ctx.font = "16px sans-serif";

      boxes.forEach((b) => {
        // choose color
        const isNoHelmet = b.label.toLowerCase().includes("no");
        const color = isNoHelmet ? "#e53935" : "#43a047";

        // box
        ctx.strokeStyle = color;
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // label background
        const text = `${b.label} ${(b.confidence * 100).toFixed(1)}%`;
        const tw = ctx.measureText(text).width + 8;
        const th = 20;
        const ty = b.y > th ? b.y - th : b.y + th;

        ctx.fillStyle = color;
        ctx.fillRect(b.x, ty - th + 4, tw, th);

        // label text
        ctx.fillStyle = "#fff";
        ctx.fillText(text, b.x + 4, ty);
      });
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [imageSrc, boxes]);

  return <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />;
}
