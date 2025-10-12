import type { ExecutionResult } from "../lib/axiom-runtime";

interface OutputPanelProps {
  result: ExecutionResult | null;
  onClear: () => void;
}

export function OutputPanel({ result, onClear }: OutputPanelProps) {
  return (
    <div className="output-panel">
      <div className="output-header">
        <h3>Output</h3>
        <button onClick={onClear} className="clear-button">
          Clear
        </button>
      </div>

      <div className="output-content">
        {!result
          ? (
            <div className="output-placeholder">
              Click "Run" or press Cmd/Ctrl+Enter to execute code
            </div>
          )
          : (
            <>
              {result.output && <pre className="output-text">{result.output}</pre>}

              {result.error && <pre className="output-error">{result.error}</pre>}

              <div className="output-meta">
                <span className={result.success ? "status-success" : "status-error"}>
                  {result.success ? "✓ Success" : "✗ Error"}
                </span>
                <span className="execution-time">
                  {result.executionTime.toFixed(2)}ms
                </span>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
