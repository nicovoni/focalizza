import { useEffect, useRef, useState, useCallback } from 'react'
import Toolbar from './Toolbar'

function Canvas({ file, isTouch, onNew }) {
  const canvasRef = useRef(null)
  const blurCanvasRef = useRef(null)
  const [imageEl, setImageEl] = useState(null)
  const [tool, setTool] = useState('rect')
  const [error, setError] = useState(null)
  const [shapesVisible, setShapesVisible] = useState(true)
  const isDrawing = useRef(false)
  const [isDrawingState, setIsDrawingState] = useState(false)
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
    setError(null)

    if (file.type === 'image') {
      const img = new Image()
      img.onload = () => setImageEl(img)
      img.onerror = () => setError('Impossibile caricare l\'immagine.')
      img.src = file.dataUrl
    }

    if (file.type === 'pdf') {
      // BUG FIX 3: pass ArrayBuffer invece di base64 dataUrl per evitare
      // di tenere l'intero file in memoria due volte.
      convertPdfToImage(file.arrayBuffer)
        .then((img) => setImageEl(img))
        // BUG FIX 5: intercetta errori PDF (cifrati, corrotti, worker fallito)
        // e li mostra all'utente invece di bloccarsi silenziosamente.
        .catch((err) => {
          console.error('Errore PDF:', err)
          setError('Impossibile aprire il PDF. Il file potrebbe essere protetto da password o danneggiato.')
        })
    }
  }, [file])

  // BUG FIX 2: redraw in useCallback per chiudere sempre sui valori
  // correnti di `tool`, `imageEl` e `shapesVisible`, eliminando stale closure.
  const redraw = useCallback((previewStart, previewEnd, currentTool) => {
    if (!imageEl) return
    const canvas = canvasRef.current
    const blurCanvas = blurCanvasRef.current
    const ctx = canvas.getContext('2d')
    const activeTool = currentTool ?? tool

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Se le forme sono nascoste, mostra solo il documento originale
    if (!shapesVisible) {
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
  }, [imageEl, tool, shapesVisible])

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
  }, [imageEl, redraw])

  // Ridisegna ogni volta che shapesVisible cambia
  useEffect(() => {
    redraw()
  }, [shapesVisible, redraw])

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

  // Riporta le forme in vista ogni volta che l'utente interagisce con
  // qualsiasi pulsante della toolbar (eccetto il toggle stesso).
  const showShapes = () => setShapesVisible(true)

  const handleToolChange = (newTool) => {
    showShapes()
    setTool(newTool)
    redraw(null, null, newTool)
  }

  const handleToggleShapes = () => {
    setShapesVisible(prev => !prev)
  }

  const onMouseDown = (e) => {
    if (!imageEl) return

    const pos = getPos(e, canvasRef.current)

    if (tool === 'delete') {
      // BUG FIX 4: cancella il redo stack solo se una forma è stata
      // effettivamente rimossa, non ad ogni click.
      const before = shapes.current.length
      shapes.current = shapes.current.filter(s => !isInsideShape(s, pos))
      if (shapes.current.length !== before) {
        redoStack.current = []
        updateHistory()
      }
      redraw()
      return
    }

    isDrawing.current = true
    setIsDrawingState(true)
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
    setIsDrawingState(false)
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

  // BUG FIX 1: annulla il tratto se il mouse esce dal canvas,
  // così isDrawing non rimane bloccato su true.
  const onMouseLeave = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    setIsDrawingState(false)
    redraw()
  }

  const handleUndo = () => {
    showShapes()
    if (shapes.current.length === 0) return
    const last = shapes.current[shapes.current.length - 1]
    redoStack.current = [...redoStack.current, last]
    shapes.current = shapes.current.slice(0, -1)
    redraw()
    updateHistory()
  }

  const handleRedo = () => {
    showShapes()
    if (redoStack.current.length === 0) return
    const last = redoStack.current[redoStack.current.length - 1]
    shapes.current = [...shapes.current, last]
    redoStack.current = redoStack.current.slice(0, -1)
    redraw()
    updateHistory()
  }

  const handleClear = () => {
    showShapes()
    shapes.current = []
    redoStack.current = []
    redraw()
    updateHistory()
  }

  const handleDownload = () => {
    showShapes()
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
    if (isDrawingState) return 'nw-resize'
    return 'crosshair'
  }

  if (error) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: '#c0392b'
      }}>
        <span style={{ fontSize: '32px' }}>⚠️</span>
        <span style={{ fontSize: '15px' }}>{error}</span>
        <button
          onClick={onNew}
          style={{ marginTop: '8px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Torna all'inizio
        </button>
      </div>
    )
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
          shapesVisible={shapesVisible}
          onToggleShapes={handleToggleShapes}
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
        onMouseLeave={onMouseLeave}
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

// BUG FIX 3: accetta un ArrayBuffer invece di un base64 dataUrl.
// pdfjs consuma i byte raw direttamente, evitando di tenere l'intero
// file in memoria due volte.
async function convertPdfToImage(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
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
  await new Promise((res, rej) => {
    img.onload = res
    img.onerror = rej
  })

  return img
}

export default Canvas
