import { useState } from 'react'
import UploadArea from './components/UploadArea'
import Canvas from './components/Canvas'
import useDeviceType from './hooks/useDeviceType'

function App() {
  const [file, setFile] = useState(null)
  const isTouch = useDeviceType()

  return (
    <div>
      {!file
        ? <UploadArea onFileLoaded={setFile} />
        : <Canvas file={file} isTouch={isTouch} onNew={() => setFile(null)} />
      }
    </div>
  )
}

export default App