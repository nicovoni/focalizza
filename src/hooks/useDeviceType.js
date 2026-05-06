import { useState, useEffect } from 'react'

function useDeviceType() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    setIsTouch(query.matches)

    const handler = (e) => setIsTouch(e.matches)
    query.addEventListener('change', handler)

    return () => query.removeEventListener('change', handler)
  }, [])

  return isTouch
}

export default useDeviceType