interface TabBarProps {
  files: string[];
  activeFile: string;
  onFileSelect: (file: string) => void;
}

export function TabBar({ files, activeFile, onFileSelect }: TabBarProps) {
  return (
    <div
      style={{
        display: "flex",
        background: "#252526",
        borderBottom: "1px solid #3e3e3e",
        height: "35px",
        overflow: "auto",
      }}
    >
      {files.map((file) => (
        <div
          key={file}
          onClick={() => onFileSelect(file)}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            background: activeFile === file ? "#1e1e1e" : "#2d2d2d",
            color: activeFile === file ? "#ffffff" : "#969696",
            fontSize: "13px",
            fontFamily: "monospace",
            borderRight: "1px solid #252526",
            borderTop: activeFile === file ? "2px solid #0e639c" : "2px solid transparent",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (activeFile !== file) {
              e.currentTarget.style.background = "#323233";
            }
          }}
          onMouseLeave={(e) => {
            if (activeFile !== file) {
              e.currentTarget.style.background = "#2d2d2d";
            }
          }}
        >
          {file}
        </div>
      ))}
    </div>
  );
}
