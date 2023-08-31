/* eslint-disable no-unexpected-multiline */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MutableRefObject, useRef, useState } from 'react'
import './App.css'

import Editor, {Monaco} from '@monaco-editor/react'
import { editor, MarkerSeverity } from "monaco-editor"

import {string, whitespace, float, Parjser, ParjsCombinator} from 'parjs'
import {between, or, then, qthen, thenq, map, mapConst, many} from 'parjs/combinators'

type Op =
  | [op: "center"]
  | [op: "penup"]
  | [op: "pendown"]
  | [op: "forward", length: number]
  | [op: "backward", length: number]
  | [op: "turnleft", degree: number]
  | [op: "turnright", degree: number]
  | [op: "direction", degree: number]
  | [op: "gox", x: number]
  | [op: "goy", y: number]
  | [op: "penwidth", width: number]
  | [op: "go", data: {x: number, y: number}]
  | [op: "pencolor", data: {x : number, y : number,z : number}]


const pFloat = () => float().pipe(thenq(whitespace()))
const pComma = () => string(",").pipe(thenq(whitespace()))

const pTemplate = <T extends string>(key : T) => whitespace().pipe(qthen(key)).pipe((thenq(whitespace()))).pipe(mapConst(key))
const pZero = <T extends string>(key : T) => pTemplate(key).pipe(map((x) : [T] => [x]))
const pCenter = () => pZero("center")
const pPenUp = () => pZero("penup")
const pPenDown = () => pZero("pendown")

const pOne = <T extends string>(key : T) => pTemplate(key).pipe(then(pFloat()))
const pForward = () => pOne("forward")
const pBackward = () => pOne("backward")
const pLeft = () => pOne("turnleft")
const pRight = () => pOne("turnright")
const pDirection = () => pOne("direction")
const pGoX = () => pOne("gox")
const pGoY = () => pOne("goy")
const pPenWidth = () => pOne("penwidth")

const pFloatComma = () => pFloat().pipe(thenq(pComma()))
const pXY = () => pFloatComma().pipe(then(pFloat())).pipe(map(([x,y]) => ({x,y})))
const pXYZ = () => pFloatComma().pipe(then(pFloatComma(), pFloat())).pipe(map(([x,y,z]) => ({x,y,z})))
const pGo = () => pTemplate("go").pipe(then(pXY()))
const pPenColor = () => pTemplate("pencolor").pipe(then(pXYZ()))

const pStatement = () : Parjser<Op> =>
  pCenter().pipe(or(pPenUp(), pPenDown())) // 0
    .pipe(or(pForward(),pBackward(),pLeft(),pRight())) // 1
    .pipe(or(pDirection(), pGoX(), pGoY(), pPenWidth())) // 1
    .pipe(or(pGo())) // XY
    .pipe(or(pPenColor())) // XYZ

const pLogo = () : Parjser<Op[]> =>
  pStatement().pipe(many())

function App() {
  const editorRef : MutableRefObject<editor.IStandaloneCodeEditor | null> = useRef(null);
  const canvasRef : MutableRefObject<HTMLCanvasElement | null> = useRef(null);

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
  }

  function showValue() {
    const x = editorRef.current
    if (!x) throw Error("Editor not defined.")
    
    const model = x.getModel()
    if (!model) throw Error("Model not defined.")
    const m : editor.IMarkerData = {
      severity: MarkerSeverity.Error,
      message: "qwe",
      startLineNumber: 1,
      endLineNumber: 2,
      startColumn: 1,
      endColumn: 1,
    }
    
    const old = editor.getModelMarkers({})
    alert(JSON.stringify(old))
    editor.setModelMarkers(model,'',[m])
    const text = model.getValue()
    // alert(text)
    // alert(pLogo().parse(text));
  }

  function drawSomething(): void {
    const canvas = canvasRef.current
    if (!canvas) throw Error("Canvas not defined.")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw Error("Canvas is null.")

    ctx.fillRect(50, 50, 100, 100);
  }

  return (
    <div style={{width: "1800px", height: "900px", backgroundColor: "lightgray", border: "2px gray solid", display: "flex", flexDirection: "row"}}>
      <div style={{flex: 1}}>
        <button onClick={showValue}>Show value</button>
        <Editor 
          defaultValue="forward 150
backward"
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
