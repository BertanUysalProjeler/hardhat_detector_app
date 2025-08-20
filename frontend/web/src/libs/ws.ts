// frontend/web/src/libs/ws.ts
export type DetectionBox = {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1,y1,x2,y2]
};

export type DetectionMessage = {
  video_id: number;
  frame_index: number;
  noHelmetCount: number;
  detections: DetectionBox[];
  frame?: string; // base64 JPEG
};

export function connectWS(onMessage: (msg: DetectionMessage) => void) {
  const ws = new WebSocket("ws://localhost:8000/ws");

  ws.onopen = () => console.log("✅ WS connected");
  ws.onerror = (e) => console.error("❌ WS error", e);
  ws.onclose = () => console.warn("⚠️ WS closed");

  ws.onmessage = (event) => {
    try {
      const data: DetectionMessage = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.warn("Non-JSON WS message ignored");
    }
  };

  return ws;
}
