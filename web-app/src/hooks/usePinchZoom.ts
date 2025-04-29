import { useState, useEffect, useCallback, useRef, SetStateAction, Dispatch } from 'react'

// 自定义 debounce 实现
export const useDebounce = (func: Function, delay: number) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedFunction = useCallback(
    (...args: any[]) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current) // 清除上一个定时器
      timerRef.current = setTimeout(() => func(...args), delay) // 设置新定时器
    },
    [func, delay], // 不需要 timer 作为依赖
  )

  return debouncedFunction
}

export const useThrottle = (callback: Function, delay: number) => {
  const [lastExecuted, setLastExecuted] = useState<number>(0)

  const throttle = (...args: any[]) => {
    const now = Date.now()
    if (now - lastExecuted > delay) {
      callback(...args)
      setLastExecuted(now)
    }
  }

  return throttle
}

type PinchParams = {
  step?: number
  max?: number
  min?: number
}
export const usePinchZoom = ({ step = 0.1, max = 3, min = 0.5 }: PinchParams = {}): [
  number,
  Dispatch<SetStateAction<number>>,
] => {
  // const { step = 0.1, max = 3 } = params
  const [scale, setScale] = useState(1)

  // 处理鼠标滚轮事件，进行缩放
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      // 按住 Ctrl 键触发缩放
      e.preventDefault()
      setScale(prevScale => Math.min(Math.max(prevScale + e.deltaY * -step, min), max))
    }
  }

  // 使用自定义 debounce 函数包裹 handleWheel
  const debouncedWheel = useDebounce(handleWheel, 100) // 防抖时间 100ms

  useEffect(() => {
    // 添加滚轮事件监听
    window.addEventListener('wheel', debouncedWheel)

    // 清理事件监听
    return () => {
      window.removeEventListener('wheel', debouncedWheel)
    }
  }, [debouncedWheel])

  return [scale, setScale]
}
