/* eslint-disable @typescript-eslint/no-unused-vars */
import { MutableRefObject, useRef, useState } from 'react'
import './App.css'

import * as monaco from "monaco-editor"

import { string, whitespace, float, Parjser, fail, spaces1, space, result } from 'parjs'
import { between, or, then, qthen, thenq, map, mapConst, many, thenPick } from 'parjs/combinators'

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
  | [op: "pencolor", data: { r: number, g: number, b: number }]


const pFloat = () => float().pipe(thenq(whitespace()))
const pComma = () => string(",").pipe(thenq(whitespace()))

const pTemplate = <T extends string>(key: T) => whitespace().pipe(qthen(key), thenq(space()), thenq(whitespace()), mapConst(key))
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
const pXYZ = () => pFloatComma().pipe(then(pFloatComma(), pFloat())).pipe(map(([r, g, b]) => ({ r, g, b })))
const pGo = () => pTemplate("go").pipe(then(pXY()))
const pPenColor = () => pTemplate("pencolor").pipe(then(pXYZ()))

const pStatement = (): Parjser<Op> =>
  pCenter().pipe(or(pPenUp(), pPenDown())) // 0
    .pipe(or(pForward(), pBackward(), pLeft(), pRight()), or(pDirection(), pGoX(), pGoY(), pPenWidth())) // 1
    .pipe(or(pGo())) // XY
    .pipe(or(pPenColor())) // XYZ
    .pipe(or(fail({reason: "expected one of: center, penup, pendown, forward, backward, turnleft, turnright, direction, gox, goy, penwidth, go, pencolor"})))

interface RGB {r : number, g : number, b : number}
interface XY {x : number, y : number}
interface State {
  direction : number
  penwidth : number
  position : XY
  pencolor : RGB
  penup : boolean
}

function drawOpsOnCanvas(ops : Op [], canvas : HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw Error("Canvas context is null.")

  const centerPos = () => ({x : canvas.width/2, y : canvas.height/2});
  const state : State = {
    direction: 0,
    penwidth: 2,
    position: centerPos(),
    pencolor: {r: 255, g: 255, b: 255},
    penup: true,
  }

  const rgbCssString = ({r,g,b} : RGB) => `rgb(${r},${g},${b})`

  const moveToState = () => {
    ctx.moveTo(state.position.x,state.position.y)
  }
  const center = () => {
    state.position = centerPos()
    moveToState()
  }

  const resetCtx = () => {
    ctx.beginPath()
    ctx.clearRect(0,0,canvas.width,canvas.height)
    moveToState()
    ctx.lineWidth = state.penwidth
    ctx.strokeStyle = rgbCssString(state.pencolor)
  }

  const forward = (q : number) => {
    const hypothenuze = state.direction/360*2*Math.PI
    state.position.x += Math.cos(hypothenuze)*q
    state.position.y += Math.sin(hypothenuze)*q

    if (state.penup) {
      ctx.lineTo(state.position.x,state.position.y)
    } else {
      moveToState()
    }
  }

  const turnright = (q : number) => {
    state.direction = (state.direction + q) % 360
  }

  const direction = (q : number) => {
    state.direction = q % 360;
  }

  const go = (pos : XY) => {
    state.position = pos
    moveToState()
  }

  const penup = (q : boolean) => {
    state.penup = q
  }

  const penwidth = (q : number) => {
    ctx.lineWidth = state.penwidth = q
  }

  const pencolor = (q : RGB) => {
    ctx.strokeStyle = rgbCssString(q)
  }

  resetCtx()
  for (const [op,data] of ops) {
    switch (op) {
      case "forward" : {
        forward(data)
        break;
      }
      case "backward" : {
        forward(-data)
        break
      }
      case "turnright" : {
        turnright(data)
        break
      }
      case "turnleft" : {
        turnright(-data)
        break
      }
      case "direction" : {
        direction(data)
        break
      }
      case "center" : {
        center()
        break
      }
      case "go" : {
        go(data)
        break
      }
      case "gox" : {
        go({...state.position, x: data})
        break
      }
      case "goy" : {
        go({...state.position, y: data})
        break
      }
      case "penup" : {
        penup(true)
        break
      }
      case "pendown" : {
        penup(false)
        break
      }
      case "penwidth" : {
        penwidth(data)
        break
      }
      case 'pencolor': {
        pencolor(data)
        break
      }
      default : {
        throw Error(`Unfilled case for op: ${op}`)
      }
    }
  }
}

function App() {
const editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = useRef(null);
const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null);

function setupMonaco(el: HTMLDivElement) {
  if (!editorRef.current) {
    const uri = monaco.Uri.parse("inmemory://test");
    const value = "forward 150\nbackward"
    const model = monaco.editor.createModel(value, "logo-clone-lang", uri);
    const editor = monaco.editor.create(el, { model });
    const f = () => {
      const ops = validate(model)
      ops ? drawOps(ops) : null
    }
    f()
    model.onDidChangeContent(f);
    editorRef.current = editor
  }
}

const drawOps = (ops: Op[]) => {
  const canvas = canvasRef.current
  if (!canvas) return
    drawOpsOnCanvas(ops,canvas)
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
    return errors.length === 0 ? ops : null
  }



  return (
    <div style={{ width: "1800px", height: "900px", backgroundColor: "lightgray", border: "2px gray solid", display: "flex", flexDirection: "row" }}>
      <div style={{ flex: 1 }}>
        <div ref={setupMonaco} style={{ height: "100%" }}></div>
      </div>
      <div style={{ flex: 1 }}>
        <div>
          <canvas ref={canvasRef} >Your browser does not support the canvas element.</canvas>
        </div>
      </div>
    </div>
  )
}

export default App
