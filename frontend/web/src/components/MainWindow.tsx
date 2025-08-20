import React, { useRef, useState, useEffect } from "react";
import { Button } from "./Button";
import VideoDisplayer from "./VideoDisplayer";

const MainWindow = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<number | null>(null); // Optional: ID tracking if backend provides it
  const [wsFrameB64, setWsFrameB64] = useState<string | null>(null);
  const [noHelmetCount, setNoHelmetCount] = useState<number>(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [uploaded, setUploaded] = useState<boolean>(false);
  const [latestFps, setLatestFps] = useState<number>(25);
  // const [lastFrameIndex, setLastFrameIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // const rafRef = useRef<number | null>(null);

  // Handle video upload
  const handleVideoUpload = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    // In Electron, open native dialog via preload if available
    if (window && (window as any).electronAPI && !(e && e.target)) {
      try {
        const filePath: string | null = await (window as any).electronAPI.chooseVideoFile();
        if (!filePath) return;
        setFilename(filePath.split(/[/\\]/).pop() || filePath);
        // For Electron, create file URL to preview locally
        // Use main-process upload and preview via blob URL to avoid file:// restrictions
        const readRes = await (window as any).electronAPI.readVideoFile(filePath);
        if (readRes && readRes.base64 && readRes.name) {
          const binary = atob(readRes.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: "video/mp4" });
          const blobUrl = URL.createObjectURL(blob);
          setVideoSrc(blobUrl);
        }
        const uploadRes = await (window as any).electronAPI.uploadVideoFile(filePath);
        if (uploadRes?.ok) {
          const vid = uploadRes?.data?.video_id;
          if (vid) {
            setVideoId(vid);
            setUploaded(true);
          }
        } else {
          alert(`Video upload failed (${uploadRes?.status || 'unknown'})`);
        }
      } catch (err) {
        console.error("Electron file dialog failed", err);
      }
      return;
    }

    // Browser input fallback
    const file = e?.target?.files?.[0];
    if (file) {
      setFilename(file.name);
      const videoUrl = URL.createObjectURL(file);
      setVideoSrc(videoUrl);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("http://127.0.0.1:8000/upload/", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          setVideoId(data.video_id);
          setUploaded(true);
        } else {
          alert("Video upload failed");
        }
      } catch (error) {
        console.error("Error uploading video:", error);
        alert("Error uploading video.");
      }
    }
  };

  // WebSocket logic to receive detections
  const connectWebSocket = (maybeVideoId?: number) => {
    const websocket = new WebSocket(`ws://127.0.0.1:8000/ws`);
    websocket.onopen = () => {
      console.log("Connected to WebSocket");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // If backend provides per-video routing, filter by id
      if (maybeVideoId && message.video_id && message.video_id !== maybeVideoId) return;
      if (typeof message.fps === "number") setLatestFps(message.fps);
      if (typeof message.noHelmetCount === "number") {
        setNoHelmetCount(message.noHelmetCount);
      }
      if (message.frame) {
        setWsFrameB64(message.frame);
      }

      // Simple per-message sync of the left video based on frame_index and fps
      const fps = typeof message.fps === "number" ? message.fps : latestFps;
      const frameIndex = typeof message.frame_index === "number" ? message.frame_index : 0;
      const targetSeconds = fps > 0 ? frameIndex / fps : 0;
      const vid = videoRef.current;
      if (vid && !Number.isNaN(targetSeconds) && Number.isFinite(targetSeconds)) {
        const drift = Math.abs((vid.currentTime || 0) - targetSeconds);
        if (drift > 0.2) {
          try { vid.currentTime = targetSeconds; } catch {}
        }
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket connection closed");
      setWs(null);
    };
  };

  const startProcessing = async () => {
    if (!videoId) return alert("Upload a video first.");
    try {
      const res = await fetch(`http://127.0.0.1:8000/start/${videoId}`, { method: "POST" });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(errTxt || "Failed to start processing");
      }
      // Establish WS connection and reset sync clock
      connectWebSocket(videoId);
      // No playbackRate loop; rely on discrete seeks by message
    } catch (e) {
      console.error(e);
      alert("Could not start processing.");
    }
  };

  return (
    <div style={{ background: "#0b5cff", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div
            style={{
              aspectRatio: "16 / 9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Left: original preview */}
            <VideoDisplayer ref={videoRef} videoSrc={videoSrc ?? undefined} />
          </div>
          <div
            style={{
              aspectRatio: "16 / 9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#111",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Right: annotated frames from backend */}
            {wsFrameB64 ? (
              <img
                src={`data:image/jpeg;base64,${wsFrameB64}`}
                alt="detections"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div style={{ color: "#eee" }}>
                {uploaded ? "Video uploaded. Click 'Start Processing' to begin." : "Upload a video to begin."}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{ display: "none" }}
            id="video-upload"
          />
          <label htmlFor="video-upload">
            <Button
              label="Upload Video"
              variant="contained"
              color="primary"
              size="large"
              onClick={() => handleVideoUpload()}
            />
          </label>
          <Button
            label="Start Processing"
            variant="contained"
            color="secondary"
            size="large"
            onClick={startProcessing}
          />
          <div style={{ marginTop: 8, color: "#fff" }}>
            No-helmet count: <strong>{noHelmetCount}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainWindow;
