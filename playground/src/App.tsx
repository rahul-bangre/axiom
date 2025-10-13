import { useState } from "react";
import Split from "react-split";
import { Editor } from "./components/Editor";
import { OutputPanel } from "./components/OutputPanel";
import { ExampleSelector } from "./components/ExampleSelector";
import { FileTree } from "./components/FileTree";
import { TabBar } from "./components/TabBar";
import { runAxiomCode } from "./lib/axiom-runtime";
import type { ExecutionResult } from "./lib/axiom-runtime";
import { VirtualFS } from "./lib/virtual-fs";
import { examples } from "./lib/examples";

function App() {
  const initialExample = examples[0];
  const [virtualFS, setVirtualFS] = useState(() => {
    if (initialExample.files) {
      return new VirtualFS(initialExample.files);
    }
    return new VirtualFS({ "main.ax": initialExample.code || "" });
  });

  const [activeFile, setActiveFile] = useState("main.ax");
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const files = virtualFS.listFiles();
  const currentCode = virtualFS.readFile(activeFile) || "";

  const handleCodeChange = (newCode: string) => {
    virtualFS.writeFile(activeFile, newCode);
    setVirtualFS(new VirtualFS(virtualFS.getAllFiles()));
  };

  const handleRun = () => {
    setIsRunning(true);

    setTimeout(async () => {
      try {
        const code = virtualFS.readFile(activeFile) || "";
        const executionResult = await runAxiomCode(code, activeFile, virtualFS);
        setResult(executionResult);
      } catch (error) {
        setResult({
          success: false,
          output: "",
          error: error instanceof Error ? error.message : String(error),
          executionTime: 0,
        });
      } finally {
        setIsRunning(false);
      }
    }, 10);
  };

  const handleClear = () => {
    setResult(null);
  };

  const handleLoadExample = (exampleName: string) => {
    const example = examples.find((ex) => ex.name === exampleName);
    if (!example) return;

    if (example.files) {
      setVirtualFS(new VirtualFS(example.files));
      setActiveFile("main.ax");
    } else if (example.code) {
      setVirtualFS(new VirtualFS({ "main.ax": example.code }));
      setActiveFile("main.ax");
    }
    setResult(null);
  };

  const handleFileCreate = (fileName: string) => {
    virtualFS.writeFile(fileName, "// new file\n");
    setVirtualFS(new VirtualFS(virtualFS.getAllFiles()));
    setActiveFile(fileName);
  };

  const handleFileDelete = (fileName: string) => {
    virtualFS.deleteFile(fileName);
    const remainingFiles = virtualFS.listFiles();
    if (activeFile === fileName && remainingFiles.length > 0) {
      setActiveFile(remainingFiles[0]);
    }
    setVirtualFS(new VirtualFS(virtualFS.getAllFiles()));
  };

  const handleFileSelect = (fileName: string) => {
    setActiveFile(fileName);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Axiom Playground</h1>
          <span className="tagline">functional programming language</span>
        </div>

        <div className="header-controls">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              padding: "8px 12px",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
          >
            {sidebarCollapsed ? "▶" : "◀"}
          </button>
          <ExampleSelector onSelectExample={handleLoadExample} />
          <button
            onClick={handleRun}
            className="run-button"
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </header>

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {!sidebarCollapsed && (
          <FileTree
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
          />
        )}

        <Split
          className="split-container"
          sizes={[60, 40]}
          minSize={300}
          expandToMin={false}
          gutterSize={10}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
          style={{ flex: 1 }}
        >
          <div className="editor-container" style={{ display: "flex", flexDirection: "column" }}>
            <TabBar
              files={files}
              activeFile={activeFile}
              onFileSelect={handleFileSelect}
            />
            <div style={{ flex: 1 }}>
              <Editor
                value={currentCode}
                onChange={handleCodeChange}
                onRun={handleRun}
              />
            </div>
          </div>

          <OutputPanel
            result={result}
            onClear={handleClear}
          />
        </Split>
      </div>
    </div>
  );
}

export default App;
