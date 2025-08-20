import { useEffect, useRef, useState } from "react";
import { DetectionBox, DetectionMessage, WireMessage } from "../types/detection";

export function useDetections() {
  const [latestFrameUrl, setLatestFrameUrl] = useState<string | null>(null);
  const [lastDetections, setLastDetections] = useState<DetectionMessage | null>(null);
  const [noHelmetCount, setNoHelmetCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WS connected");
    ws.onerror = (e) => console.error("❌ WS error", e);
    ws.onclose = () => console.warn("⚠️ WS closed");

    ws.onmessage = (event) => {
      // Parse as the wire format your backend sends
      const data = JSON.parse(event.data) as WireMessage;

      // Map detections to UI boxes (x,y,width,height)
      const boxes: DetectionBox[] = (data.detections || []).map((d) => {
        const [x1, y1, x2, y2] = d.bbox;
        return {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
          label: d.label,
          confidence: d.confidence,
        };
      });

      // Save latest frame preview if present
      if (data.frame) {
        setLatestFrameUrl(`data:image/jpeg;base64,${data.frame}`);
      }

      // Save structured detection payload
      setLastDetections({
        filename: data.filename,
        frame: data.frame,
        boxes,
        noHelmetCount: data.noHelmetCount ?? 0,
      });

      setNoHelmetCount(data.noHelmetCount ?? 0);
    };

    return () => {
      try {
        ws.close();
      } catch {}
      wsRef.current = null;
    };
  }, []);

  return { latestFrameUrl, lastDetections, noHelmetCount, wsRef };
}
