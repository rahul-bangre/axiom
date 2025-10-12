import { useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function Editor({ value, onChange, onRun }: EditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register Axiom language
    if (!monaco.languages.getLanguages().some((lang) => lang.id === "axiom")) {
      monaco.languages.register({ id: "axiom" });

      monaco.languages.setMonarchTokensProvider("axiom", {
        keywords: [
          "fn",
          "return",
          "if",
          "true",
          "false",
          "null",
          "schema",
        ],

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
          "++",
          "--",
          "+",
          "-",
          "*",
          "/",
          "&",
          "|",
          "^",
          "%",
          "+=",
          "-=",
          "*=",
          "/=",
          "&=",
          "|=",
          "^=",
          "%=",
          "=>",
        ],

        symbols: /[=><!~?:&|+\-*\/\^%]+/,

        tokenizer: {
          root: [
            // Identifiers and keywords
            [/[a-z_]\w*/, {
              cases: {
                "@keywords": "keyword",
                "@default": "identifier",
              },
            }],

            // Whitespace
            { include: "@whitespace" },

            // Numbers
            [/\d+(\.\d+)?/, "number"],

            // Strings
            [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
            [/'([^'\\]|\\.)*$/, "string.invalid"], // non-teminated string
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"],

            // Delimiters and operators
            [/[{}()\[\]]/, "@brackets"],
            [/[<>](?!@symbols)/, "@brackets"],
            [/@symbols/, {
              cases: {
                "@operators": "operator",
                "@default": "",
              },
            }],

            // Delimiter
            [/[;,.]/, "delimiter"],
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
            [/\\./, "string.escape"],
            [/"/, "string", "@pop"],
          ],

          string_single: [
            [/[^\\']+/, "string"],
            [/\\./, "string.escape"],
            [/'/, "string", "@pop"],
          ],
        },
      });
    }

    // Add keyboard shortcut for running code (Cmd+Enter or Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    // Focus editor
    editor.focus();
  };

  return (
    <MonacoEditor
      height="100%"
      language="axiom"
      theme="vs-dark"
      value={value}
      onChange={(value) => onChange(value || "")}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        lineNumbers: "on",
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        renderLineHighlight: "all",
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
        },
      }}
    />
  );
}
