// Backend wire types (exactly what FastAPI broadcasts)
export interface WireDetectionBox {
  label: string;
  confidence: number; // 0..1
  bbox: [number, number, number, number]; // [x1,y1,x2,y2]
}

export interface WireMessage {
  video_id: number;
  frame_index: number;
  noHelmetCount: number;
  detections: WireDetectionBox[];
  frame?: string;     // base64 jpeg (no data: prefix)
  filename?: string;  // optional if you add it server-side
}

// UI types used by the frontend
export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface DetectionMessage {
  filename?: string;
  frame?: string;          // base64 jpeg (no prefix)
  boxes: DetectionBox[];
  noHelmetCount: number;
}
