import { useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { initVimMode } from "monaco-vim";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function Editor({ value, onChange, onRun }: EditorProps) {
  const editorRef = useRef<any>(null);
  const vimModeRef = useRef<any>(null);
  const [vimEnabled, setVimEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("axiom-vim-mode") === "true";
    }
    return false;
  });

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register Axiom language
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === "axiom")) {
      monaco.languages.register({ id: "axiom" });

      monaco.languages.setMonarchTokensProvider("axiom", {
        keywords: ["fn", "return", "if", "match", "default", "await", "typeof", "async"],

        booleanLiterals: ["true", "false", "null"],

        typeKeywords: [
          "int",
          "float",
          "string",
          "bool",
          "boolean",
          "array",
          "object",
          "function",
          "void",
          "any",
        ],

        builtins: ["print", "len"],

        schemaKeywords: ["schema"],

        operators: [
          "=",
          ">",
          "<",
          "!",
          "~",
          "?",
          ":",
          "==",
          "<=",
          ">=",
          "!=",
          "&&",
          "||",
          "+",
          "-",
          "*",
          "/",
          "%",
          "=>",
        ],

        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        tokenizer: {
          root: [
            // Whitespace (must be early to consume spaces)
            { include: "@whitespace" },

            // Function declarations - capture function names
            [/\bfn\b/, "keyword", "@function_name"],

            // Identifiers and keywords
            [
              /[a-z_]\w*/,
              {
                cases: {
                  "@keywords": "keyword",
                  "@booleanLiterals": "constant.language",
                  "@typeKeywords": "type",
                  "@builtins": "support.function",
                  "@schemaKeywords": "support.class",
                  "@default": "variable",
                },
              },
            ],

            // Numbers
            [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
            [/0[xX][0-9a-fA-F]+/, "number.hex"],
            [/\d+/, "number"],

            // Strings
            [/"([^"\\]|\\.)*$/, "string.invalid"],
            [/'([^'\\]|\\.)*$/, "string.invalid"],
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"],

            // Delimiters and operators
            [/[{}()\[\]]/, "delimiter.bracket"],
            [
              /@symbols/,
              {
                cases: {
                  "@operators": "operator",
                  "@default": "delimiter",
                },
              },
            ],

            // Delimiters
            [/[;,.]/, "delimiter"],
            [/:/, "delimiter.type"],
          ],

          whitespace: [
            [/[ \t\r\n]+/, ""],
            [/\/\*/, "comment", "@comment"],
            [/\/\/.*$/, "comment"],
          ],

          comment: [
            [/[^\/*]+/, "comment"],
            [/\*\//, "comment", "@pop"],
            [/[\/*]/, "comment"],
          ],

          string_double: [
            [/[^\\"]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/"/, "string", "@pop"],
          ],

          string_single: [
            [/[^\\']+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/'/, "string", "@pop"],
          ],

          function_name: [
            [/[ \t\r\n]+/, ""],
            [/[a-z_]\w*/, "entity.name.function", "@pop"],
            ["", "", "@pop"],
          ],
        },
      });

      // Define Axiom Nova theme
      monaco.editor.defineTheme("axiom-nova", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "", foreground: "DADADA", background: "0F1117" }, // Default foreground
          { token: "keyword", foreground: "C792EA", fontStyle: "bold" }, // Soft lavender - control & syntax
          { token: "constant.language", foreground: "FFCB6B", fontStyle: "bold" }, // Amber - true/false/null
          { token: "type", foreground: "82AAFF" }, // Bright cyan-blue - types
          { token: "support.function", foreground: "FFD580" }, // Soft gold - built-ins (print, len)
          { token: "support.class", foreground: "F07178", fontStyle: "bold" }, // Rose - schema annotations
          { token: "entity.name.function", foreground: "82E2FF" }, // Lively cyan - function names
          { token: "variable", foreground: "E0E0E0" }, // Neutral - variables
          { token: "string", foreground: "C3E88D" }, // Bright green-yellow - strings
          { token: "string.escape", foreground: "7FDBCA" }, // Cool mint - escapes
          { token: "string.invalid", foreground: "FF5370" }, // Red-pink - errors
          { token: "number", foreground: "F78C6C" }, // Orange coral - numbers
          { token: "number.float", foreground: "F78C6C" },
          { token: "number.hex", foreground: "F78C6C" },
          { token: "comment", foreground: "5A6B7C", fontStyle: "italic" }, // Cool gray-blue
          { token: "operator", foreground: "89DDFF" }, // Aqua-blue - operators
          { token: "delimiter", foreground: "89DDFF" }, // Aqua-blue - punctuation
          { token: "delimiter.bracket", foreground: "89DDFF" },
          { token: "delimiter.array", foreground: "89DDFF" },
          { token: "delimiter.parenthesis", foreground: "89DDFF" },
        ],
        colors: {
          "editor.background": "#0F1117", // Deep graphite base
          "editor.foreground": "#DADADA", // Gentle gray-white
          "editorLineNumber.foreground": "#5A6B7C",
          "editorLineNumber.activeForeground": "#89DDFF",
          "editor.lineHighlightBackground": "#1A1E26",
          "editorCursor.foreground": "#89DDFF",
          "editor.selectionBackground": "#264F78",
          "editor.inactiveSelectionBackground": "#1A1E26",
          "editorWhitespace.foreground": "#3A3D41",
          "editorIndentGuide.background": "#3A3D41",
          "editorIndentGuide.activeBackground": "#5A6B7C",
          "editorBracketMatch.background": "#1A1E2666",
          "editorBracketMatch.border": "#89DDFF",
        },
      });

      // Apply the theme immediately
      monaco.editor.setTheme("axiom-nova");

      // Configure auto-indentation
      monaco.languages.setLanguageConfiguration("axiom", {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        surroundingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        indentationRules: {
          increaseIndentPattern: /^(.*\{[^}]*|\([^)]*|\[[^\]]*)$/,
          decreaseIndentPattern: /^(.*\}|\)|\])/,
        },
      });
    }

    // Add keyboard shortcut for running code (Cmd+Enter or Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    // Initialize vim mode if enabled
    if (vimEnabled) {
      const statusNode = document.getElementById("vim-status");
      if (statusNode) {
        vimModeRef.current = initVimMode(editor, statusNode);
      }
    }

    // Focus editor
    editor.focus();
  };

  const toggleVimMode = () => {
    if (!editorRef.current) return;

    const newState = !vimEnabled;
    setVimEnabled(newState);
    localStorage.setItem("axiom-vim-mode", String(newState));

    if (newState) {
      const statusNode = document.getElementById("vim-status");
      if (statusNode) {
        vimModeRef.current = initVimMode(editorRef.current, statusNode);
      }
    } else {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "8px",
          background: "#1e1e1e",
          borderBottom: "1px solid #3e3e3e",
        }}
      >
        <button
          onClick={toggleVimMode}
          style={{
            padding: "4px 12px",
            background: vimEnabled ? "#0e639c" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          {vimEnabled ? "VIM: ON" : "VIM: OFF"}
        </button>
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        {vimEnabled && (
          <div
            id="vim-status"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "#1e1e1e",
              color: "#d4d4d4",
              padding: "4px 12px",
              fontFamily: "monospace",
              fontSize: "12px",
              borderTop: "1px solid #3e3e3e",
              zIndex: 10,
              minWidth: "200px",
            }}
          />
        )}
        <MonacoEditor
          height="100%"
          language="axiom"
          theme="axiom-nova"
          value={value}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: "on",
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: "all",
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              useShadows: false,
            },
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            matchBrackets: "always",
            bracketPairColorization: {
              enabled: false,
            },
          }}
        />
      </div>
    </div>
  );
}
