function UploadArea({ onFileLoaded }) {

  const handleFile = (file) => {
    if (!file) return

    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    const isImage = imageTypes.includes(file.type)
    const isPDF = file.type === 'application/pdf'

    if (!isImage && !isPDF) {
      alert('Formato non supportato. Carica un\'immagine o un PDF.')
      return
    }

    if (isImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onFileLoaded({
          dataUrl: e.target.result,
          type: 'image',
          name: file.name
        })
      }
      reader.readAsDataURL(file)
    }

    if (isPDF) {
      // BUG FIX 3 (companion change): read PDFs as ArrayBuffer instead of
      // base64 dataUrl so Canvas can pass raw bytes directly to pdfjs,
      // avoiding keeping the entire file in memory twice.
      const reader = new FileReader()
      reader.onload = (e) => {
        onFileLoaded({
          arrayBuffer: e.target.result,
          type: 'pdf',
          name: file.name
        })
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf'
    input.onchange = (e) => handleFile(e.target.files[0])
    input.click()
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        gap: '12px'
      }}
    >
      <span style={{ fontSize: '48px' }}>+</span>
      <span style={{ fontSize: '14px', color: '#999' }}>carica un file</span>
    </div>
  )
}

export default UploadArea
