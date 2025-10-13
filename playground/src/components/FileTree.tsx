import { useState } from "react";

interface FileTreeProps {
  files: string[];
  activeFile: string;
  onFileSelect: (file: string) => void;
  onFileCreate: (name: string) => void;
  onFileDelete: (file: string) => void;
}

export function FileTree({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
}: FileTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleCreate = () => {
    if (newFileName.trim()) {
      const fileName = newFileName.endsWith(".ax") ? newFileName : newFileName + ".ax";
      onFileCreate(fileName);
      setNewFileName("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewFileName("");
    }
  };

  return (
    <div
      style={{
        width: "250px",
        background: "#252526",
        borderRight: "1px solid #3e3e3e",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #3e3e3e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#cccccc",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Files
        </span>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "#cccccc",
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
          }}
          title="New File"
        >
          +
        </button>
      </div>

      {/* File List */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {isCreating && (
          <div style={{ padding: "4px 12px" }}>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (newFileName.trim()) {
                  handleCreate();
                } else {
                  setIsCreating(false);
                }
              }}
              autoFocus
              placeholder="filename.ax"
              style={{
                width: "100%",
                background: "#3c3c3c",
                border: "1px solid #0e639c",
                color: "#cccccc",
                padding: "4px 8px",
                fontSize: "13px",
                fontFamily: "monospace",
                outline: "none",
              }}
            />
          </div>
        )}

        {files.map((file) => (
          <div
            key={file}
            onClick={() => onFileSelect(file)}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: activeFile === file ? "#37373d" : "transparent",
              color: activeFile === file ? "#ffffff" : "#cccccc",
              fontSize: "13px",
              fontFamily: "monospace",
            }}
            onMouseEnter={(e) => {
              if (activeFile !== file) {
                e.currentTarget.style.background = "#2a2d2e";
              }
            }}
            onMouseLeave={(e) => {
              if (activeFile !== file) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span>📄 {file}</span>
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(`Delete ${file}?`)
                  ) {
                    onFileDelete(file);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#858585",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "2px 4px",
                }}
                title="Delete"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
