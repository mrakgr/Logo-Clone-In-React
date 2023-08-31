/* eslint-disable @typescript-eslint/no-unused-vars */
import * as monaco from "monaco-editor"

function validate(model: monaco.editor.ITextModel) {
  const markers = [];
  // lines start at 1
  for (let i = 1; i < model.getLineCount() + 1; i++) {
    const range = {
      startLineNumber: i,
      startColumn: 1,
      endLineNumber: i,
      endColumn: model.getLineLength(i) + 1,
    };
    const content = model.getValueInRange(range).trim();
    const number = Number(content);
    if (Number.isNaN(number)) {
      markers.push({
        message: "not a number",
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: range.startLineNumber,
        startColumn: range.startColumn,
        endLineNumber: range.endLineNumber,
        endColumn: range.endColumn,
      });
    } else if (!Number.isInteger(number)) {
      markers.push({
        message: "not an integer",
        severity: monaco.MarkerSeverity.Warning,
        startLineNumber: range.startLineNumber,
        startColumn: range.startColumn,
        endLineNumber: range.endLineNumber,
        endColumn: range.endColumn,
      });
    }
  }
  monaco.editor.setModelMarkers(model, "", markers);
}

const value = `12346
abcd
234.56
12345
abcd
234.56`;
const uri = monaco.Uri.parse("inmemory://test");
const model = monaco.editor.createModel(value, "plaintext", uri);
const editor = monaco.editor.create(document.getElementById("root")!, { model });
validate(model);
model.onDidChangeContent(() => {
  validate(model);
});


// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
// import './index.css'

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )
