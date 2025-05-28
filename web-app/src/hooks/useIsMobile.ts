import { useEffect, useRef, useState } from 'react'

type Props = { breakpoint?: number; onChange?: (isM: boolean) => void }
export function useIsMobile({ breakpoint = 768, onChange = () => { } }: Props) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  )
  const prevValueRef = useRef(isMobile)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)

    const handleChange = () => {
      const nextValue = query.matches
      if (nextValue !== prevValueRef.current) {
        prevValueRef.current = nextValue
        setIsMobile(nextValue)
        onChange?.(nextValue)
      }
    }

    // 初始设置
    handleChange()

    // 监听变化
    query.addEventListener?.('change', handleChange)

    return () => {
      query.removeEventListener?.('change', handleChange)
    }
  }, [breakpoint, onChange])

  return isMobile
}
