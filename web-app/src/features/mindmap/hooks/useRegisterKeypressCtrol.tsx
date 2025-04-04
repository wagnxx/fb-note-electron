import { useKeyPress } from '@xyflow/react'
import { useEffect, useRef } from 'react'
import React from 'react'

type Props = {
  readonly?: boolean
  cmdAndCPressedFn: () => void
  cmdAndVPressedFn: () => void
  // metaDeletePresseFn: () => void
  targetRef: React.RefObject<HTMLElement>
}

const useRegisterKeypressCtrol = ({
  readonly = false,
  cmdAndCPressedFn,
  cmdAndVPressedFn,
  // metaDeletePresseFn,
  targetRef,
}: Props) => {
  const lastPasteTime = useRef<number>(0)

  const cmdAndCPressed = useKeyPress(['Meta+c', 'Strg+c'], {
    target: targetRef.current ?? undefined,
  })
  const cmdAndVPressed = useKeyPress(['Meta+v', 'Strg+v'], {
    target: targetRef.current ?? undefined,
  })
  // const metaDeletePressed = useKeyPress(['Meta+Backspace', 'Strg+Backspace'])

  // keybaord action
  useEffect(() => {
    if (!readonly && cmdAndCPressed) {
      // 🔍 1. 检查是否选中了文本
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 0) {
        return // ✅ 让默认的文本复制行为生效
      }
      const now = Date.now()
      lastPasteTime.current = now
      cmdAndCPressedFn()
    }
  }, [cmdAndCPressed, cmdAndCPressedFn, readonly])

  useEffect(() => {
    if (!readonly && cmdAndVPressed) {
      // 🔍 1. 检查是否有输入框处于焦点状态
      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return // ✅ 让默认的粘贴行为生效
      }
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
  }, [cmdAndVPressed, cmdAndVPressedFn, readonly])

  // useEffect(() => {
  //   if (!readonly && metaDeletePressed) {
  //     metaDeletePresseFn()
  //   }
  // }, [metaDeletePresseFn, metaDeletePressed, readonly])
  return []
}

export default useRegisterKeypressCtrol
