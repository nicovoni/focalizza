function Toolbar({ tool, onToolChange, onDownload, onUndo, onRedo, onClear, onNew, canUndo, canRedo, shapesVisible, onToggleShapes, downloadBlocked }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '48px',
      background: 'white',
      borderBottom: '1px solid #eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 10
    }}>

      <style>{`
        @keyframes blink-toggle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .blink { animation: blink-toggle 0.8s ease-in-out infinite; }
      `}</style>

      {/* Strumenti disegno */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onToolChange('rect')}
          title="Rettangolo"
          style={{
            width: '36px',
            height: '36px',
            border: tool === 'rect' ? '2px solid black' : '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ▭
        </button>

        <button
          onClick={() => onToolChange('ellipse')}
          title="Ellisse"
          style={{
            width: '36px',
            height: '36px',
            border: tool === 'ellipse' ? '2px solid black' : '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ◯
        </button>

        <button
          onClick={() => onToolChange('delete')}
          title="Elimina forma"
          style={{
            width: '36px',
            height: '36px',
            border: tool === 'delete' ? '2px solid red' : '1px solid #ccc',
            background: tool === 'delete' ? '#fff0f0' : 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Undo / Redo / Clear */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onUndo}
          title="Annulla"
          disabled={!canUndo}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: canUndo ? 'pointer' : 'default',
            fontSize: '18px',
            opacity: canUndo ? 1 : 0.3
          }}
        >
          ↩
        </button>

        <button
          onClick={onRedo}
          title="Ripristina"
          disabled={!canRedo}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: canRedo ? 'pointer' : 'default',
            fontSize: '18px',
            opacity: canRedo ? 1 : 0.3
          }}
        >
          ↪
        </button>

        <button
          onClick={onClear}
          title="Elimina tutto"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          🗑
        </button>
      </div>

      {/* Mostra/nascondi, Download e Nuovo */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onToggleShapes}
          title="Mostra/nascondi forme"
          className={downloadBlocked ? 'blink' : ''}
          style={{
            width: '36px',
            height: '36px',
            border: shapesVisible ? '1px solid #ccc' : '2px solid black',
            background: shapesVisible ? 'white' : '#f0f0f0',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          {shapesVisible ? '👁' : '🙈'}
        </button>

        <button
          onClick={onDownload}
          title={downloadBlocked ? 'Mostra le forme per scaricare' : 'Scarica'}
          disabled={downloadBlocked}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: downloadBlocked ? 'default' : 'pointer',
            fontSize: '18px',
            opacity: downloadBlocked ? 0.3 : 1
          }}
        >
          ↓
        </button>

        <button
          onClick={onNew}
          title="Nuovo documento"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ＋
        </button>
      </div>

    </div>
  )
}

export default Toolbar
