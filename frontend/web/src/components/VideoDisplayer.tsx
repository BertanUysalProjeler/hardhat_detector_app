import React from "react";

type Props = { videoSrc?: string | null };

const VideoDisplayer = React.forwardRef<HTMLVideoElement, Props>(({ videoSrc }, ref) => {
  if (!videoSrc) {
    return <div style={{ color: "#fff", opacity: 0.8 }}>No video selected</div>;
  }
  return (
    <video
      ref={ref}
      src={videoSrc}
      controls
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    />
  );
});

export default VideoDisplayer;
