import { useKeyPress } from '@xyflow/react'
import { useEffect, useRef } from 'react'

type Props = {
  cmdAndCPressedFn: () => void
  cmdAndVPressedFn: () => void
  metaDeletePresseFn: () => void
}

const useRegisterKeypressCtrol = ({ cmdAndCPressedFn, cmdAndVPressedFn, metaDeletePresseFn }: Props) => {
  const lastPasteTime = useRef<number>(0)

  const cmdAndCPressed = useKeyPress(['Meta+c', 'Strg+c'])
  const cmdAndVPressed = useKeyPress(['Meta+v', 'Strg+v'])
  const metaDeletePressed = useKeyPress(['Meta+Backspace', 'Strg+Backspace'])

  // keybaord action
  useEffect(() => {
    if (cmdAndCPressed) {
      const now = Date.now()
      lastPasteTime.current = now
      cmdAndCPressedFn()
    }
  }, [cmdAndCPressed, cmdAndCPressedFn])

  useEffect(() => {
    if (cmdAndVPressed) {
      const now = Date.now()
      if (now - lastPasteTime.current < 300) {
        return // 防止短时间重复粘贴
      }
      // if (now - lastPasteTime.current > 1000 * 60 * 60) {
      //   return // 防止短时间重复粘贴
      // }
      lastPasteTime.current = now

      cmdAndVPressedFn()
    }
  }, [cmdAndVPressed, cmdAndVPressedFn])

  useEffect(() => {
    if (metaDeletePressed) {
      metaDeletePresseFn()
    }
  }, [metaDeletePresseFn, metaDeletePressed])
  return []
}

export default useRegisterKeypressCtrol
