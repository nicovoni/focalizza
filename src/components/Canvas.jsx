import { useEffect, useRef, useState } from 'react'
import Toolbar from './Toolbar'

function Canvas({ file, isTouch, onNew }) {
  const canvasRef = useRef(null)
  const blurCanvasRef = useRef(null)
  const [imageEl, setImageEl] = useState(null)
  const [tool, setTool] = useState('rect')
  const isDrawing = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const shapes = useRef([])
  const redoStack = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateHistory = () => {
    setCanUndo(shapes.current.length > 0)
    setCanRedo(redoStack.current.length > 0)
  }

  useEffect(() => {
    if (!file) return
    if (file.type === 'image') {
      const img = new Image()
      img.onload = () => setImageEl(img)
      img.src = file.dataUrl
    }
    if (file.type === 'pdf') {
      convertPdfToImage(file.dataUrl).then((img) => setImageEl(img))
    }
  }, [file])

  useEffect(() => {
    if (!imageEl) return
    const canvas = canvasRef.current
    const blurCanvas = blurCanvasRef.current

    canvas.width = imageEl.width
    canvas.height = imageEl.height
    blurCanvas.width = imageEl.width
    blurCanvas.height = imageEl.height

    const blurCtx = blurCanvas.getContext('2d')
    blurCtx.filter = 'blur(8px)'
    blurCtx.drawImage(imageEl, 0, 0)
    blurCtx.filter = 'none'
    blurCtx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    blurCtx.fillRect(0, 0, blurCanvas.width, blurCanvas.height)

    redraw()
  }, [imageEl])

  const redraw = (previewStart, previewEnd, currentTool) => {
    if (!imageEl) return
    const canvas = canvasRef.current
    const blurCanvas = blurCanvasRef.current
    const ctx = canvas.getContext('2d')
    const activeTool = currentTool || tool

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Modalità anteprima — mostra documento originale
    if (activeTool === 'preview') {
      ctx.drawImage(imageEl, 0, 0)
      return
    }

    const allShapes = [...shapes.current]
    if (previewStart && previewEnd) {
      allShapes.push({ start: previewStart, end: previewEnd, tool: activeTool })
    }

    if (allShapes.length === 0) {
      ctx.drawImage(imageEl, 0, 0)
      return
    }

    ctx.drawImage(imageEl, 0, 0)
    ctx.drawImage(blurCanvas, 0, 0)

    ctx.globalCompositeOperation = 'destination-out'
    allShapes.forEach(shape => drawShape(ctx, shape))
    ctx.globalCompositeOperation = 'source-over'

    allShapes.forEach(shape => {
      const x = Math.min(shape.start.x, shape.end.x)
      const y = Math.min(shape.start.y, shape.end.y)
      const w = Math.abs(shape.end.x - shape.start.x)
      const h = Math.abs(shape.end.y - shape.start.y)

      if (w < 5 || h < 5) return

      ctx.save()
      ctx.beginPath()

      if (shape.tool === 'rect') {
        ctx.rect(x, y, w, h)
      } else if (shape.tool === 'ellipse') {
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      }

      ctx.clip()
      ctx.drawImage(imageEl, 0, 0)
      ctx.restore()
    })
  }

  const drawShape = (ctx, shape) => {
    const x = Math.min(shape.start.x, shape.end.x)
    const y = Math.min(shape.start.y, shape.end.y)
    const w = Math.abs(shape.end.x - shape.start.x)
    const h = Math.abs(shape.end.y - shape.start.y)

    if (w < 5 || h < 5) return

    ctx.beginPath()
    if (shape.tool === 'rect') {
      ctx.rect(x, y, w, h)
    } else if (shape.tool === 'ellipse') {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  const isInsideShape = (shape, pos) => {
    const x = Math.min(shape.start.x, shape.end.x)
    const y = Math.min(shape.start.y, shape.end.y)
    const w = Math.abs(shape.end.x - shape.start.x)
    const h = Math.abs(shape.end.y - shape.start.y)

    if (shape.tool === 'rect') {
      return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h
    }
    if (shape.tool === 'ellipse') {
      const cx = x + w / 2
      const cy = y + h / 2
      return ((pos.x - cx) ** 2) / (w / 2) ** 2 + ((pos.y - cy) ** 2) / (h / 2) ** 2 <= 1
    }
    return false
  }

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleToolChange = (newTool) => {
    setTool(newTool)
    redraw(null, null, newTool)
  }

  const onMouseDown = (e) => {
    if (!imageEl) return
    if (tool === 'preview') return

    const pos = getPos(e, canvasRef.current)

    if (tool === 'delete') {
      shapes.current = shapes.current.filter(s => !isInsideShape(s, pos))
      redoStack.current = []
      redraw()
      updateHistory()
      return
    }

    isDrawing.current = true
    startPos.current = pos
  }

  const onMouseMove = (e) => {
    if (!isDrawing.current || !imageEl) return
    const currentPos = getPos(e, canvasRef.current)
    redraw(startPos.current, currentPos)
  }

  const onMouseUp = (e) => {
    if (!isDrawing.current || !imageEl) return
    isDrawing.current = false
    const endPos = getPos(e, canvasRef.current)

    const w = Math.abs(endPos.x - startPos.current.x)
    const h = Math.abs(endPos.y - startPos.current.y)

    if (w > 5 && h > 5) {
      shapes.current = [...shapes.current, {
        start: startPos.current,
        end: endPos,
        tool
      }]
      redoStack.current = []
      updateHistory()
    }

    redraw()
  }

  const handleUndo = () => {
    if (shapes.current.length === 0) return
    const last = shapes.current[shapes.current.length - 1]
    redoStack.current = [...redoStack.current, last]
    shapes.current = shapes.current.slice(0, -1)
    redraw()
    updateHistory()
  }

  const handleRedo = () => {
    if (redoStack.current.length === 0) return
    const last = redoStack.current[redoStack.current.length - 1]
    shapes.current = [...shapes.current, last]
    redoStack.current = redoStack.current.slice(0, -1)
    redraw()
    updateHistory()
  }

  const handleClear = () => {
    shapes.current = []
    redoStack.current = []
    redraw()
    updateHistory()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = 'documento-annotato.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleNew = () => {
    const confirmed = window.confirm('Creare un nuovo lavoro? Il canvas attuale verrà azzerato.')
    if (confirmed) onNew()
  }

  const getCursor = () => {
    if (tool === 'delete') return 'not-allowed'
    if (tool === 'preview') return 'default'
    return 'crosshair'
  }

  return (
    <div style={{ position: 'relative' }}>
      {!isTouch && (
        <Toolbar
          tool={tool}
          onToolChange={handleToolChange}
          onDownload={handleDownload}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onNew={handleNew}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}

      <canvas
        ref={blurCanvasRef}
        style={{ display: 'none' }}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'block',
          margin: '0 auto',
          marginTop: !isTouch ? '48px' : '0',
          cursor: getCursor()
        }}
      />
    </div>
  )
}

async function convertPdfToImage(dataUrl) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const loadingTask = pdfjsLib.getDocument(dataUrl)
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)

  const viewport = page.getViewport({ scale: 2 })
  const offscreen = document.createElement('canvas')
  offscreen.width = viewport.width
  offscreen.height = viewport.height

  await page.render({
    canvasContext: offscreen.getContext('2d'),
    viewport
  }).promise

  const img = new Image()
  img.src = offscreen.toDataURL()
  await new Promise((res) => (img.onload = res))

  return img
}

export default Canvas