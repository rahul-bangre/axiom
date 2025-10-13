import { useState } from "react";
import Split from "react-split";
import { Editor } from "./components/Editor";
import { OutputPanel } from "./components/OutputPanel";
import { ExampleSelector } from "./components/ExampleSelector";
import { runAxiomCode } from "./lib/axiom-runtime";
import type { ExecutionResult } from "./lib/axiom-runtime";
import { examples } from "./lib/examples";

function App() {
  const [code, setCode] = useState(examples[0].code);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);

    // Use setTimeout to allow UI to update
    setTimeout(async () => {
      try {
        const executionResult = await runAxiomCode(code);
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

  const handleLoadExample = (exampleCode: string) => {
    setCode(exampleCode);
    setResult(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Axiom Playground</h1>
          <span className="tagline">functional programming language</span>
        </div>

        <div className="header-controls">
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
      >
        <div className="editor-container">
          <Editor
            value={code}
            onChange={setCode}
            onRun={handleRun}
          />
        </div>

        <OutputPanel
          result={result}
          onClear={handleClear}
        />
      </Split>
    </div>
  );
}

export default App;
