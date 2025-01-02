import React, { useRef, useState, useEffect } from 'react'

// Declare the FullscreenResult interface with 'void' return type for goFullscreen and exitFullscreen
interface FullscreenResult<T extends HTMLElement> {
  elementRef: React.RefObject<T>
  isFullscreen: boolean
  goFullscreen: () => void // should return void
  exitFullscreen: () => void // should return void
}

export const useFullscreen = <T extends HTMLElement>(): FullscreenResult<T> => {
  const elementRef = useRef<T | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const goFullscreen = (): void => {
    if (elementRef.current) {
      if (elementRef.current.requestFullscreen) {
        elementRef.current.requestFullscreen()
      } else if ((elementRef.current as any).mozRequestFullScreen) {
        // Firefox
        ;(elementRef.current as any).mozRequestFullScreen()
      } else if ((elementRef.current as any).webkitRequestFullscreen) {
        // Chrome, Safari, Opera
        ;(elementRef.current as any).webkitRequestFullscreen()
      } else if ((elementRef.current as any).msRequestFullscreen) {
        // IE/Edge
        ;(elementRef.current as any).msRequestFullscreen()
      }
    }
  }

  const exitFullscreen = (): void => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      // Chrome, Safari
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      // Firefox
      ;(document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      // IE/Edge
      ;(document as any).msExitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) {
        setIsFullscreen(true)
      } else {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  return {
    elementRef,
    isFullscreen,
    goFullscreen,
    exitFullscreen,
  }
}
