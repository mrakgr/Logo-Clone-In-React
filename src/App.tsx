/* eslint-disable no-unexpected-multiline */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MutableRefObject, useRef, useState } from 'react'
import './App.css'

import * as monaco from "monaco-editor"

import { string, whitespace, float, Parjser, fail, spaces1, space } from 'parjs'
import { between, or, then, qthen, thenq, map, mapConst, many } from 'parjs/combinators'

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
  | [op: "go", data: { x: number, y: number }]
  | [op: "pencolor", data: { x: number, y: number, z: number }]


const pFloat = () => float().pipe(thenq(whitespace()))
const pComma = () => string(",").pipe(thenq(whitespace()))

const pTemplate = <T extends string>(key: T) => whitespace().pipe(qthen(key)).pipe((thenq(space()))).pipe((thenq(whitespace()))).pipe(mapConst(key))
const pZero = <T extends string>(key: T) => pTemplate(key).pipe(map((x): [T] => [x]))
const pCenter = () => pZero("center")
const pPenUp = () => pZero("penup")
const pPenDown = () => pZero("pendown")

const pOne = <T extends string>(key: T) => pTemplate(key).pipe(then(pFloat()))
const pForward = () => pOne("forward")
const pBackward = () => pOne("backward")
const pLeft = () => pOne("turnleft")
const pRight = () => pOne("turnright")
const pDirection = () => pOne("direction")
const pGoX = () => pOne("gox")
const pGoY = () => pOne("goy")
const pPenWidth = () => pOne("penwidth")

const pFloatComma = () => pFloat().pipe(thenq(pComma()))
const pXY = () => pFloatComma().pipe(then(pFloat())).pipe(map(([x, y]) => ({ x, y })))
const pXYZ = () => pFloatComma().pipe(then(pFloatComma(), pFloat())).pipe(map(([x, y, z]) => ({ x, y, z })))
const pGo = () => pTemplate("go").pipe(then(pXY()))
const pPenColor = () => pTemplate("pencolor").pipe(then(pXYZ()))

const pStatement = (): Parjser<Op> =>
  pCenter().pipe(or(pPenUp(), pPenDown())) // 0
    .pipe(or(pForward(), pBackward(), pLeft(), pRight())) // 1
    .pipe(or(pDirection(), pGoX(), pGoY(), pPenWidth())) // 1
    .pipe(or(pGo())) // XY
    .pipe(or(pPenColor())) // XYZ
    .pipe(or(fail({reason: "expected one of: center, penup, pendown, forward, backward, turnleft, turnright, direction, gox, goy, penwidth, go, pencolor"})))

function App() {
  const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);
  const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);

  function setupMonaco(el: HTMLDivElement) {
    if (!editorRef.current) {
      const uri = monaco.Uri.parse("inmemory://test");
      const value = "forward 150\nbackward"
      const model = monaco.editor.createModel(value, "logo-clone-lang", uri);
      const editor = monaco.editor.create(el, { model });
      validate(model);
      model.onDidChangeContent(() => {
        validate(model);
      });
      editorRef.current = editor
    }
  }

  function validate(model: monaco.editor.ITextModel) {
    const statements = model.getLinesContent().map((x, i) => ({ line: i + 1, statement: pStatement().parse(x) }))
    const errors: monaco.editor.IMarkerData[] = []
    const ops: Op[] = []
    for (const st of statements) {
      switch (st.statement.kind) {
        case 'OK': {
          ops.push(st.statement.value)
          break
        }
        default: {
          errors.push({
            severity: monaco.MarkerSeverity.Error,
            message: st.statement.reason.toString(),
            startLineNumber: st.line,
            endLineNumber: st.line,
            startColumn: st.statement.trace.location.column,
            endColumn: model.getLineLength(st.line)+1,
          })
          break
        }
      }
    }
    monaco.editor.setModelMarkers(model, '', errors)
  }

  function showValue() {
    const x = editorRef.current
    if (!x) throw Error("Editor not defined.")

    const model = x.getModel()
    if (!model) throw Error("Model not defined.")
    validate(model)
  }

  function drawSomething(): void {
    const canvas = canvasRef.current
    if (!canvas) throw Error("Canvas not defined.")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw Error("Canvas is null.")

    ctx.fillRect(50, 50, 100, 100);
  }

  return (
    <div style={{ width: "1800px", height: "900px", backgroundColor: "lightgray", border: "2px gray solid", display: "flex", flexDirection: "row" }}>
      <div style={{ flex: 1 }}>
        <button onClick={showValue}>Show value</button>
        <div ref={setupMonaco} style={{ height: "100%" }}></div>
      </div>
      <div style={{ flex: 1 }}>
        <button onClick={drawSomething}>Draw Something</button>
        <div>
          <canvas ref={canvasRef} >Your browser does not support the canvas element.</canvas>
        </div>
      </div>
    </div>
  )
}

export default App
