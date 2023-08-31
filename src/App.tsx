/* eslint-disable @typescript-eslint/no-unused-vars */
import { MutableRefObject, useRef, useState } from 'react'
import './App.css'

import Editor, {Monaco} from '@monaco-editor/react'
import { editor } from "monaco-editor"

function App() {
  const editorRef : MutableRefObject<editor.IStandaloneCodeEditor | null> = useRef(null);
  const canvasRef : MutableRefObject<HTMLCanvasElement | null> = useRef(null);

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
  }

  function showValue() {
    alert(editorRef.current?.getValue());
  }

  function drawSomething(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) throw Error("Context not defined.")
    ctx.fillRect(50, 50, 100, 100);
  }

  return (
    <div style={{width: "1800px", height: "900px", backgroundColor: "lightgray", border: "2px gray solid", display: "flex", flexDirection: "row"}}>
      <div style={{flex: 1}}>
        <button onClick={showValue}>Show value</button>
        <Editor 
          defaultLanguage="javascript" 
          defaultValue="// some comment" 
          onMount={handleEditorDidMount}
          />
      </div>
      <div style={{flex: 1}}>
        <button onClick={drawSomething}>Draw Something</button>
        <div>
          <canvas ref={canvasRef}>Your browser does not support the canvas element.</canvas>
        </div>
      </div>
    </div>
  )
}

export default App
