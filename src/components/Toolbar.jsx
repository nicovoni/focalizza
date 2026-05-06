function Toolbar({ tool, onToolChange, onDownload, onUndo, onRedo, onClear, onNew, canUndo, canRedo }) {
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

      {/* Anteprima, Download e Nuovo */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onToolChange('preview')}
          title="Anteprima documento"
          style={{
            width: '36px',
            height: '36px',
            border: tool === 'preview' ? '2px solid black' : '1px solid #ccc',
            background: tool === 'preview' ? '#f0f0f0' : 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          👁
        </button>

        <button
          onClick={onDownload}
          title="Scarica"
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #ccc',
            background: 'white',
            cursor: 'pointer',
            fontSize: '18px'
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