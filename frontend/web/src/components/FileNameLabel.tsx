interface FileNameLabelProps {
  filename?: string | null; // Allow null as well
}

export function FileNameLabel({ filename }: FileNameLabelProps) {
  if (!filename) return null;
  return (
    <div style={{ fontSize: 14, color: "#555", marginTop: 8 }}>
      File: <span style={{ fontFamily: "monospace" }}>{filename}</span>
    </div>
  );
}
